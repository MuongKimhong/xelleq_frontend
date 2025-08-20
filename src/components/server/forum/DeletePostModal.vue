<script setup>
// This component is used inside Navbar component.
// Show/Hide via forum store ref

import { NModal, NCard, NButton, NInput } from 'naive-ui'
import { useUserProfileStore } from '@/stores/profile.js'
import { useNewFeedStore } from '@/stores/newfeed.js'
import { useForumStore } from '@/stores/forum.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/base.css'

const router = useRouter()

const userProfileStore = useUserProfileStore()
const { userPosts, likedPosts, savedPosts } = storeToRefs(userProfileStore)

const forumStore = useForumStore()
const { posts, deletePostModalRef } = storeToRefs(forumStore)

const newFeedStore = useNewFeedStore()
const { newFeedPosts } = storeToRefs(newFeedStore)

const deleting = ref(false)

async function deletePost() {
  deleting.value = true

  try {
    let res = await api.delete('/forum/delete-forum-post-by-owner', {
      data: {
        post_id: deletePostModalRef.value.id,
      },
    })

    if (res.status === 200) {
      switch (deletePostModalRef.value.callFrom) {
        case 'post-detail-page':
          let deletedPostId = deletePostModalRef.value.id
          forumStore.resetDeletePostModalRef()

          let forumTabPostIndex = posts.value.findIndex((p) => p.id === deletedPostId)
          let newFeedPostIndex = newFeedPosts.value.findIndex((p) => p.id === deletedPostId)

          if (forumTabPostIndex !== -1) {
            posts.value.splice(forumTabPostIndex, 1)
          }
          if (newFeedPostIndex !== -1) {
            newFeedPosts.value.splice(newFeedPostIndex, 1)
          }

          deleting.value = false
          router.push({ name: 'home' })
          return
        case 'forum-tab':
          posts.value.splice(deletePostModalRef.value.index, 1)
          break
        case 'user-posts-tab':
          userPosts.value.splice(deletePostModalRef.value.index, 1)
          break
        case 'user-liked-posts-tab':
          likedPosts.value.splice(deletePostModalRef.value.index, 1)
          break
        case 'user-saved-posts-tab':
          savedPosts.value.splice(deletePostModalRef.value.index, 1)
          break
        case 'new-feed':
          newFeedPosts.value.splice(deletePostModalRef.value.index, 1)
          break
      }
    }
  } catch (_) {}
  deleting.value = false
  forumStore.resetDeletePostModalRef()
}

function cancel() {
  forumStore.resetDeletePostModalRef()
}
</script>

<template>
  <n-modal :show="deletePostModalRef.show" :mask-closable="false">
    <n-card style="max-width: 400px; max-height: 800px" title="Are you sure you want to delete?">
      <div style="text-align: right" class="mt-3">
        <n-button size="small" class="mr-2" @click="cancel()" :disabled="deleting">Cancel</n-button>
        <n-button
          size="small"
          type="error"
          :loading="deleting"
          :disabled="deleting"
          @click="deletePost()"
        >
          Delete
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
