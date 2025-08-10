<script setup>
//  this component is used inside CommentList.vue

import { NModal, NCard, NButton, NInput } from 'naive-ui'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/base.css'

const emit = defineEmits(['edit-success'])

const postDetailStore = usePostDetailStore()
const { editCommentModalRef } = storeToRefs(postDetailStore)

const editing = ref(false)
async function edit() {
  editing.value = true
  let endPoint = '/forum/update-forum-comment'
  let payload = {
    comment_id: editCommentModalRef.value.id,
    content: editCommentModalRef.value.content,
  }

  if (editCommentModalRef.value.editType === 'reply-comment') {
    endPoint = '/forum/update-forum-reply-comment'
    payload = {
      reply_comment_id: editCommentModalRef.value.id,
      content: editCommentModalRef.value.content,
    }
  }
  try {
    let res = await api.put(endPoint, payload)

    if (res.status === 200) {
      emit('edit-success')
    }
  } catch (_) {}

  editing.value = false
}

function cancel() {
  postDetailStore.resetEditCommentModalRef()
}
</script>

<template>
  <n-modal :show="editCommentModalRef.show" :mask-closable="false">
    <n-card style="max-width: 450px; max-height: 800px" title="Edit">
      <n-input
        type="textarea"
        :autosize="{
          minRows: 2,
          maxRows: 50,
        }"
        v-model:value="editCommentModalRef.content"
      ></n-input>

      <div style="text-align: right" class="mt-4">
        <n-button size="small" class="mr-2" @click="cancel()" :disabled="editing">Cancel</n-button>
        <n-button
          size="small"
          type="primary"
          :loading="editing"
          :disabled="editing || editCommentModalRef.content.trim() === ''"
          @click="edit()"
        >
          Edit
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
