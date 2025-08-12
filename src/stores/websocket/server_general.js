// to be used in ServerDetail page, tabs

import { ref} from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useForumStore } from '../forum.js'
import { useServerStore } from '../server.js'
import { useStorageStore } from '../storage.js'
import api from '../../axios.js'

export const useServerGeneralWS = defineStore('serverGeneralWS', () => {
  const interval = ref(null)
  const serverStore = useServerStore()
  const { serverData } = storeToRefs(serverStore)

  const storageStore = useStorageStore()
  const { storageData, fileUploads, totalFiles } = storeToRefs(storageStore)

  const forumStore = useForumStore()
  const { posts } = storeToRefs(forumStore)

  const serverGeneralWS = ref(null)

  function connect(serverId) {
    let path = `/servers/server-general-websocket/${serverId}`
    let url = api.defaults.baseURL.replace(/^http/, 'ws') + path
    serverGeneralWS.value = new WebSocket(url)

    serverGeneralWS.value.onopen = () => {
      // ping every 30 seconds to keep connection alive
      interval.value = setInterval(() => {
        if (serverGeneralWS.value && serverGeneralWS.value.readyState === WebSocket.OPEN) {
          serverGeneralWS.value.send(JSON.stringify({ type: "ping" }));
        }
      }, 30 * 1000);
    };

    serverGeneralWS.value.onclose = () => {
      if (interval.value) {
        clearInterval(interval.value);
        interval.value = null
      }
    };
  }

  function disconnect() {
    if (serverGeneralWS.value) {
      serverGeneralWS.value.close()
      serverGeneralWS.value = null
    }
    if (interval.value) {
      clearInterval(interval.value);
      interval.value = null
    }
  }

  function handleMessageType(parsedData) {
    let msgType = parsedData['ServerGeneral'].msg_type
    let data = parsedData['ServerGeneral'].data

    switch (msgType) {
      case 'UpdateProfile':
        serverData.value.profileUrl = data
        serverStore.updateJoinedServerProfile(serverData.value.id, data)
        break

      case 'RemoveProfile':
        serverData.value.profileUrl = null
        serverStore.updateJoinedServerProfile(serverData.value.id, null)
        break

      case 'NewFileUploadStorage':
        totalFiles.value += 1
        fileUploads.value.unshift(data['uploaded'])
        storageData.value['storage_quota'] = data['storage_quota']
        storageData.value['storage_used'] = data['storage_used']
        storageData.value['storage_used_percent'] = data['storage_used_percent']
        break

      case 'DeleteFileUploadStorage':
        let removeIndex = fileUploads.value.findIndex((f) => f.id === data['to_remove_upload_id'])

        if (removeIndex !== -1) {
          fileUploads.value.splice(removeIndex, 1)
          totalFiles.value -= 1
        }
        storageData.value.storage_used = data['storage_data']['storage_used']
        storageData.value.storage_used_percent = data['storage_data']['storage_used_percent']
        break

      case 'RenameFileUploadStorage':
        const index = fileUploads.value.findIndex((f) => f.id === data['to_rename_upload_id'])

        if (index !== -1) {
          fileUploads.value[index].file_name = data['new_name']
        }
        break

      case 'RenameServer':
        serverData.value.name = data
        serverStore.updateJoinedServerName(serverData.value.id, data)
        break

      case 'UpdateServerDescription':
        serverData.value.description = data
        break

      case 'UpdatePostLikeCountForForumTab':
        const pIndex = posts.value.findIndex((p) => p.id === data['post_id'])

        if (pIndex !== -1) {
          posts.value[pIndex].like_count = data['like_count']
        }
        break
    }
  }

  return {
    serverGeneralWS,
    connect,
    disconnect,
    handleMessageType,
  }
})
