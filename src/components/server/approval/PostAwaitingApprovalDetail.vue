<script setup>
import { NCard, NButton, NModal, NIcon } from 'naive-ui'
import { Close } from '@vicons/ionicons5'
import '@/assets/base.css'

import PostCarousel from '@/components/server/forum/PostCarousel.vue'

const emit = defineEmits(['close-viewing-modal', 'approve-post-modal', 'reject-post-modal'])

const props = defineProps({
  post: {
    type: Object,
    required: false,
    default: null,
  },
  showModal: {
    type: Boolean,
    default: false,
  },
})

function closeModal() {
  emit('close-viewing-modal')
}

function approvePost() {
  emit('approve-post-modal')
}

function rejectPost() {
  emit('reject-post-modal')
}
</script>

<template>
  <n-modal :show="showModal" :auto-focus="false" :mask-closable="false" style="width: 100%">
    <div>
      <n-card
        v-if="post"
        :title="`By ${post.owner_username} - ${post.created_at_ago}`"
        :content-style="{ padding: '5px' }"
        style="width: 100%; height: 100vh; overflow-y: auto"
      >
        <template #header-extra>
          <n-button size="tiny" @click="closeModal()">
            <template #icon>
              <n-icon><Close /></n-icon>
            </template>
          </n-button>
        </template>

        <div style="padding-left: 10px; padding-right: 10px; padding-bottom: 10px">
          <h2 style="font-weight: bold; margin: 0">{{ post.title }}</h2>

          <div class="html-content" v-html="post.html_content"></div>
        </div>

        <div style="cursor: pointer">
          <PostCarousel :medias="post.medias" :full-screen="true" />
        </div>

        <template #action>
          <div style="display: flex; justify-content: flex-end; gap: 8px">
            <n-button
              size="small"
              type="success"
              @click="approvePost()"
              :loading="post.approving"
              :disabled="post.approving || post.rejecting"
            >
              Approve
            </n-button>
            <n-button
              size="small"
              type="error"
              @click="rejectPost()"
              :loading="post.rejecting"
              :disabled="post.rejecting || post.approving"
            >
              Reject
            </n-button>
          </div>
        </template>
      </n-card>
    </div>
  </n-modal>
</template>

<style>
.html-content pre {
  background-color: #1e1e1e;
  padding: 10px;
  border-radius: 6px;
}
.html-content code {
  font-family: 'Monaco', monospace;
  font-size: 0.95em;
  overflow-x: auto;
  white-space: pre;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #1e1e1e;
  color: white;
  padding: 4px;
  border-radius: 6px;
}
.upper-detail-container {
  display: flex;
  align-items: center;
}
.name-detail-container {
  margin-left: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
