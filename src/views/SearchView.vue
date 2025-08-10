<script setup>
defineOptions({ name: 'search-view' })

import { NInput, NCard, NTag, NButton, NSpin, NTabs, NTab } from 'naive-ui'
import { ref, onMounted, onBeforeUnmount, computed, useTemplateRef } from 'vue'
import debounce from 'lodash/debounce'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import api from '@/axios.js'

import SearchHistory from '@/components/search/SearchHistory.vue'
import SearchSuggestion from '@/components/search/SearchSuggestion.vue'
import PostResults from '@/components/search/PostResults.vue'
import ServerResults from '@/components/search/ServerResults.vue'
import '@/assets/styles/search.css'

const { t } = useI18n()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const activeTab = ref('')
const searchText = ref('')
const showSearchHistory = ref(false)
const showSuggestion = ref(false)
const searchSuggestions = ref(null)
const searching = ref(false) // for getting suggestion
const fullSearching = ref(false)

const fetchingMorePosts = ref(false)
const searchResultPosts = ref([])
const searchResultPostTotalPages = ref(0)
const searchResultPostCurrentPage = ref(0)

const fetchingMoreServers = ref(false)
const searchResultServers = ref([])
const searchResultServerTotalPages = ref(0)
const searchResultServerCurrentPage = ref(0)

const searchResultPostsWithMedia = ref([])
const searchResultPostsWithMediaTotalPages = ref(0)
const searchResultPostsWithMediaCurrentPage = ref(0)

const searchInputWrapper = useTemplateRef('searchInputWrapper')

function createSearchHistory() {
  if (searchText.value.trim() === '') return
  if (!user.value.authenticated) return

  api.post('/search/create-search-history', {
    text: searchText.value,
  })
}

function onSearchInputFocus() {
  fullSearching.value = false

  if (searchText.value.trim() === '') {
    if (user.value.authenticated) {
      showSearchHistory.value = true
    }
  }
}

async function onSearchInputTyping() {
  if (searchText.value.trim() === '') {
    if (user.value.authenticated) {
      showSearchHistory.value = true
      showSuggestion.value = false
    } else {
      showSearchHistory.value = false
      showSuggestion.value = false
    }
    return
  }

  searching.value = true
  showSearchHistory.value = false

  if (fullSearching.value) {
    searching.value = false
    showSearchHistory.value = false
    showSuggestion.value = false
    return
  }
  try {
    let res = await api.get('/search/get-search-suggestion', {
      params: {
        text: searchText.value,
      },
    })

    // early retur if user press enter for full search
    if (fullSearching.value) {
      searching.value = false
      showSearchHistory.value = false
      showSuggestion.value = false
      return
    }

    if (res.status === 200) {
      showSuggestion.value = true
      searchSuggestions.value = res.data
    }
  } catch (_) {}

  searching.value = false
}
const deboucedSearch = debounce(onSearchInputTyping, 300)

async function fullSearchPosts() {
  let endPoint = '/search/get-search-result-posts-unauth'

  if (user.value.authenticated) {
    endPoint = '/search/get-search-result-posts-auth'
  }
  try {
    let res = await api.get(endPoint, {
      params: {
        text: searchText.value,
        page: searchResultPostCurrentPage.value,
      },
    })

    if (res.status === 200) {
      searchResultPosts.value.push(...res.data['posts'])
      searchResultPostTotalPages.value = res.data['total_pages']
      searchResultPostCurrentPage.value += 1
    }
  } catch (_) {}
}

async function handleFetchMorePostResults() {
  fetchingMorePosts.value = true
  await fullSearchPosts()
  fetchingMorePosts.value = false
}

async function fullSearchServers() {
  try {
    let res = await api.get('/search/get-search-result-servers', {
      params: {
        text: searchText.value,
        page: searchResultServerCurrentPage.value,
      },
    })

    if (res.status === 200) {
      searchResultServers.value.push(...res.data['servers'])
      searchResultServerTotalPages.value = res.data['total_pages']
      searchResultServerCurrentPage.value += 1
    }
  } catch (_) {}
}

