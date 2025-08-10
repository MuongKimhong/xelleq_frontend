// update like, new comment, to be used in PostDetail page

import { ref} from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useForumStore } from '../forum.js'
import { usePostDetailStore } from '../postdetail.js'
import { useStorageStore } from '../storage.js'
import api from '../../axios.js'

export const useUpdatePostDetailWS = defineStore('updatePostDetailWS', () => {
  const postDetailStore = usePostDetailStore()
  const { postData } = storeToRefs(postDetailStore)

  const updatePostDetailWS = ref(null)

  function connect(postId) {
    let path = `/forum/update-post-detail-data/${postId}`
    let url = api.defaults.baseURL.replace(/^http/, 'ws') + path
    updatePostDetailWS.value = new WebSocket(url)
  }

  function disconnect() {
    if (updatePostDetailWS.value) {
      updatePostDetailWS.value.close()
      updatePostDetailWS.value = null
    }
  }

  function handleMessageType(parsedData) {
    let msgType = parsedData['UpdatePostDetail'].msg_type
    let data = parsedData['UpdatePostDetail'].data

    switch (msgType) {
      case "UpdateForumPostLike":
        postData.value.like_count = data['like_count']
        break
    }
  }

  return {
    updatePostDetailWS,
    handleMessageType,
    connect,
    disconnect
  }
})
