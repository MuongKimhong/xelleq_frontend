<script setup>
import { NCard, NButton, NInput } from 'naive-ui'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'

const postDetailStore = usePostDetailStore()
const { postData, comments } = storeToRefs(postDetailStore)

const postingComment = ref(false)
const comment = ref('')
const showBtn = ref(false)

async function postComment() {
  postingComment.value = true

  try {
    let res = await api.post('/forum/comment-on-forum-post', {
      post_id: postData.value?.id,
      content: comment.value,
    })

    if (res.status === 200) {
      comments.value.unshift(res.data)
      postData.value.comment_count += 1
      comment.value = ''
    }
  } catch (_) {}

  postingComment.value = false
  showBtn.value = false
}

function onInputFocus() {
  showBtn.value = true
}

function cancelInput() {
  comment.value = ''
  showBtn.value = false
}
</script>

<template>
  <div style="padding: 15px">
    <div>
      <n-input
        v-model:value="comment"
        placeholder="Write comment"
        type="textarea"
        :autosize="{
          minRows: 2,
          maxRows: 50,
        }"
        @focus="onInputFocus"
      ></n-input>

      <div v-if="showBtn" style="text-align: right" class="mt-4">
        <n-button size="small" class="mr-3" @click="cancelInput">Cancel</n-button>
        <n-button
          size="small"
          type="primary"
          :disabled="postingComment || comment.trim() === ''"
          :loading="postingComment"
          @click="postComment()"
        >
          Comment
        </n-button>
      </div>
    </div>
  </div>
</template>
