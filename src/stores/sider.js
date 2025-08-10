import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSiderStore = defineStore('sider', () => {
  const collapsed = ref(false)

  function toggleSider() {
    collapsed.value = !collapsed.value
  }

  return { collapsed, toggleSider }
})
