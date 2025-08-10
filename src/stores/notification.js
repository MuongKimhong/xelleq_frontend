import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notificationStore', () => {
  const notifications = ref([])
  const newNotificationCount = ref(0)

  return {
    notifications,
    newNotificationCount
  }
})
