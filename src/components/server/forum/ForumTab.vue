<script setup>
defineOptions({
  name: 'ForumTab',
})

import { NInput, NSpin, NTag } from 'naive-ui'
import { useServerStore } from '@/stores/server.js'
import { useUserStore } from '@/stores/user.js'
import { useForumStore } from '@/stores/forum.js'
import { useBreakpoint } from '@/breakpoint.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import debounce from 'lodash/debounce'
import api from '@/axios.js'

import NewPostBtn from './NewPostBtn.vue'
import PostContent from './PostContent.vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import '@/assets/styles/server.css'
import '@/assets/base.css'

const { isBreakPointMdAndUp } = useBreakpoint()
const { t } = useI18n()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const forumStore = useForumStore()
const { posts } = storeToRefs(forumStore)

const loadErr = ref(false)
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)

async function getPosts() {
  loadErr.value = false
  loading.value = true

  let useEndpoint = '/forum/get-server-posts-unauth'

  if (user.value.authenticated) {
    useEndpoint = '/forum/get-server-posts-auth'
  }

  try {
    let res = await api.get(useEndpoint, {
      params: {
        page: currentPage.value,
        server_id: serverData.value.id,
      },
    })

    if (res.status === 200) {
      posts.value.push(...res.data['posts'])
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
  const threshold = container.scrollHeight - 150

  if (scrollPosition >= threshold) {
    if (currentPage.value >= totalPages.value || loading.value) return
    getPosts()
  }
}

onMounted(async () => {
  if (posts.value.length === 0) {
    await getPosts()
  }
})

onBeforeUnmount(() => {
  posts.value.length = 0
})

function onUpdateLikedFlag(index, flag, updateLikeCount) {
  if (index !== -1) {
    posts.value[index].user_liked = flag

    if (updateLikeCount) {
      if (flag) {
        posts.value[index].like_count += 1
      } else {
        posts.value[index].like_count -= 1
      }
    }
  }
}

function onSetSaveBtnLoadingFlag(index, flag) {
  if (index !== -1) {
    posts.value[index].saving = flag
  }
}

function onSetUnsaveBtnLoadingFlag(index, flag) {
  if (index !== -1) {
    posts.value[index].unsaving = flag
  }
}

function onPostSavedSuccess(index) {
  if (index !== -1) {
    posts.value[index].user_saved = true
  }
}

function onPostUnsavedSuccess(index) {
  if (index !== -1) {
    posts.value[index].user_saved = false
  }
}
const searchText = ref('')
const searching = ref(false)
const showSearchInputForSmallScreen = ref(false)

async function searchPost() {
  searching.value = true
  currentPage.value = 0

  if (searchText.value.trim() === '') {
    searching.value = false
    currentPage.value = 0
    posts.value.length = 0
    await getPosts()
    return
  }

  try {
    let res = await api.get('/forum/search-server-posts', {
      params: {
        server_id: serverData.value.id,
        text: searchText.value,
      },
    })

    if (res.status === 200) {
      posts.value = res.data
    }
  } catch (_) {}

  searching.value = false
}

const debouncedSearch = debounce(searchPost, 350)

function toggleShowSearchInputForSmallScreen() {
  showSearchInputForSmallScreen.value = !showSearchInputForSmallScreen.value
}

async function refreshForumTab() {
  posts.value.length = 0
  currentPage.value = 0
  await getPosts()
}
</script>

<template>
  <div v-if="serverData.isMember || serverData.public" class="mt-2 tab-content">
    <div v-if="loadErr" style="text-align: center" class="mt-4">
      <n-tag type="error">Someting went wrong, please try again!</n-tag>
    </div>

    <div v-else>
      <div v-if="user.authenticated">
        <div
          v-if="isBreakPointMdAndUp"
          class="mt-1"
          style="display: flex; align-items: center; gap: 8px; padding: 0px 5px"
        >
          <n-input
            placeholder="Search post"
            v-model:value="searchText"
            @input="debouncedSearch"
            :disabled="posts.length === 0 || searching"
            :loading="searching"
          ></n-input>
          <NewPostBtn
            v-if="serverData.isMember"
            @refresh-forum-tab="refreshForumTab"
            @toggle-show-input="toggleShowSearchInputForSmallScreen"
          />
        </div>
        <div v-else class="mt-1" style="padding: 0px 5px">
          <NewPostBtn
            v-if="serverData.isMember"
            @refresh-forum-tab="refreshForumTab"
            @toggle-show-input="toggleShowSearchInputForSmallScreen"
          />
          <n-input
            class="mt-2"
            v-if="showSearchInputForSmallScreen"
            placeholder="Search post"
            v-model:value="searchText"
            @input="debouncedSearch"
            :disabled="posts.length === 0 || searching"
            :loading="searching"
          ></n-input>
        </div>
      </div>
    </div>

    <DynamicScroller
      v-if="posts.length > 0"
      :items="posts"
      :min-item-size="300"
      :key-field="'id'"
      class="mt-2 forum-tab-content-container"
      ref="forumTabContainer"
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
              :use-for="`forum-tab`"
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

    <div v-if="!loading && posts.length === 0" style="text-align: center" class="mt-2">
      <n-tag>No posts</n-tag>
    </div>

    <div v-if="loading" style="text-align: center; height: 150px">
      <n-spin :size="55" class="mt-4"></n-spin>
    </div>
  </div>
</template>
