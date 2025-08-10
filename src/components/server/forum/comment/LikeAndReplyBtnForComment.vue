<script setup>
import { NButton, NIcon } from 'naive-ui'
import { ThumbUpOffAltOutlined } from '@vicons/material'
import { CommentRegular } from '@vicons/fa'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import api from '@/axios.js'
import '@/assets/base.css'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const emit = defineEmits(['like-btn-press', 'set-liking-flag', 'reply-btn-press'])
const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  commentIndex: {
    type: Number,
    required: true,
  },
  isLiking: {
    type: Boolean,
    required: true,
  },
})

async function likeComment() {
  emit('set-liking-flag', props.commentIndex, true)

  try {
    let res = await api.post('/forum/like-or-unlike-forum-comment', {
      comment_id: props.comment.id,
    })

    if (res.status === 200) {
      emit('like-btn-press', props.commentIndex, res.data)
    }
  } catch (_) {}

  emit('set-liking-flag', props.commentIndex, false)
}

function onReplyBtnPress() {
  emit('reply-btn-press', props.commentIndex, props.comment)
}
</script>

<template>
  <div>
    <n-button
      :disabled="!user.authenticated || isLiking"
      :type="comment.user_liked ? 'primary' : 'default'"
      size="tiny"
      round
      tertiary
      @click="likeComment()"
    >
      <template #icon>
        <n-icon><ThumbUpOffAltOutlined /></n-icon>
      </template>
      {{ comment.like_count }}
    </n-button>
    <n-button
      :disabled="!user.authenticated"
      size="tiny"
      round
      tertiary
      class="ml-2"
      @click="onReplyBtnPress()"
    >
      <template #icon>
        <n-icon><CommentRegular /></n-icon>
      </template>
      Reply
    </n-button>
  </div>
</template>
