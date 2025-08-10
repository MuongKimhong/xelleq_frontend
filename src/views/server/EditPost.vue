<script setup>
import { NInput, NButton, useMessage } from 'naive-ui'
import { useEditPostStore } from '@/stores/forum.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import api from '@/axios.js'

import EditorMarkdown from '@/components/server/forum/EditorMarkdown.vue'
import EditorRichText from '@/components/server/forum/EditorRichText.vue'
import '@/assets/styles/server.css'
import '@/assets/base.css'

const { t } = useI18n()
const message = useMessage()
const router = useRouter()

const editPostStore = useEditPostStore()
const { editPostRef } = storeToRefs(editPostStore)

const newTitle = ref(editPostRef.value.title)

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  }),
)

const markdownOutput = computed(() => marked.parse(editPostRef.value.raw_markdown_content))

const canEditTitle = computed(() => {
  if (newTitle.value !== editPostRef.value.title && newTitle.value.trim() !== '') {
    return true
  }
  return false
})

const editingTitle = ref(false)

async function editTitle() {
  editingTitle.value = true

  try {
    let res = await api.put('/forum/update-forum-post-title', {
      post_id: editPostRef.value.id,
      new_title: newTitle.value,
    })

    if (res.status === 200) {
      message.success('Title has been updated')
    }
  } catch (_) {
    message.error('Something went wrong, please try again!')
  }

  editingTitle.value = false
}

const editingDescription = ref(false)

async function editDescription() {
  editingDescription.value = true
  let payload = {
    post_id: editPostRef.value.id,
    new_content_type: editPostRef.value.content_type,
  }
  let tempDiv = document.createElement('div')

  if (editPostRef.value.content_type === 'markdown') {
    tempDiv.innerHTML = markdownOutput.value
    payload['new_raw_markdown_content'] = editPostRef.value.raw_markdown_content
    payload['new_plain_text_content'] = tempDiv.textContent || tempDiv.innerText || ''
    payload['new_content'] = markdownOutput.value
  } else if (editPostRef.value.content_type === 'richtext') {
    tempDiv.innerHTML = editPostRef.value.html_content
    payload['new_plain_text_content'] = tempDiv.textContent || tempDiv.innerText || ''
    payload['new_content'] = editPostRef.value.html_content
  }

  try {
    let res = await api.put('/forum/update-forum-post-content', payload)

    if (res.status === 200) {
      message.success('Description has been updated')
    }
  } catch (_) {
    message.error('Something went wrong, please try again!')
  }

  editingDescription.value = false
}
</script>

<template>
  <div class="edit-post-container">
    <div class="wrapper">
      <h2 class="mt-4">Title</h2>
      <n-input
        v-model:value="newTitle"
        type="textarea"
        maxlength="300"
        show-count
        placeholder="Title"
        :autosize="{
          minRows: 1,
          maxRows: 5,
        }"
      />
      <div class="mt-4" style="text-align: right">
        <n-button
          type="primary"
          size="small"
          :disabled="!canEditTitle || editingTitle"
          :loading="editingTitle"
          @click="editTitle()"
        >
          Edit Title
        </n-button>
      </div>

      <div class="mt-4">
        <h2>Description</h2>
        <div v-if="editPostRef.content_type === 'richtext'">
          <EditorRichText v-model:richtextoutput="editPostRef.html_content" />
        </div>
        <div v-else-if="editPostRef.content_type === 'markdown'">
          <EditorMarkdown
            v-model:markdowninput="editPostRef.raw_markdown_content"
            :markdownoutput="markdownOutput"
          />
        </div>
        <div class="mt-4" style="text-align: right">
          <n-button
            type="primary"
            size="small"
            :loading="editingDescription"
            :disabled="editingDescription"
            @click="editDescription()"
          >
            Edit Description
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-post-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
}
.wrapper {
  padding: 30px;
}
</style>
