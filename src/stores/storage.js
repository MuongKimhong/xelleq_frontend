import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStorageStore = defineStore('storage', () => {
  const selectedFiles = ref([])
  const storageData = ref(null)
  const fileUploads = ref([])
  const totalFiles = ref(0)
  const showUploadModal = ref(false)
  const showDeleteModal = ref(false)
  const showUpdateNameModal = ref(false)
  const pressedFileIndex = ref(null)
  const pressedFileName = ref('')
  const pressedFileExtension = ref('')

  return {
    selectedFiles,
    storageData,
    fileUploads,
    showUploadModal,
    totalFiles,
    showDeleteModal,
    showUpdateNameModal,
    pressedFileIndex,
    pressedFileName,
    pressedFileExtension,
  }
})
