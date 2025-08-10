import { enUS, dateEnUS, kmKH, dateKmKH } from 'naive-ui'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLangStore = defineStore('lang', () => {
  const naiveUIlang = ref(enUS)
  const naiveUIDateLang = ref(dateEnUS)
  const lang = ref('en')

  function setKhmerLang() {
    naiveUIlang.value = kmKH
    naiveUIDateLang.value = dateKmKH
    lang.value = 'kh'
  }

  function setEnglishLang() {
    naiveUIlang.value = enUS
    naiveUIDateLang.value = dateEnUS
    lang.value = 'en'
  }

  return { lang, naiveUIlang, naiveUIDateLang, setKhmerLang, setEnglishLang }
})
