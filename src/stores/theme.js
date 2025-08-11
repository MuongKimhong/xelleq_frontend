import { darkTheme } from 'naive-ui'
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(null)

  function setDarkTheme() {
    theme.value = darkTheme
  }

  function setLightTheme() {
    theme.value = null
  }

  return { theme, setDarkTheme, setLightTheme }
},
{
  persist: true,
})
