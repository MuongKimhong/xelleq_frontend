<script setup>
// This component is used inside Navbar component.
// Show/Hide via forum store ref

import { NModal, NCard, NButton, useMessage } from 'naive-ui'
import { useNewFeedStore } from '@/stores/newfeed.js'
import { useUserProfileStore } from '@/stores/profile.js'
import { useForumStore } from '@/stores/forum.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/base.css'

const router = useRouter()
const message = useMessage()

const userProfileStore = useUserProfileStore()
const { userPosts, likedPosts, savedPosts } = storeToRefs(userProfileStore)

const forumStore = useForumStore()
const { posts, hidePostModalRef } = storeToRefs(forumStore)

const newFeedStore = useNewFeedStore()
const { newFeedPosts } = storeToRefs(newFeedStore)

const hiding = ref(false)

async function hidePost() {
  hiding.value = true

  try {
    let res = await api.post('/forum/hide-forum-post', {
      post_id: hidePostModalRef.value.id,
    })

    if (res.status === 200) {
      switch (hidePostModalRef.value.callFrom) {
        case 'post-detail-page':
          forumStore.resetHidePostModalRef()
          router.push({ name: 'home' })
          return
        case 'forum-tab':
          posts.value.splice(hidePostModalRef.value.index, 1)
          break
        case 'user-posts-tab':
          userPosts.value.splice(hidePostModalRef.value.index, 1)
          break
        case 'user-liked-posts-tab':
          likedPosts.value.splice(hidePostModalRef.value.index, 1)
          break
        case 'user-saved-posts-tab':
          savedPosts.value.splice(hidePostModalRef.value.index, 1)
          break
        case 'new-feed':
          newFeedPosts.value.splice(hidePostModalRef.value.index, 1)
          break
      }
      forumStore.resetHidePostModalRef()
    }
  } catch (_) {}

  hiding.value = false
}

function cancel() {
  forumStore.resetHidePostModalRef()
}
</script>

<template>
  <n-modal :show="hidePostModalRef.show" :mask-closable="false">
    <n-card
      style="max-width: 420px; max-height: 800px"
      title="Are you sure you want to hide this post?"
    >
      <div style="text-align: right" class="mt-3">
        <n-button size="small" class="mr-2" @click="cancel()" :disabled="hiding">Cancel</n-button>
        <n-button
          size="small"
          type="warning"
          :loading="hiding"
          :disabled="hiding"
          @click="hidePost()"
        >
          Hide
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
