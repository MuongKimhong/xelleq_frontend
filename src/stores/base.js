import { ref, computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useUserStore } from "@/stores/user.js"

export const useBaseStore = defineStore('base', () => {
  const currentUrl = ref(null)

  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  // to be used in ViewingCarousel component,
  // embedded in Navbar
  const viewingImages = ref([])
  const showViewingModal = ref(false)

  function setCurrentUrl(url) {
    currentUrl.value = url
  }

  function clearCurrentUrl() {
    currentUrl.value = null
  }

  return {
    currentUrl,
    setCurrentUrl,
    clearCurrentUrl,
    viewingImages,
    showViewingModal
  }
})
