<script setup>
import { NCard, NTag, NSpin, NButton, NLayout, NVirtualList } from 'naive-ui'
import { useViewingServerStore } from '@/stores/server.js'
import { useNewFeedStore } from '@/stores/newfeed.js'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ref, onMounted, onActivated, onBeforeUnmount, useTemplateRef } from 'vue'
import api from '@/axios.js'

import PostContent from '@/components/server/forum/PostContent.vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import '@/assets/base.css'

defineOptions({ name: 'home' })

const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const newFeedStore = useNewFeedStore()
const { newFeedPosts } = storeToRefs(newFeedStore)

const viewingServerStore = useViewingServerStore()
const { viewingServer } = storeToRefs(viewingServerStore)

const newFeedContainer = useTemplateRef('newFeedContainer')

const loading = ref(false)
const loadErr = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)

async function getNewFeedPosts() {
  loading.value = true
  loadErr.value = false

  let endPoint = '/forum/get-new-feeds-posts-unauthenticate'

  if (user.value.authenticated) {
    endPoint = '/forum/get-new-feeds-posts-auth'
  }

  try {
    let res = await api.get(endPoint, {
      params: {
        page: currentPage.value,
      },
    })

    if (res.status === 200) {
      newFeedPosts.value.push(...res.data['posts'])
      totalPages.value = res.data['total_pages']
      currentPage.value += 1
    }
  } catch (e) {
    loadErr.value = true
  }

  loading.value = false
}

const scrollTop = ref(0)

function handleGetMorePostsOnScroll() {
  const container = newFeedContainer.value.$el

  if (!container) return

  scrollTop.value = container.scrollTop
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 200

  if (scrollPosition >= threshold) {
    if (currentPage.value >= totalPages.value || loading.value) return
    getNewFeedPosts()
  }
}

onMounted(async () => {
  if (viewingServer.value.id.trim() !== '') {
    router.push({
      name: 'server-detail',
      params: {
        id: viewingServer.value.id,
      },
    })
  }

  await getNewFeedPosts()
})

onActivated(() => {
  if (newFeedContainer.value) {
    requestAnimationFrame(() => {
      newFeedContainer.value.scrollTop = scrollTop.value
    })
  }
})

function onUpdateLikedFlag(index, flag, updateLikeCount) {
  if (index !== -1) {
    newFeedPosts.value[index].user_liked = flag

    if (updateLikeCount) {
      if (flag) {
        newFeedPosts.value[index].like_count += 1
      } else {
        newFeedPosts.value[index].like_count -= 1
      }
    }
  }
}

function onSetSaveBtnLoadingFlag(index, flag) {
  if (index !== -1) {
    newFeedPosts.value[index].saving = flag
  }
}

function onSetUnsaveBtnLoadingFlag(index, flag) {
  if (index !== -1) {
    newFeedPosts.value[index].unsaving = flag
  }
}

function onPostSavedSuccess(index) {
  if (index !== -1) {
    newFeedPosts.value[index].user_saved = true
  }
}

function onPostUnsavedSuccess(index) {
  if (index !== -1) {
    newFeedPosts.value[index].user_saved = false
  }
}

onBeforeUnmount(() => {
  newFeedPosts.value.length = 0
  totalPages.value = 0
  currentPage.value = 0
})
</script>

<template>
  <div style="overflow-y: hidden; height: calc(100dvh - 60px)">
    <div v-if="loadErr" style="text-align: center" class="mt-4">
      <n-tag type="error">Someting went wrong, please try again!</n-tag>
    </div>

    <div v-else class="mt-2">
      <!-- <div v-for="(post, index) in newFeedPosts" :key="post.id" class="mb-3">
        <PostContent
          :post-data="post"
          :index="index"
          :use-for="`new-feed`"
          @update-liked-flag="onUpdateLikedFlag"
          @set-save-btn-loading-flag="onSetSaveBtnLoadingFlag"
          @set-unsave-btn-loading-flag="onSetUnsaveBtnLoadingFlag"
          @post-saved-success="onPostSavedSuccess"
          @post-unsaved-success="onPostUnsavedSuccess"
        />
      </div> -->
    </div>

    <DynamicScroller
      v-if="newFeedPosts.length > 0"
      :items="newFeedPosts"
      :min-item-size="300"
      :key-field="'id'"
      ref="newFeedContainer"
      class="new-feed-content-container"
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
              :use-for="`new-feed`"
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

    <div v-if="loading" style="text-align: center; height: 150px">
      <n-spin :size="55" class="mt-4"></n-spin>
    </div>
  </div>
</template>

<style scoped>
.newfeed-container {
  padding: 0px 5px;
  height: calc(100dvh - 60px);
  /* overflow-y: auto;
  scroll-behavior: smooth;
  will-change: transform; */
}
.new-feed-content-container {
  height: calc(100dvh - 60px);
  scroll-behavior: smooth;
  will-change: transform;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0px 5px;
}
</style>
