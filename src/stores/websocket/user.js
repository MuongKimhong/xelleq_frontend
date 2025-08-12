// websocket connection for every authenticated user
// to listen on which server/room is on voice call

import { ref} from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useRoute } from "vue-router"
import { useNotificationStore } from '@/stores/notification.js'
import { useUserStore } from "../user.js"
import { useServerStore } from '../server.js'
import { useChatStore, useVoiceCallStore } from "../chat.js"
import api from "@/axios.js"

export const useUserWS = defineStore('userWSStore', () => {
  const route = useRoute()
  const interval = ref(null)

  const serverStore = useServerStore()
  const { serverData, joinedServers } = storeToRefs(serverStore)

  const userStore = useUserStore()
  const { user }  = storeToRefs(userStore)

  const chatStore = useChatStore()
  const { rooms, openingRoom } = storeToRefs(chatStore)

  const notificationStore = useNotificationStore()
  const { notifications, newNotificationCount } = storeToRefs(notificationStore)

  const voiceCallStore = useVoiceCallStore()

  const userWS = ref(null)

  function connect() {
    if (user.value.authenticated) {
      let path = `/users/user-websocket/${user.value.id}`
      let url = api.defaults.baseURL.replace(/^http/, 'ws') + path
      userWS.value = new WebSocket(url)

      userWS.value.onopen = () => {
        // ping every 30 seconds to keep connection alive
        interval.value = setInterval(() => {
          if (userWS.value && userWS.value.readyState === WebSocket.OPEN) {
            userWS.value.send(JSON.stringify({ type: "ping" }));
          }
        }, 30 * 1000);
      };

      userWS.value.onclose = () => {
        if (interval.value) {
          clearInterval(interval.value);
          interval.value = null
        }
      };
    }
  }

  function disconnect() {
    if (userWS.value) {
      userWS.value.close()
      userWS.value = null
    }
    if (interval.value) {
      clearInterval(interval.value);
      interval.value = null
    }
  }

  function updateOnVoiceCallFlag(flag, wsData) {
    if (serverData.value) {
      if (serverData.value.id === wsData['server_id']) {
        serverData.value['on_voice_call'] = flag
      }
    }

    if (openingRoom.value) {
      if (openingRoom.value.id === wsData["room_id"]) {
        openingRoom.value['on_voice_call'] = flag
      }
    }

    if (rooms.value.length > 0) {
      let index = rooms.value.findIndex((r) => r.id === wsData['room_id'])

      if (index !== -1) {
        rooms.value[index].on_voice_call = flag

        if (flag) {
          rooms.value[index].active_voice_channel = wsData['channel']
        } else {
          rooms.value[index].active_voice_channel = null
        }
      }
    }

    if (joinedServers.value.length > 0) {
      let index = joinedServers.value.findIndex((s) => s.id === wsData['server_id'])

      if (index !== -1) {
        joinedServers.value[index].on_voice_call = flag
      }
    }
  }

  async function handleMessageType(parsedData) {
    let msgType = parsedData['User'].msg_type
    let data = parsedData['User'].data

    switch (msgType) {
      case "VoiceCallStart":
        updateOnVoiceCallFlag(true, data)
        break

      case "VoiceCallEnd":
        updateOnVoiceCallFlag(false, data)
        try {
          await voiceCallStore.cleanUpChannel()
        }
        catch (_) {}
        break

      case "NewPostNotification":
        if (route.name !== 'notifications') {
          newNotificationCount.value += 1
        } else {
          // notifications.value.unshift(data['notification'])

          // if new notification type is 'like' or 'like_comment',
          // remove old one that associate with it

          let newNot = data['notification']

          if (newNot.notification_type === "like") {
            let index = notifications.value.findIndex((n) => {
              return (n.post_id === newNot['post_id']) && (n.notification_type === "like")
            })

            if (index !== -1) {
              notifications.value.splice(index, 1)
            }
          }
          else if (newNot.notification_type === "like_comment") {
            let index = notifications.value.findIndex((n) => {
              return (n.post_id === newNot['post_id']) &&
              (n.comment_id === newNot['comment_id']) &&
              (n.notification_type === "like_comment")
            })

            if (index !== -1) {
              notifications.value.splice(index, 1)
            }
          }
          notifications.value.unshift(newNot)
        }
        break
    }
  }

  return {
    userWS,
    connect,
    disconnect,
    handleMessageType,
    updateOnVoiceCallFlag
  }
})
