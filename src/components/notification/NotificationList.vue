<script setup>
import { NCard, NButton, NSpin, NImage, NIcon } from 'naive-ui'
import { UserCircleRegular } from '@vicons/fa'
import { useNotificationStore } from '@/stores/notification.js'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ref, onMounted, onBeforeUnmount, useTemplateRef, nextTick } from 'vue'
import api from '@/axios.js'

import '@/assets/base.css'
import '@/assets/styles/notification.css'

const router = useRouter()

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

const postDetailStore = usePostDetailStore()
const { singleComment } = storeToRefs(postDetailStore)

const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const containerRef = useTemplateRef('containerRef')

async function getPostNotifications() {
  loading.value = true

  try {
    let res = await api.get('/notifications/get-post-notifications', {
      params: {
        page: currentPage.value,
      },
    })

    if (res.status === 200) {
      notifications.value.push(...res.data['notifications'])
      totalPages.value = res.data['total_pages']
      currentPage.value += 1
    }
  } catch (_) {}

  loading.value = false
}

function markNotificationSeen(notificationId) {
  try {
    api.put('/notifications/seen-post-notification', {
      notification_id: notificationId,
    })
  } catch (_) {}
}

function onNotificationPress(notification) {
  switch (notification.notification_type) {
    case 'like':
      onLikeNotificationPress(notification)
      return
    default:
      onCommentNotificationPress(notification)
      return
  }
}

function onLikeNotificationPress(notification) {
  markNotificationSeen(notification.id)

  router.push({
    name: 'post-detail',
    params: {
      id: notification.post_id,
      slug: notification.post_slug,
      serverid: notification.server_id,
    },
  })
}

async function onCommentNotificationPress(notification) {
  markNotificationSeen(notification.id)

  singleComment.value = {
    commentId: notification.comment_id,
    postId: notification.post_id,
  }
  await nextTick()

  router.push({
    name: 'post-detail',
    params: {
      id: notification.post_id,
      slug: notification.post_slug,
      serverid: notification.server_id,
    },
  })
}

function handleOnScroll() {
  const container = containerRef.value

  if (!container) return

  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 100

  if (scrollPosition >= threshold) {
    if (currentPage.value >= totalPages.value || loading.value) return
    getPostNotifications()
  }
}

onMounted(() => {
  getPostNotifications()

  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleOnScroll)
  }
})

onBeforeUnmount(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleOnScroll)
  }
})
</script>

<template>
  <div ref="containerRef" class="post-notification-container">
    <div>
      <div v-for="(notification, index) in notifications" :key="notification.id">
        <div
          class="post-notification-item"
          :class="{ 'post-notification-item-not-seen': !notification.seen }"
          @click="onNotificationPress(notification)"
        >
          <div class="mt-1">
            <n-image
              v-if="notification.sender_profile_url !== null"
              :src="notification.sender_profile_url"
              width="30"
              height="30"
              preview-disabled
              class="profile-img"
            ></n-image>
            <n-icon v-else :size="30">
              <UserCircleRegular />
            </n-icon>
          </div>
          <div class="ml-2">
            <h3 style="margin: 0; font-weight: 600">{{ notification.text }}</h3>
            <h4
              v-if="notification.comment_or_reply_comment !== null"
              class="post-notification-comment-text"
            >
              {{ notification.comment_or_reply_comment }}
            </h4>
            <h5 style="margin: 0">{{ notification.created_at }}</h5>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" style="text-align: center" class="mt-4">
      <n-spin :size="40"></n-spin>
    </div>
  </div>
</template>
