<script setup>
import { NCard, NPopover, NImage, NButton, NSwitch, NSpin, NIcon } from 'naive-ui'
import { DarkModeOutlined, LanguageOutlined } from '@vicons/material'
import { PersonSettings20Regular } from '@vicons/fluent'
import { ArrowForward, LogOutOutline } from '@vicons/ionicons5'
import { UserCircleRegular, Plus } from '@vicons/fa'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme.js'
import { useViewingServerStore } from '@/stores/server.js'
import { useUserStore } from '@/stores/user.js'
import { useLangStore } from '@/stores/lang.js'
import { useBreakpoint } from '@/breakpoint.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import api from '@/axios.js'
import { openStaticLink } from '@/utils.js'

import '@/assets/base.css'
import '@/assets/styles/navbar.css'

const { isBreakPointXs } = useBreakpoint()
const langStore = useLangStore()
const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

const { t } = useI18n()

const viewingServerStore = useViewingServerStore()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const router = useRouter()

const showAuthMenu = ref(false)
const isLoggingOut = ref(false)

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

// logout
async function logout() {
  isLoggingOut.value = true
  viewingServerStore.clearViewingServer()
  userStore.clearUser()

  // ok or error, refresh page anyway

  try {
    await api.post('/users/log-out')
  } catch (_) {}
  window.location.href = '/'
}

function viewProfile() {
  router.push({
    name: 'user-profile',
    params: {
      username: user.value.username,
    },
  })
}

function redirectCreatePost() {
  router.push({ name: 'create-post' })
}
</script>

<template>
  <n-popover
    trigger="manual"
    raw
    :show-arrow="false"
    :show="showAuthMenu"
    @clickoutside="showAuthMenu = false"
  >
    <template #trigger>
      <n-button
        v-if="user.profileUrl == null"
        quaternary
        circle
        type="primary"
        @click="showAuthMenu = !showAuthMenu"
      >
        <template #icon>
          <n-icon :size="40"><UserCircleRegular /></n-icon>
        </template>
      </n-button>
      <n-image
        v-else
        :src="user.profileUrl"
        width="40"
        height="40"
        preview-disabled
        class="profile-img"
        @click="showAuthMenu = !showAuthMenu"
      ></n-image>
    </template>

    <n-card :content-style="{ padding: '6px 15px' }" style="width: auto">
      <div v-if="isBreakPointXs" class="settings-row-clickable" @click="redirectCreatePost()">
        <span class="label-with-icon">
          <n-icon :size="15">
            <Plus />
          </n-icon>
          {{ t('createTooltip') }}
        </span>
        <n-icon :size="15"><ArrowForward /></n-icon>
      </div>
      <div class="settings-row-clickable" @click="viewProfile()">
        <span class="label-with-icon">
          <n-icon :size="15">
            <UserCircleRegular />
          </n-icon>
          {{ user.username }}
        </span>
        <n-icon :size="15"><ArrowForward /></n-icon>
      </div>
      <div class="settings-row-clickable" @click="router.push({ name: 'account-settings' })">
        <span class="label-with-icon">
          <n-icon :size="15">
            <PersonSettings20Regular />
          </n-icon>
          {{ t('accountSetting') }}
        </span>
        <n-icon :size="15"><ArrowForward /></n-icon>
      </div>
      <div class="settings-row">
        <span class="label-with-icon">
          <n-icon :size="15">
            <DarkModeOutlined />
          </n-icon>
          {{ t('darkMode') }}
        </span>
        <n-switch v-model:value="switchOnDarkMode" :rubber-band="false"></n-switch>
      </div>
      <div class="settings-row">
        <span class="label-with-icon">
          <n-icon :size="15">
            <LanguageOutlined />
          </n-icon>
          {{ t('khmer') }}
        </span>
        <n-switch v-model:value="switchOnKhmerLang" :rubber-band="false"></n-switch>
      </div>
      <div
        class="settings-row-clickable"
        :class="{ 'disabled-div': isLoggingOut }"
        @click="logout()"
      >
        <span class="label-with-icon">
          <n-icon :size="15">
            <LogOutOutline />
          </n-icon>
          {{ t('logout') }}
        </span>
        <n-spin v-if="isLoggingOut" :size="15" />
        <n-icon v-else :size="15"><ArrowForward /></n-icon>
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

<style scoped>
.disabled-div {
  pointer-events: none;
}
</style>
