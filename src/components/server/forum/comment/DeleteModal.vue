<script setup>
//  this component is used inside CommentList.vue

import { NModal, NCard, NButton } from 'naive-ui'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/base.css'

const emit = defineEmits(['delete-success'])

const postDetailStore = usePostDetailStore()
const { deleteCommentModalRef } = storeToRefs(postDetailStore)

const deleting = ref(false)
async function deleteComment() {
  deleting.value = true

  let endPoint = '/forum/delete-forum-comment'
  let payload = {
    comment_id: deleteCommentModalRef.value.id,
  }

  if (deleteCommentModalRef.value.editType === 'reply-comment') {
    endPoint = '/forum/delete-forum-reply-comment'
    payload = {
      reply_comment_id: deleteCommentModalRef.value.id,
    }
  }
  try {
    let res = await api.delete(endPoint, {
      data: payload,
    })

    if (res.status === 200) {
      emit('delete-success')
    }
  } catch (_) {}

  deleting.value = false
}

function cancel() {
  postDetailStore.resetDeleteCommentModalRef()
}
</script>

<template>
  <n-modal :show="deleteCommentModalRef.show" :mask-closable="false">
    <n-card style="max-width: 400px; max-height: 800px" title="Are you sure you want to delete?">
      <div style="text-align: right" class="mt-3">
        <n-button size="small" class="mr-2" @click="cancel()" :disabled="deleting">Cancel</n-button>
        <n-button
          size="small"
          type="error"
          :loading="deleting"
          :disabled="deleting"
          @click="deleteComment()"
        >
          Delete
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
