<script setup>
import { NTag, NSpin } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { ref, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import api from '@/axios.js'
import '@/assets/styles/server.css'
import '@/assets/base.css'

import { useServerStore } from '@/stores/server.js'
import { useUserStore } from '@/stores/user.js'
import { useI18n } from 'vue-i18n'

import PostAwaitingApprovalDetail from './PostAwaitingApprovalDetail.vue'
import PostApprovalList from './PostApprovalList.vue'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const loading = ref(false)
const loadErr = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const awaitingPosts = ref([])
const viewingPost = ref(null)
const showViewingModal = ref(false)

async function getAwaitingApprovalPosts() {
  loading.value = true

  try {
    let res = await api.get('/forum/get-awaiting-approval-posts', {
      params: {
        server_id: serverData.value.id,
        page: currentPage.value,
      },
    })

    if (res.status === 200) {
      awaitingPosts.value.push(...res.data['posts'])
      totalPages.value = res.data['total_pages']
      currentPage.value += 1
    }
  } catch (_) {
    loadErr.value = true
  }

  loading.value = false
}

function onViewPost(post) {
  showViewingModal.value = true
  viewingPost.value = post
}

function onCloseViewingModal() {
  showViewingModal.value = false
  viewingPost.value = null
}

async function approvePost(post) {
  try {
    await api.put('/forum/approve-reject-awaiting-post', {
      server_id: serverData.value.id,
      post_id: post.id,
      status: 'approve',
    })
  } catch (_) {}
}

async function rejectPost(post) {
  try {
    await api.put('/forum/approve-reject-awaiting-post', {
      server_id: serverData.value.id,
      post_id: post.id,
      status: 'reject',
    })
  } catch (_) {}
}

async function onApprovePostFromApprovalList(index) {
  let post = awaitingPosts.value[index]
  post.approving = true
  await approvePost(post)
  post.approving = false
  awaitingPosts.value.splice(index, 1)
}

async function onRejectPostFromApprovalList(index) {
  let post = awaitingPosts.value[index]
  post.rejecting = true
  await rejectPost(post)
  post.rejecting = false
  awaitingPosts.value.splice(index, 1)
}

async function onApprovePostFromViewingModal() {
  if (viewingPost.value) {
    viewingPost.value.approving = true
    await approvePost(viewingPost.value)
    viewingPost.value.approving = false

    let index = awaitingPosts.value.findIndex((p) => p.id === viewingPost.value.id)
    if (index !== -1) {
      awaitingPosts.value.splice(index, 1)
      onCloseViewingModal()
    }
  }
}

async function onRejectPostFromViewingModal() {
  if (viewingPost.value) {
    viewingPost.value.rejecting = true
    await rejectPost(viewingPost.value)
    viewingPost.value.rejecting = false

    let index = awaitingPosts.value.findIndex((p) => p.id === viewingPost.value.id)
    if (index !== -1) {
      awaitingPosts.value.splice(index, 1)
      onCloseViewingModal()
    }
  }
}

const postApprovalTabContainer = useTemplateRef('postApprovalTabContainer')

function handleGetMorePostsOnScroll() {
  const container = postApprovalTabContainer.value
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 100

  if (scrollPosition >= threshold) {
    if (currentPage.value >= totalPages.value || loading.value) return
    getAwaitingApprovalPosts()
  }
}

onMounted(async () => {
  await getAwaitingApprovalPosts()

  if (postApprovalTabContainer.value) {
    postApprovalTabContainer.value.addEventListener('scroll', handleGetMorePostsOnScroll)
  }
})

onBeforeUnmount(() => {
  if (postApprovalTabContainer.value) {
    postApprovalTabContainer.value.removeEventListener('scroll', handleGetMorePostsOnScroll)
  }
})
</script>

<template>
  <div
    v-if="user.authenticated && (serverData.isAdmin || serverData.isModerator)"
    class="mt-2 tab-content approval-tab-container"
    ref="postApprovalTabContainer"
  >
    <div v-if="loadErr" style="text-align: center">
      <n-tag type="error">Someting went wrong, please try again!</n-tag>
    </div>

    <div v-else>
      <PostAwaitingApprovalDetail
        :post="viewingPost"
        :show-modal="showViewingModal"
        @close-viewing-modal="onCloseViewingModal"
        @approve-post-modal="onApprovePostFromViewingModal"
        @reject-post-modal="onRejectPostFromViewingModal"
      />
      <PostApprovalList
        :posts="awaitingPosts"
        @view-post="onViewPost"
        @approve-post="onApprovePostFromApprovalList"
        @reject-post="onRejectPostFromApprovalList"
      />
    </div>

    <div v-if="!loading && awaitingPosts.length === 0" style="text-align: center">
      <n-tag>No awaiting posts</n-tag>
    </div>

    <div v-if="loading" style="text-align: center; height: 150px">
      <n-spin :size="55" class="mt-4"></n-spin>
    </div>
  </div>
</template>
