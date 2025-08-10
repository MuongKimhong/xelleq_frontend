<script setup>
import { NLayoutSider, NButton, NIcon } from 'naive-ui'
import { Plus } from '@vicons/fa'
import { useUserStore } from '../stores/user.js'
import { useSiderStore } from '../stores/sider.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'

import JoinedServerList from './JoinedServerList.vue'
import '../assets/styles/sider.css'

const { t } = useI18n()
const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const siderStore = useSiderStore()
</script>

<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="0"
    :width="260"
    :show-collapsed-content="false"
    :collapsed="siderStore.collapsed"
    @collapse="siderStore.collapsed.value = true"
    @expand="siderStore.collapsed.value = false"
  >
    <!-- auth container -->
    <div v-if="user.authenticated" class="sidebar-container">
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
    </div>
    <!-- end auth container -->
  </n-layout-sider>
</template>
