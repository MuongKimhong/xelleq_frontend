import { ref} from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useUserStore } from "../user.js"
import { useServerStore } from '../server.js'
import { useChatStore } from "../chat.js"
import api from "@/axios.js"

export const useChatWS = defineStore('chatWS', () => {
  const interval = ref(null)
  const serverStore = useServerStore()
  const { serverData, joinedServers } = storeToRefs(serverStore)

  const userStore = useUserStore()
  const { user }  = storeToRefs(userStore)

  const chatStore = useChatStore()
  const { openingRoom, rooms, messages, pinnedMessage } = storeToRefs(chatStore)

  const chatWS = ref(null)

  function connect() {
    if (serverData.value) {
      let path = `/rooms/chat-websocket/${serverData.value.id}`
      let url = api.defaults.baseURL.replace(/^http/, 'ws') + path
      chatWS.value = new WebSocket(url)

      chatWS.value.onopen = () => {
        // ping every 30 seconds to keep connection alive
        interval.value = setInterval(() => {
          if (chatWS.value && chatWS.value.readyState === WebSocket.OPEN) {
            chatWS.value.send(JSON.stringify({ type: "ping" }));
          }
        }, 30 * 1000);
      };

      chatWS.value.onclose = () => {
        if (interval.value) {
          clearInterval(interval.value);
          interval.value = null
        }
      };
    }
  }

  function disconnect() {
    if (chatWS.value) {
      chatWS.value.close()
      chatWS.value = null
    }
    if (interval.value) {
      clearInterval(interval.value)
      interval.value = null
    }
  }

  function handleMessageType(parsedData) {
    let msgType = parsedData['Chat'].msg_type
    let data = parsedData['Chat'].data

    switch (msgType) {
      case "NewRoom":
        rooms.value.unshift(data["new_room"])
        break

      case "RenameRoom":
        if (rooms.value.length > 0) {
          let index = rooms.value.findIndex((r) => r.id === data['room_id'])

          if (index !== -1) {
            rooms.value[index].name = data["new_name"]
          }
        }

        if (openingRoom.value) {
          if (openingRoom.value.id === data['room_id']) {
            openingRoom.value.name = data["new_name"]
          }
        }
        break

      case "NewMessage":
        let newMsgRoomId = data["room_id"]

        if ((openingRoom.value?.id !== newMsgRoomId) || !openingRoom.value)
        {
          let index = rooms.value.findIndex((r) => r.id === newMsgRoomId)

          if (index !== -1) {
            rooms.value[index]['has_msg_to_be_seen'] = true

            let serverIndex = joinedServers.value.findIndex((j) => j.id === rooms.value[index].server_id)

            if (serverIndex !== -1) {
              joinedServers.value[serverIndex]['has_msg_to_be_seen'] = true
            }
          }
        }

        if (openingRoom.value?.id === newMsgRoomId) {
          if (user.value.id === data['sender_id']) {
            messages.value.push(data['new_msg_self'])
          } else {
            messages.value.push(data['new_msg_other'])

            setTimeout(async () => {
              try {
                await api.post("/message/mark-message-seen", {
                  room_id: openingRoom.value.id,
                  server_id: serverData.value.id,
                  message_id: data["new_msg_other"]['id']
                });
              } catch (_) {}
            }, 1000)
          }
        }
        break

      case "DeleteMessage":
        if (messages.value.length > 0) {
          let index = messages.value.findIndex((m) => m.id === data["deleted_msg_id"])

          if (index !== -1) {
            messages.value.splice(index, 1)
          }
        }
        break

      case "UpdateMessage":
        if (messages.value.length > 0 && openingRoom.value) {
          if (openingRoom.value.id === data["room_id"]) {
            let index = messages.value.findIndex((m) => m.id === data["message_id"])

            if (index !== -1) {
              messages.value[index]['text'] = data["new_text"]
            }
          }
        }
        break

      case "MarkMessagesAsSeen":
        if (openingRoom.value?.id === data["room_id"]) {
          const idsToMark = new Set(data["msg_ids_to_be_marked_as_seen"]);
          messages.value = messages.value.map(msg => {
            if (idsToMark.has(msg.id)) {
              return {
                ...msg,
                seen_by_other: true,
              };
            }
            return msg;
          });
        }
        break

      case "PinnedMessageUpdate":
        if (openingRoom.value?.id === data['room_id']) {

          if (data['pinned_msg'] === '') {
            pinnedMessage.value = null
          } else {
            pinnedMessage.value = data['pinned_msg']
          }
        }
        break
    }
  }

  return {
    chatWS,
    connect,
    disconnect,
    handleMessageType
  }
})
