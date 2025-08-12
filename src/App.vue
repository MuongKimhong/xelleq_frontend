<script setup>
import { RouterView } from 'vue-router'
import { NConfigProvider, NMessageProvider, NLayout, NLayoutContent } from 'naive-ui'
import { useRoute } from 'vue-router'
import { useBreakpoint } from './breakpoint'
import { useThemeStore } from './stores/theme'
import { useUserStore } from './stores/user.js'
import { useLangStore } from './stores/lang'
import { storeToRefs } from 'pinia'
import { ref, computed, onMounted } from 'vue'

import Navbar from './components/navbar/Navbar.vue'
import Sider from './components/Sider.vue'

const { isBreakPointMdAndUp } = useBreakpoint()
const route = useRoute()
const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

const langStore = useLangStore()
const naiveLang = computed(() => langStore.naiveUIlang)
const naiveLangDate = computed(() => langStore.naiveUIDateLang)

const routeComponentKey = computed(() => {
  const name = route.name
  if (name === 'server-detail') {
    return `server-detail-${route.params.id}`
  } else if (name === 'post-detail') {
    return `post-detail-${route.params.id}-${route.params.serverid}`
  } else if (name === 'user-profile') {
    return `user-profile-${route.params.username}`
  } else if (name === 'home') {
    return 'home'
  }
  return name
})

themeStore.restoreTheme()

const themeOverrides = {
  common: {
    primaryColor: '#2080f0', // same as Info color
    primaryColorHover: '#4098fc',
    primaryColorPressed: '#1060c9',
    primaryColorSuppl: '#4098fc',
  },
}
</script>

<template>
  <n-config-provider
    :theme="theme"
    :locale="naiveLang"
    :date-locale="naiveLangDate"
    :theme-overrides="themeOverrides"
  >
    <n-message-provider>
      <Navbar />

      <!-- 60px is navbar width to avoid unwanted overflow -->
      <n-layout has-sider style="height: calc(100dvh - 60px); overflow: hidden">
        <Sider v-if="isBreakPointMdAndUp" />

        <n-layout>
          <n-layout-content style="overflow: hidden">
            <router-view v-slot="{ Component }">
              <keep-alive include="home,search-view">
                <component v-if="route.name === 'home'" :is="Component" :key="'home'" />
                <component v-else :is="Component" :key="routeComponentKey" />
              </keep-alive>
            </router-view>
          </n-layout-content>
        </n-layout>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
p {
  font-size: 16px;
}
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
strong {
  font-weight: bold;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
