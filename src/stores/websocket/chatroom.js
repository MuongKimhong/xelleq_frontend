import { ref} from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useUserStore } from "../user.js"
import { useServerStore } from '../server.js'
import { useChatStore } from "../chat.js"
import api from "@/axios.js"

export const useChatWS = defineStore('chatWS', () => {
  const serverStore = useServerStore()
  const { serverData } = storeToRefs(serverStore)

  const userStore = useUserStore()
  const { user }  = storeToRefs(userStore)

  const chatStore = useChatStore()
  const { openingRoomId, openingRoomName, rooms, messages } = storeToRefs(chatStore)

  const chatWS = ref(null)

  function connect() {
    if (serverData.value) {
      let path = `/rooms/chat-websocket/${serverData.value.id}`
      let url = api.defaults.baseURL.replace(/^http/, 'ws') + path
      chatWS.value = new WebSocket(url)
    }
  }

  function disconnect() {
    if (chatWS.value) {
      chatWS.value.close()
      chatWS.value = null
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

        if (openingRoomId.value && openingRoomName.value) {
          if (openingRoomId.value === data['room_id']) {
            openingRoomName.value = data["new_name"]
          }
        }
        break

      case "NewMessage":
        let newMsgRoomId = data["new_msg"]["room_id"]

        if (openingRoomId.value) {
          if (openingRoomId.value === newMsgRoomId) {
            messages.value.push(data["new_msg"])

            if (user.value.id !== data["new_msg"]["sender_id"]) {
              setTimeout(() => {
                api.post("/message/mark-message-seen", {
                  room_id: openingRoomId.value,
                  server_id: serverData.value.id,
                  message_id: data["new_msg"]['id']
                })
              }, 1000)
            }
          }
        }

        if (
          (openingRoomId.value && (openingRoomId.value !== newMsgRoomId)) ||
          (openingRoomId.value === null)
        ) {
          let index = rooms.value.findIndex((r) => r.id === data["new_msg"]['room_id'])

          if (index !== -1) {
            rooms.value[index]['has_msg_to_be_seen'] = true
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
        if (messages.value.length > 0 && openingRoomId.value) {
          if (openingRoomId.value === data["room_id"]) {
            let index = messages.value.findIndex((m) => m.id === data["message_id"])

            if (index !== -1) {
              messages.value[index]['text'] = data["new_text"]
            }
          }
        }
        break

      case "MarkMessagesAsSeen":
        if (openingRoomId.value === data["room_id"]) {
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
    }
  }

  return {
    chatWS,
    connect,
    disconnect,
    handleMessageType
  }
})
