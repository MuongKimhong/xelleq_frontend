<script setup>
import { NCard, NImage, NButton, NTooltip, NIcon, NBadge } from 'naive-ui'
import { Search } from '@vicons/ionicons5'
import { Plus, BellRegular, Bars } from '@vicons/fa'
import { useRouter } from 'vue-router'
import { useBreakpoint } from '@/breakpoint.js'
import { useNotificationStore } from '@/stores/notification.js'
import { useUserStore } from '@/stores/user.js'
import { useSiderStore } from '@/stores/sider.js'
import { useServerStore } from '@/stores/server.js'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { defineAsyncComponent, watch, onMounted } from 'vue'

const DeletePostModal = defineAsyncComponent(() => import('../server/forum/DeletePostModal.vue'))
const HidePostModal = defineAsyncComponent(() => import('../server/forum/HidePostModal.vue'))
const ViewingCarousel = defineAsyncComponent(() => import('./ViewingCarousel.vue'))
import AuthPopoverMenu from './AuthPopoverMenu.vue'
import UnAuthPopoverMenu from './UnAuthPopoverMenu.vue'
import SiderSmOrXs from '../SiderSmOrXs.vue'

import '../../assets/styles/navbar.css'
import celliqLogoSmall from '../../assets/celliq_logo_small.png'

const { t } = useI18n()

const { isBreakPointSmOrXs, isBreakPointLgAndUp, isBreakPointMdAndUp, isBreakPointSmAndUp } =
  useBreakpoint()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const siderStore = useSiderStore()
const { collapsed } = storeToRefs(siderStore)

const notificationStore = useNotificationStore()
const { newNotificationCount } = storeToRefs(notificationStore)

const serverStore = useServerStore()

const router = useRouter()

function redirectLogIn() {
  router.push({ name: 'login' })
}

function redirectHome() {
  router.push({ name: 'home' })
}

function redirectCreatePost() {
  router.push({ name: 'create-post' })
}

onMounted(async () => {
  if (user.value.authenticated) {
    serverStore.getJoinedServers()
    if (isBreakPointMdAndUp) collapsed.value = false
    else collapsed.value = true
  } else {
    collapsed.value = true
  }
})

watch(
  () => user.value.authenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      serverStore.getJoinedServers()

      if (isBreakPointMdAndUp) collapsed.value = false
      else collapsed.value = true
    }
  },
)
</script>

<template>
  <n-card id="navbar" :content-style="{ padding: '6px 15px' }">
    <DeletePostModal />
    <HidePostModal />
    <ViewingCarousel />
    <div class="navbar-inner">
      <!-- left -->
      <div class="navbar-left">
        <SiderSmOrXs v-if="isBreakPointSmOrXs && user.authenticated" />

        <n-button
          v-else-if="isBreakPointMdAndUp && user.authenticated"
          tertiary
          type="primary"
          @click="siderStore.toggleSider()"
        >
          <n-icon :size="15">
            <Bars />
          </n-icon>
        </n-button>

        <n-image :src="celliqLogoSmall" width="50" preview-disabled @click="redirectHome()" />
        <span v-if="isBreakPointLgAndUp" id="celliq-name" @click="redirectHome()">Xelleq</span>
      </div>
      <!-- end left -->

      <!-- center -->
      <!-- <div class="navbar-center">
        <n-input
          v-if="isBreakPointMdAndUp"
          :placeholder="t('search')"
          class="search-input"
          clearable
          @focus="router.push({ name: 'search' })"
        />
      </div> -->
      <!-- end center -->

      <!-- right auth -->
      <div v-if="user.authenticated" class="navbar-right">
        <n-button tertiary type="primary" @click="router.push({ name: 'search' })">
          <n-icon :size="20">
            <Search />
          </n-icon>
        </n-button>

        <n-tooltip v-if="isBreakPointSmAndUp" placement="bottom" trigger="hover">
          <template #trigger>
            <n-button tertiary type="primary" @click="redirectCreatePost()">
              <n-icon :size="15" style="margin-right: 5px">
                <Plus />
              </n-icon>
              {{ t('create') }}
            </n-button>
          </template>
          <span>{{ t('createTooltip') }}</span>
        </n-tooltip>

        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-badge :value="newNotificationCount">
              <n-button
                tertiary
                type="primary"
                class="mr-1"
                @click="router.push({ name: 'notifications' })"
              >
                <n-icon :size="15">
                  <BellRegular />
                </n-icon>
              </n-button>
            </n-badge>
          </template>
          <span>{{ t('notificationTooltip') }}</span>
        </n-tooltip>

        <AuthPopoverMenu />
      </div>
      <!-- end right auth -->

      <!-- right unauth -->
      <div v-else class="navbar-right">
        <n-button tertiary type="primary" @click="router.push({ name: 'search' })">
          <n-icon :size="20">
            <Search />
          </n-icon>
        </n-button>
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-button tertiary type="primary" @click="redirectLogIn()"> {{ t('login') }} </n-button>
          </template>
          <span>{{ t('loginTooltip') }}</span>
        </n-tooltip>

        <UnAuthPopoverMenu />
      </div>
      <!-- end right unauth -->
    </div>
  </n-card>
</template>

<style scoped>
.underline {
  border: none;
  height: 1px;
  background: grey;
  margin-top: 2px;
  margin-bottom: 15px;
}
.title {
  font-size: 16px;
}
</style>
