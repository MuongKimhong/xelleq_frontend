import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useNewFeedStore = defineStore('newFeedStore', () => {
  const newFeedPosts = ref([])

  return {
    newFeedPosts
  }
})
