import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useBaseStore = defineStore('base', () => {
  const currentUrl = ref(null)

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
