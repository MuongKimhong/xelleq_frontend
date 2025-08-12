import { darkTheme } from 'naive-ui'
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref(null) // will store the actual theme object
    const themeMode = ref('light') // 'light' or 'dark'

    function setDarkTheme() {
      theme.value = darkTheme
      themeMode.value = 'dark'
    }

    function setLightTheme() {
      theme.value = null
      themeMode.value = 'light'
    }

    function restoreTheme() {
      if (themeMode.value === 'dark') {
        theme.value = darkTheme
      } else {
        theme.value = null
      }
    }

    return { theme, themeMode, setDarkTheme, setLightTheme, restoreTheme }
  },
  { persist: true }
)
