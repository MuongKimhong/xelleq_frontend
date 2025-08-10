<script setup>
import { NCard, NPopover, NButton, NSwitch, NIcon } from 'naive-ui'
import { DarkModeOutlined, LanguageOutlined } from '@vicons/material'
import { SettingsOutline } from '@vicons/ionicons5'
import { useThemeStore } from '../../stores/theme.js'
import { useLangStore } from '../../stores/lang.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import { staticSiteUrl, openStaticLink } from '@/utils.js'

import '../../assets/base.css'
import '../../assets/styles/navbar.css'

const langStore = useLangStore()
const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

const { t } = useI18n()

const showUnAuthMenu = ref(false)

// dark mode
const switchOnDarkMode = ref(theme.value !== null)
watch(switchOnDarkMode, (newVal) => {
  if (newVal) themeStore.setDarkTheme()
  else themeStore.setLightTheme()
})

// language
const switchOnKhmerLang = ref(false)
watch(switchOnKhmerLang, (newVal) => {
  if (newVal) langStore.setKhmerLang()
  else langStore.setEnglishLang()
})
</script>

<template>
  <n-popover
    trigger="manual"
    raw
    :show-arrow="false"
    :show="showUnAuthMenu"
    @clickoutside="showUnAuthMenu = false"
  >
    <template #trigger>
      <n-button tertiary type="primary" @click="showUnAuthMenu = true">
        <n-icon :size="20">
          <SettingsOutline />
        </n-icon>
      </n-button>
    </template>

    <n-card :content-style="{ padding: '6px 15px' }" style="width: auto">
      <div class="settings-row">
        <span class="label-with-icon">
          <n-icon :size="15">
            <DarkModeOutlined />
          </n-icon>
          {{ t('darkMode') }}
        </span>
        <n-switch v-model:value="switchOnDarkMode"></n-switch>
      </div>
      <div class="settings-row">
        <span class="label-with-icon">
          <n-icon :size="15">
            <LanguageOutlined />
          </n-icon>
          {{ t('khmer') }}
        </span>
        <n-switch v-model:value="switchOnKhmerLang" />
      </div>

      <div class="mt-4">
        <n-button
          size="tiny"
          style="width: 100%"
          quaternary
          type="primary"
          @click="openStaticLink('aboutus-en/')"
        >
          About Xelleq
        </n-button>
      </div>
    </n-card>
  </n-popover>
</template>
