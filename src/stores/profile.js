import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserProfileStore = defineStore('userProfileStore', () => {
  const userPosts = ref([])
  const userProfile = ref(null)
  const likedPosts = ref([])
  const savedPosts = ref([])

  return {
    userPosts,
    userProfile,
    likedPosts,
    savedPosts
  }
})
