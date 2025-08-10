<script setup>
import { NInput, NCard, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { ref, onDeactivated } from 'vue'

import '@/assets/base.css'

const { t } = useI18n()

defineProps(['markdowninput', 'markdownoutput'])
const emit = defineEmits(['update:markdowninput'])

// const createPostStore = useCreatePostStore()
// const { markdownOutput } = storeToRefs(createPostStore)

const showPreview = ref(false)

function onInput(e) {
  emit('update:markdowninput', e)
}

function clear() {
  emit('update:markdowninput', '')
}

onDeactivated(() => {
  clear()
})
</script>

<template>
  <n-card title="Markdown" size="small" class="editor-card mt-3">
    <template #header-extra>
      <n-button v-if="!showPreview" size="tiny" class="mr-1" @click="showPreview = true">
        Preview
      </n-button>
      <n-button v-else-if="showPreview" size="tiny" class="mr-1" @click="showPreview = false">
        Edit
      </n-button>
      <n-button size="tiny" @click="clear()">Clear</n-button>
    </template>
    <div v-if="showPreview" v-html="markdownoutput" class="markdown-preview"></div>
    <n-input
      v-else
      :value="markdowninput"
      class="markdown-input"
      type="textarea"
      placeholder="Description"
      :autosize="{
        minRows: 5,
        maxRows: 30,
      }"
      @input="onInput"
    />
  </n-card>
</template>

<style scoped>
.markdown-input {
  font-family: 'Monaco', Consolas, 'Courier New', monospace;
}
.editor-card {
  max-width: 100%;
}
.markdown-preview pre {
  background-color: #1e1e1e;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  font-smooth: always;
  padding: 10px;
  border-radius: 6px;
}
.markdown-preview code {
  font-family: 'Monaco', Consolas, 'Courier New', monospace;
  font-size: 0.95em;
  overflow-x: auto;
  white-space: pre;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #1e1e1e;
  padding: 4px;
  color: white;
  border-radius: 6px;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  font-smooth: always;
}
</style>
