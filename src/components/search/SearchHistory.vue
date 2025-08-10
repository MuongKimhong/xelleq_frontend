<script setup>
import { NInput, NCard, NButton } from 'naive-ui'
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import api from '@/axios.js'

import '@/assets/styles/search.css'

const emit = defineEmits(['search-with-history'])

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const searchHistories = ref([])

async function getSearchHistories() {
  if (!user.value.authenticated) return

  try {
    let res = await api.get('/search/get-latest-search-histories')

    if (res.status === 200) {
      searchHistories.value = res.data
    }
  } catch (_) {}
}

async function deleteSearchHistory(historyIndex, historyId) {
  if (!user.value.authenticated) return

  try {
    let res = await api.delete('/search/delete-search-history', {
      data: {
        search_id: historyId,
      },
    })

    if (res.status === 200) {
      if (searchHistories.value.length > 0) {
        searchHistories.value.splice(historyIndex, 1)
      }

      if (searchHistories.value.length === 0) {
      }
    }
  } catch (_) {}
}

onMounted(() => getSearchHistories())

function onSearchHistoryPress(text) {
  emit('search-with-history', text)
}
</script>

<template>
  <div class="search-history-panel">
    <n-card
      v-show="searchHistories.length > 0"
      :content-style="{ padding: '10px' }"
      style="max-height: 500px; overflow-y: auto; scroll-behavior: smooth"
    >
      <div v-for="(history, historyIndex) in searchHistories" :key="history.id">
        <div class="search-history-suggestion" @click="onSearchHistoryPress(history.text)">
          <span>{{ history.text }}</span>
          <n-button
            tertiary
            size="tiny"
            @click="
              (e) => {
                e.preventDefault()
                e.stopPropagation()
                deleteSearchHistory(historyIndex, history.id)
              }
            "
          >
            x
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>
