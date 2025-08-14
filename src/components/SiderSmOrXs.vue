<script setup>
import { NCard, NPopover, NButton, NIcon } from 'naive-ui'
import { Plus, BellRegular, Bars } from '@vicons/fa'
import { useRouter } from 'vue-router'
import { useBreakpoint } from '../breakpoint.js'
import { useUserStore } from '../stores/user.js'
import { useSiderStore } from '../stores/sider.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted } from 'vue'

import '../assets/styles/sider.css'
import JoinedServerList from './JoinedServerList.vue'

const { t } = useI18n()

const { isBreakPointSmOrXs, isBreakPointMdAndUp, isBreakPointSmAndUp } = useBreakpoint()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const siderStore = useSiderStore()
const { collapsed } = storeToRefs(siderStore)

const router = useRouter()

function onCreateServerPress() {
  router.push({ name: 'create-server' })
  siderStore.toggleSider()
}
</script>

<template>
  <n-popover trigger="click" raw>
    <template #trigger>
      <n-button tertiary type="primary">
        <n-icon :size="15">
          <Bars />
        </n-icon>
      </n-button>
    </template>

    <div>
      <n-card v-if="user.authenticated" :content-style="{ padding: '12px', width: '260px' }">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
          "
        >
          <span class="title">Servers</span>
          <n-button type="primary" size="tiny" @click="router.push({ name: 'create-server' })">
            <template #icon>
              <n-icon>
                <Plus />
              </n-icon>
            </template>
          </n-button>
        </div>
        <hr style="border: none; height: 1px; background: grey; margin-top: 2px; padding: 0" />

        <JoinedServerList />
      </n-card>
    </div>
  </n-popover>
</template>
