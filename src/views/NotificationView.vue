<script setup>
import { NTab, NTabs, NButton } from 'naive-ui'
import { useNotificationStore } from '@/stores/notification.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ref, onMounted, onBeforeUnmount } from 'vue'

import NotificationList from '@/components/notification/NotificationList.vue'

const router = useRouter()

const notificationStore = useNotificationStore()
const { notifications, newNotificationCount } = storeToRefs(notificationStore)

const activeTab = ref('notifications')

onMounted(() => {
  newNotificationCount.value = 0
})

onBeforeUnmount(() => {
  notifications.value.length = 0
})
</script>

<template>
  <div
    style="height: calc(100vh - 60px); overflow-y: hidden; display: flex; flex-direction: column"
  >
    <div style="padding: 0px 10px">
      <h2 class="margin: 0;">Notifications</h2>
    </div>

    <div style="padding: 0px 10px">
      <n-tabs v-model:value="activeTab" type="line" animated size="small">
        <n-tab name="notifications">Notifications</n-tab>
        <!-- <n-tab name="messages">Messages</n-tab> -->
      </n-tabs>
    </div>

    <NotificationList v-show="activeTab === 'notifications'" />
  </div>
</template>
