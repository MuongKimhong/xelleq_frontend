<script setup>
import { NSpin, NTag } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import { useUserProfileStore } from '@/stores/profile.js'
import { storeToRefs } from 'pinia'
import api from '@/axios.js'
import '@/assets/styles/profile.css'
import '@/assets/styles/server.css'
import '@/assets/base.css'

import PostContent from '@/components/server/forum/PostContent.vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const userProfileStore = useUserProfileStore()
const { userPosts, userProfile } = storeToRefs(userProfileStore)

const loading = ref(false)
const loadErr = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const userPostsContainer = useTemplateRef('userPostsContainer')

async function getPosts() {
  loadErr.value = false
  loading.value = true

  try {
    let res = await api.get('/users/get-all-user-posts', {
      params: {
        username: userProfile.value.username,
        page: currentPage.value,
      },
    })

    if (res.status === 200) {
      userPosts.value.push(...res.data['posts'])
      totalPages.value = res.data['total_pages']
      currentPage.value += 1
    }
  } catch (_) {
    loadErr.value = true
  }
  loading.value = false
}

function handleGetMorePostsOnScroll(event) {
  const container = event.target
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 50

  if (scrollPosition >= threshold) {
    if (currentPage.value >= totalPages.value || loading.value) return
    getPosts()
  }
}

onMounted(async () => {
  await getPosts()
})

onBeforeUnmount(() => {
  userPosts.value.length = 0
})

function onUpdateLikedFlag(index, flag, updateLikeCount) {
  if (index !== -1) {
    userPosts.value[index].user_liked = flag

    if (updateLikeCount) {
      if (flag) {
        userPosts.value[index].like_count += 1
      } else {
        userPosts.value[index].like_count -= 1
      }
    }
  }
}

function onSetSaveBtnLoadingFlag(index, flag) {
  if (index !== -1) {
    userPosts.value[index].saving = flag
  }
}

function onSetUnsaveBtnLoadingFlag(index, flag) {
  if (index !== -1) {
    userPosts.value[index].unsaving = flag
  }
}

function onPostSavedSuccess(index) {
  if (index !== -1) {
    userPosts.value[index].user_saved = true
  }
}

function onPostUnsavedSuccess(index) {
  if (index !== -1) {
    userPosts.value[index].user_saved = false
  }
}
</script>

<template>
  <div
    class="mt-2"
    style="
      height: calc(100dvh - 160px);
      overflow-y: hidden;
      min-height: 0;
      display: flex;
      flex-direction: column;
    "
  >
    <div v-if="loadErr" style="text-align: center" class="mt-4">
      <n-tag type="error">Someting went wrong, please try again!</n-tag>
    </div>

    <DynamicScroller
      v-if="userPosts.length > 0"
      :items="userPosts"
      :min-item-size="300"
      :key-field="'id'"
      class="mt-2 profile-container"
      ref="userPostsContainer"
      @scroll="handleGetMorePostsOnScroll"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :data-index="index"
          :size-dependencies="[item.title, item.plain_text_content, item.medias]"
        >
          <div style="padding-bottom: 10px; box-sizing: border-box">
            <PostContent
              :post-data="item"
              :index="index"
              :use-for="`user-posts-tab`"
              @update-liked-flag="onUpdateLikedFlag"
              @set-save-btn-loading-flag="onSetSaveBtnLoadingFlag"
              @set-unsave-btn-loading-flag="onSetUnsaveBtnLoadingFlag"
              @post-saved-success="onPostSavedSuccess"
              @post-unsaved-success="onPostUnsavedSuccess"
            />
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <div v-if="!loading && userPosts.length === 0" style="text-align: center">
      <n-tag>No posts</n-tag>
    </div>

    <div v-if="loading" style="text-align: center; height: 150px">
      <n-spin :size="55" class="mt-4"></n-spin>
    </div>
  </div>
</template>
