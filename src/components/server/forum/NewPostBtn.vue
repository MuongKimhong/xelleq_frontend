<script setup>
import { NButton, NIcon } from 'naive-ui'
import { Plus, Undo, Search } from '@vicons/fa'
import { useBreakpoint } from '@/breakpoint.js'
import { useCreatePostStore } from '@/stores/forum.js'
import { useServerStore } from '@/stores/server.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import '@/assets/base.css'

const { isBreakPointMdAndUp } = useBreakpoint()

const router = useRouter()
const emit = defineEmits(['refresh-forum-tab', 'toggle-show-input'])

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const createPostStore = useCreatePostStore()
const { selectedServerId } = storeToRefs(createPostStore)

function newPost() {
  selectedServerId.value = serverData.value.id
  router.push({ name: 'create-post' })
}
</script>

<template>
  <div v-if="isBreakPointMdAndUp" style="display: flex">
    <n-button type="primary" @click="newPost()" class="mr-2">
      <template #icon>
        <n-icon><Plus /></n-icon>
      </template>
    </n-button>
    <n-button type="primary" @click="emit('refresh-forum-tab')">
      <template #icon>
        <n-icon><Undo /></n-icon>
      </template>
    </n-button>
  </div>
  <div v-else style="text-align: right">
    <n-button type="primary" size="small" @click="emit('toggle-show-input')" class="mr-2">
      <template #icon>
        <n-icon><Search /></n-icon>
      </template>
    </n-button>
    <n-button type="primary" size="small" @click="newPost()" class="mr-2">
      <template #icon>
        <n-icon><Plus /></n-icon>
      </template>
    </n-button>
    <n-button type="primary" size="small" @click="emit('refresh-forum-tab')">
      <template #icon>
        <n-icon><Undo /></n-icon>
      </template>
    </n-button>
  </div>
</template>
