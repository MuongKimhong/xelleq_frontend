<script setup>
import { NCard } from 'naive-ui'
import '@/assets/styles/search.css'

const emit = defineEmits(['search-with-suggestion'])

const props = defineProps({
  showSuggestion: {
    type: Boolean,
    default: false,
  },
  searchSuggestions: {
    type: Object,
    default: null,
    required: false,
  },
})

function onSearchSuggestionPress(text) {
  emit('search-with-suggestion', text)
}
</script>

<template>
  <div class="search-history-panel">
    <n-card
      v-if="showSuggestion && searchSuggestions"
      :content-style="{ padding: '10px' }"
      style="max-height: 500px; overflow-y: auto; scroll-behavior: smooth"
    >
      <h3 v-if="searchSuggestions.histories.length > 0" class="my-1">
        <strong>Suggestions</strong>
      </h3>
      <div v-for="(history, historyIndex) in searchSuggestions.histories" :key="history.id">
        <div class="search-history-suggestion" @click="onSearchSuggestionPress(history.text)">
          <span>{{ history.text }}</span>
        </div>
      </div>

      <h3 v-if="searchSuggestions.servers.length > 0" class="my-1">
        <strong>Servers</strong>
      </h3>
      <div v-for="(server, serverIndex) in searchSuggestions.servers" :key="server.id">
        <div class="search-history-suggestion" @click="onSearchSuggestionPress(server.name)">
          <span>{{ server.name }}</span>
        </div>
      </div>

      <h3 v-if="searchSuggestions.posts.length > 0" class="my-1">
        <strong>Posts</strong>
      </h3>
      <div v-for="(post, postIndex) in searchSuggestions.posts" :key="post.id">
        <div class="search-history-suggestion" @click="onSearchSuggestionPress(post.title)">
          <span>{{ post.title }}</span>
        </div>
      </div>

      <h4
        v-if="
          searchSuggestions.posts.length === 0 &&
          searchSuggestions.servers.length === 0 &&
          searchSuggestions.histories.length === 0
        "
        class="my-1"
      >
        <strong>No results</strong>
      </h4>
    </n-card>
  </div>
</template>
