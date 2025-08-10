import './assets/main.css'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

import { createI18n } from 'vue-i18n'
import { createApp, watch } from 'vue'
import { createPinia, storeToRefs } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import { useLangStore } from './stores/lang.js'
import { useUserStore } from "./stores/user.js"
import { useUserWS } from "./stores/websocket/user.js"
import App from './App.vue'
import router from './router'
import en from './locales/en.js'
import kh from './locales/kh.js'

async function startUp() {
  const i18n = createI18n({
    legacy: false,
    locale: 'kh',
    fallbackLocale: 'en',
    messages: {
      en,
      kh,
    },
  })

  const app = createApp(App)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)

  const userStore = useUserStore()

  try {
    await userStore.getUserData()
  }
  catch (_) {}

  app.use(router)
  app.use(i18n)

  const userWSStore = useUserWS()
  const { userWS } = storeToRefs(userWSStore)

  try {
    if (userWS.value === null) {
      userWSStore.connect()

      userWS.value.onmessage = async (e) => {
        let data = JSON.parse(e.data)
        try {
          await userWSStore.handleMessageType(data)
        } catch (_) {}
      }
    }
  }
  catch (_) {}

  const langStore = useLangStore()
  watch(
    () => langStore.lang,
    (newLang) => {
      i18n.global.locale.value = newLang
    },
    { immediate: true },
  )

  app.mount('#app')
}

startUp()
