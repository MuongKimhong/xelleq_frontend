<script setup>
import { NButton, NIcon } from 'naive-ui'
import { ArrowHookDownRight28Regular } from '@vicons/fluent'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/base.css'

const props = defineProps({
  commentIndex: {
    type: Number,
    default: null,
  },
  comment: {
    type: Object,
    default: null,
  },
})

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const postDetailStore = usePostDetailStore()
const { postData, comments } = storeToRefs(postDetailStore)

const loadingReplyComments = ref(false)

async function getReplyComments() {
  loadingReplyComments.value = true

  let useEndpoint = '/forum/get-forum-reply-comments-unauth'

  if (user.value.authenticated) {
    useEndpoint = '/forum/get-forum-reply-comments-auth'
  }
  let commentIndex = props.commentIndex
  let comment = comments.value[commentIndex]

  try {
    let res = await api.get(useEndpoint, {
      params: {
        post_id: postData.value.id,
        comment_id: comment.id,
        page: comment.current_reply_page,
      },
    })

    if (res.status === 200) {
      comment.reply_showed = true
      comment.total_reply_pages = res.data['total_pages']
      comment.current_reply_page += 1

      const existingIds = new Set(comment.reply_comments.map((r) => r.id))

      for (const newReply of res.data['reply_comments']) {
        if (!existingIds.has(newReply.id)) {
          comment.reply_comments.push(newReply)
        }
      }

      let count = res.data['reply_comments_count']
      comment.reply_count -= count
    }
  } catch (_) {}

  loadingReplyComments.value = false
}
</script>

<template>
  <n-button
    tertiary
    size="tiny"
    @click="getReplyComments()"
    :loading="loadingReplyComments"
    :disabled="loadingReplyComments"
  >
    <template #icon>
      <n-icon><ArrowHookDownRight28Regular /></n-icon>
    </template>
    View {{ comment.reply_count }}
    <span v-if="comment.reply_count > 1" class="ml-1"> replies</span>
    <span v-else class="ml-1"> reply</span>
  </n-button>
</template>
