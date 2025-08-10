<script setup>
import { NImage, NButton, NIcon, NPopover, NInput } from 'naive-ui'
import { ThumbUpOffAltOutlined, DeleteOutlineOutlined } from '@vicons/material'
import { CommentRegular, UserCircleRegular } from '@vicons/fa'
import { Dots, Edit } from '@vicons/tabler'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/styles/postDetail.css'
import '@/assets/base.css'

const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const postDetailStore = usePostDetailStore()
const { comments, editCommentModalRef, deleteCommentModalRef } = storeToRefs(postDetailStore)

const emit = defineEmits([
  'toggle-r-comment-can-reply',
  'update-reply-content',
  'hide-all-r-comment-can-reply',
  'set-reply-comment-liking',
  'like-reply-comment',
])

const props = defineProps({
  rComments: {
    type: Array,
    required: true,
  },
  commentIndex: {
    type: Number,
    required: true,
  },
  commentId: {
    type: Number,
    required: true,
  },
  replyPlaceholder: {
    type: String,
    default: '',
  },
})

function onInputChange(rCommentIndex, newValue) {
  emit('update-reply-content', props.commentIndex, rCommentIndex, newValue)
}

function toggleCanReply(rCommentIndex, replyToUsername, replyToUserId) {
  let currentFlag = props.rComments[rCommentIndex].can_reply
  emit(
    'toggle-r-comment-can-reply',
    props.commentIndex,
    rCommentIndex,
    currentFlag,
    replyToUsername,
    replyToUserId,
  )
}

const replying = ref(false)
async function replyComment(rCommentIndex, replyToUserId) {
  replying.value = true
  let comment = comments.value[props.commentIndex]
  let rComment = props.rComments[rCommentIndex]

  try {
    let res = await api.post('/forum/reply-comment-on-forum-post', {
      comment_id: comment.id,
      reply_to_user_id: replyToUserId,
      content: rComment.reply_content,
    })

    if (res.status === 200) {
      comment.reply_comments.splice(rCommentIndex + 1, 0, res.data)
      emit('hide-all-r-comment-can-reply', props.commentIndex)
    }
  } catch (_) {}

  replying.value = false
}

function onEditReplyCommentBtnPress(rCommentIndex, rComment) {
  editCommentModalRef.value = {
    id: rComment.id,
    commentIndex: props.commentIndex,
    replyCommentIndex: rCommentIndex,
    content: rComment.content,
    editType: 'reply-comment',
    show: true,
  }
}

function onDeleteReplyCommentBtnPress(rCommentIndex, rComment) {
  deleteCommentModalRef.value = {
    id: rComment.id,
    commentIndex: props.commentIndex,
    replyCommentIndex: rCommentIndex,
    deleteType: 'reply-comment',
    show: true,
  }
}

async function likeReplyComment(rCommentIndex, rCommentId) {
  emit('set-reply-comment-liking', props.commentIndex, rCommentIndex, true)

  try {
    let res = await api.post('/forum/like-or-unlike-forum-reply-comment', {
      reply_comment_id: rCommentId,
    })

    if (res.status === 200) {
      emit('like-reply-comment', props.commentIndex, rCommentIndex, res.data)
    }
  } catch (_) {}

  emit('set-reply-comment-liking', props.commentIndex, rCommentIndex, false)
}

function redirectProfile(ownerUsername) {
  router.push({
    name: 'user-profile',
    params: {
      username: ownerUsername,
    },
  })
}
</script>

<template>
  <div v-for="(rComment, rCommentIndex) in rComments" :key="rComment.id">
    <div class="comment-header">
      <n-image
        v-if="rComment.owner_profile_url"
        :src="rComment.owner_profile_url"
        width="25"
        height="25"
        class="profile-img"
      />
      <n-icon v-else :size="25">
        <UserCircleRegular />
      </n-icon>

      <div class="comment-meta">
        <div class="meta-left">
          <span class="username" @click="redirectProfile(rComment.owner_username)">
            {{ rComment.owner_username }}
          </span>
          <span class="dot">·</span>
          <span class="timestamp">{{ rComment.created_at_ago }}</span>
          <span v-if="rComment.edited" class="timestamp"> ( Edited )</span>
        </div>
        <n-popover
          v-if="rComment.owner_id === user.id"
          trigger="click"
          :show-arrow="false"
          placement="left-end"
          style="width: 100px"
        >
          <template #trigger>
            <n-button tertiary size="tiny" round>
              <template #icon>
                <n-icon><Dots /></n-icon>
              </template>
            </n-button>
          </template>
          <div style="text-align: center">
            <n-button
              quaternary
              size="small"
              type="primary"
              style="width: 100%"
              @click="onEditReplyCommentBtnPress(rCommentIndex, rComment)"
            >
              <template #icon>
                <n-icon><Edit /></n-icon>
              </template>
              Edit
            </n-button>
          </div>
          <div style="text-align: center" class="mt-2">
            <n-button
              quaternary
              size="small"
              type="error"
              style="width: 100%"
              @click="onDeleteReplyCommentBtnPress(rCommentIndex, rComment)"
            >
              <template #icon>
                <n-icon><DeleteOutlineOutlined /></n-icon>
              </template>
              Delete
            </n-button>
          </div>
        </n-popover>
      </div>
    </div>

    <p class="comment-body">
      <span
        style="color: #2080f0; cursor: pointer"
        v-if="rComment.reply_to_user_id !== rComment.owner_id"
        @click="redirectProfile(rComment.reply_to_username)"
      >
        @{{ rComment.reply_to_username }}
      </span>
      {{ rComment.content }}
    </p>

    <div class="comment-body mb-3">
      <n-button
        :disabled="!user.authenticated || rComment.liking"
        :type="rComment.user_liked ? 'primary' : 'default'"
        size="tiny"
        round
        tertiary
        @click="likeReplyComment(rCommentIndex, rComment.id)"
      >
        <template #icon>
          <n-icon><ThumbUpOffAltOutlined /></n-icon>
        </template>
        {{ rComment.like_count }}
      </n-button>
      <n-button
        :disabled="!user.authenticated"
        size="tiny"
        round
        tertiary
        class="ml-2"
        @click="toggleCanReply(rCommentIndex, rComment.owner_username, rComment.owner_id)"
      >
        <template #icon>
          <n-icon><CommentRegular /></n-icon>
        </template>
        Reply
      </n-button>

      <div v-if="rComment.can_reply" class="mt-3">
        <n-input
          :value="rComment.reply_content"
          @input="onInputChange(rCommentIndex, $event)"
          :placeholder="replyPlaceholder"
          type="textarea"
          :autosize="{
            minRows: 2,
            maxRows: 20,
          }"
        ></n-input>

        <div style="text-align: right" class="mt-3">
          <n-button
            size="small"
            class="mr-3"
            @click="toggleCanReply(rCommentIndex, rComment.owner_username, rComment.owner_id)"
          >
            Cancel
          </n-button>
          <n-button
            size="small"
            type="primary"
            :loading="replying"
            :disabled="rComment.reply_content.trim() === '' || replying"
            @click="replyComment(rCommentIndex, rComment.owner_id)"
          >
            Reply
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>