async function handleFetchMoreServerResults() {
  fetchingMoreServers.value = true
  await fullSearchServers()
  fetchingMoreServers.value = false
}

async function fullSearchPostsWithMediaOnly() {}

async function fullSearch() {
  if (searchText.value.trim() === '') return

  searchResultPosts.value = []
  searchResultPostCurrentPage.value = 0

  searchResultServers.value = []
  searchResultServerCurrentPage.value = 0

  searchResultPostsWithMedia.value = []
  searchResultPostsWithMediaCurrentPage.value = 0

  await fullSearchPosts()
  await fullSearchServers()
  await fullSearchPostsWithMediaOnly()
}

async function onSearchInputEnter() {
  fullSearching.value = true
  showSearchHistory.value = false
  showSuggestion.value = false

  createSearchHistory()
  await fullSearch()

  fullSearching.value = false
  activeTab.value = 'posts'
}

function handleClickOutside(event) {
  if (searchInputWrapper.value && !searchInputWrapper.value.contains(event.target)) {
    showSearchHistory.value = false
    showSuggestion.value = false
  }
}

function onSearchWithHistory(text) {
  searchText.value = text
  onSearchInputEnter()
}

function onSearchWithSuggestion(text) {
  searchText.value = text
  onSearchInputEnter()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    style="
      width: 100%;
      min-height: calc(100dvh - 60px);
      height: calc(100dvh - 60px);
      box-sizing: border-box;
      overflow-y: hidden;
      overflow-x: hidden;
    "
  >
    <div ref="searchInputWrapper" class="search-input-wrapper">
      <n-input
        v-model:value="searchText"
        placeholder="Search..."
        clearable
        style="width: 100%; box-sizing: border-box"
        :loading="searching"
        @input="deboucedSearch"
        @keyup.enter="onSearchInputEnter"
        @focus="onSearchInputFocus"
      />

      <SearchHistory v-if="showSearchHistory" @search-with-history="onSearchWithHistory" />
      <SearchSuggestion
        :show-suggestion="showSuggestion"
        :search-suggestions="searchSuggestions"
        @search-with-suggestion="onSearchWithSuggestion"
      />
    </div>

    <div v-if="fullSearching" style="text-align: center" class="mt-4">
      <n-spin :size="40"></n-spin>
    </div>

    <div
      v-else-if="
        !fullSearching &&
        (searchResultPosts.length > 0 ||
          searchResultServers.length > 0 ||
          searchResultPostsWithMedia.length > 0)
      "
      class="mt-4"
      style="overflow-y: hidden; height: calc(100dvh - 60px)"
    >
      <n-tabs
        v-model:value="activeTab"
        type="line"
        animated
        size="small"
        style="height: 35px; padding: 0px 10px"
      >
        <n-tab name="posts">Posts</n-tab>
        <n-tab name="servers">Servers</n-tab>
        <!-- <n-tab name="medias">Medias</n-tab> -->
      </n-tabs>

      <PostResults
        v-show="activeTab === 'posts'"
        :posts="searchResultPosts"
        :total-pages="searchResultPostTotalPages"
        :current-page="searchResultPostCurrentPage"
        :fetching-more="fetchingMorePosts"
        @need-fetch-more-posts="handleFetchMorePostResults"
      />
      <ServerResults
        v-show="activeTab === 'servers'"
        :servers="searchResultServers"
        :total-pages="searchResultServerTotalPages"
        :current-page="searchResultServerCurrentPage"
        :fetching-more="fetchingMoreServers"
        @need-fetch-more-servers="handleFetchMoreServerResults"
      />
    </div>

    <div
      v-else-if="
        !fullSearching &&
        searchResultPosts.length === 0 &&
        searchResultServers.length === 0 &&
        searchResultPostsWithMedia.length === 0
      "
      style="text-align: center"
      class="mt-4"
    >
      <n-tag>No results</n-tag>
    </div>
  </div>
</template>
