<script setup>
import { NInput, NImage, NButton, NIcon } from 'naive-ui'
import { UserCircleRegular } from '@vicons/fa'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { useUserStore } from '@/stores/user.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/styles/postDetail.css'
import '@/assets/base.css'

import EditDeleteCommentPopover from './EditDeleteCommentPopover.vue'
import LikeAndReplyBtnForComment from './LikeAndReplyBtnForComment.vue'
import EditModal from './EditModal.vue'
import DeleteModal from './DeleteModal.vue'
import ReplyCommentList from './ReplyCommentList.vue'
import ViewReplyBtn from './ViewReplyBtn.vue'

const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const postDetailStore = usePostDetailStore()
const { postData, comments, editCommentModalRef, deleteCommentModalRef, singleComment } =
  storeToRefs(postDetailStore)

const replyToPlaceholder = ref('')
const replyToUserId = ref('')
const replyToCommentId = ref(null)

function onReplyBtnPress(commentIndex, comment) {
  if (comments.value[commentIndex].can_reply) {
    onCloseReplyBtnPress(commentIndex)
    return
  }

  replyToUserId.value = comment.owner_id
  replyToPlaceholder.value = `Reply to ${comment.owner_username}`
  replyToCommentId.value = comment.id

  // Reset all can_reply to false first
  comments.value.forEach((comment) => {
    comment.can_reply = false
  })
  comments.value[commentIndex].can_reply = true
  comments.value[commentIndex].reply_content = ''
}

function setCommentLiking(commentIndex, flag) {
  comments.value[commentIndex].liking = flag
}

function onLikeBtnPress(commentIndex, likeStatus) {
  let comment = comments.value[commentIndex]

  switch (likeStatus) {
    case 'like_success':
      comment.user_liked = true
      comment.like_count += 1
      return
    case 'unlike_comment_success':
      comment.user_liked = false
      comment.like_count -= 1
      return
  }
}

function onCloseReplyBtnPress(index) {
  replyToUserId.value = ''
  replyToPlaceholder.value = ''
  replyToCommentId.value = null

  let comment = comments.value[index]
  comment.can_reply = false
  comment.reply_content = ''
}

const replying = ref(false)

async function replyComment(commentIndex) {
  if (replyToCommentId.value === null) return

  replying.value = true
  let comment = comments.value[commentIndex]

  try {
    let res = await api.post('/forum/reply-comment-on-forum-post', {
      comment_id: replyToCommentId.value,
      reply_to_user_id: replyToUserId.value,
      content: comment.reply_content,
    })

    if (res.status === 200) {
      comment.reply_comments.unshift(res.data)
      onCloseReplyBtnPress(commentIndex)
    }
  } catch (_) {}

  replying.value = false
}

function handleToggleRCommentCanReply(
  commentIndex,
  rCommentIndex,
  currentFlag,
  replyToUsername,
  replyToUserIdParam,
) {
  let comment = comments.value[commentIndex]

  // reset first
  if (!currentFlag) {
    comment.reply_comments.forEach((r) => {
      r.can_reply = false
    })
  }

  let rComment = comment.reply_comments[rCommentIndex]
  rComment.can_reply = !currentFlag

  if (rComment.can_reply) {
    replyToUserId.value = replyToUserIdParam
    replyToPlaceholder.value = `Reply to ${replyToUsername}`
    replyToCommentId.value = comment.id
  } else {
    replyToUserId.value = ''
    replyToPlaceholder.value = ''
    replyToCommentId.value = null
  }
  rComment.reply_content = ''
}

function handleHideAllRCommentCanReply(commentIndex) {
  comments.value[commentIndex].reply_comments.forEach((r) => {
    r.can_reply = false
  })
}

// update each reply-comment's reply_content
function handleUpdateReplyContent(commentIndex, rCommentIndex, newValue) {
  let comment = comments.value[commentIndex]
  let rComment = comment.reply_comments[rCommentIndex]
  rComment.reply_content = newValue
}

function handleSetReplyCommentLikingFlag(commentIndex, rCommentIndex, flag) {
  let comment = comments.value[commentIndex]
  comment.reply_comments[rCommentIndex].liking = flag
}

function handleOnLikeReplyComment(commentIndex, rCommentIndex, likeStatus) {
  let comment = comments.value[commentIndex]
  let rComment = comment.reply_comments[rCommentIndex]

  switch (likeStatus) {
    case 'like_success':
      rComment.user_liked = true
      rComment.like_count += 1
      return
    case 'unlike_comment_success':
      rComment.user_liked = false
      rComment.like_count -= 1
      return
  }
}

function onEditCommentBtnPress(commentIndex, comment) {
  editCommentModalRef.value = {
    id: comment.id,
    commentIndex: commentIndex,
    replyCommentIndex: null,
    content: comment.content,
    editType: 'comment',
    show: true,
  }
}

function handleOnEditSuccess() {
  let comment = comments.value[editCommentModalRef.value.commentIndex]

  switch (editCommentModalRef.value.editType) {
    case 'comment':
      comment.content = editCommentModalRef.value.content
      postDetailStore.resetEditCommentModalRef()
      break
    case 'reply-comment':
      let replyComment = comment.reply_comments[editCommentModalRef.value.replyCommentIndex]

      replyComment.content = editCommentModalRef.value.content
      postDetailStore.resetEditCommentModalRef()
      break
  }
}

function onDeleteCommentBtnPress(commentIndex, comment) {
  deleteCommentModalRef.value = {
    id: comment.id,
    commentIndex: commentIndex,
    replyCommentIndex: null,
    deleteType: 'comment',
    show: true,
  }
}

function handleOnDeleteSuccess() {
  switch (deleteCommentModalRef.value.deleteType) {
    case 'comment':
      comments.value.splice(deleteCommentModalRef.value.commentIndex, 1)
      postData.value.comment_count -= 1
      postDetailStore.resetDeleteCommentModalRef()
      break
    case 'reply-comment':
      let comment = comments.value[deleteCommentModalRef.value.commentIndex]

      comment.reply_comments.splice(deleteCommentModalRef.value.replyCommentIndex, 1)
      postDetailStore.resetDeleteCommentModalRef()
      break
  }
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
  <div>
    <EditModal @edit-success="handleOnEditSuccess" />
    <DeleteModal @delete-success="handleOnDeleteSuccess" />

    <div v-for="(comment, commentIndex) in comments" :key="comment.id" class="comment-container">
      <div class="comment-header">
        <n-image
          v-if="comment.owner_profile_url"
          :src="comment.owner_profile_url"
          width="25"
          height="25"
          class="profile-img"
        />
        <n-icon v-else :size="25">
          <UserCircleRegular />
        </n-icon>

        <div class="comment-meta">
          <div class="meta-left">
            <span class="username" @click="redirectProfile(comment.owner_username)">
              {{ comment.owner_username }}
            </span>
            <span> . </span>
            <span class="timestamp">{{ comment.created_at_ago }}</span>
            <span v-if="comment.edited" class="timestamp"> ( Edited )</span>
          </div>
          <EditDeleteCommentPopover
            v-if="comment.owner_id === user.id"
            :comment-index="commentIndex"
            :comment="comment"
            @edit-btn-press="onEditCommentBtnPress(commentIndex, comment)"
            @delete-btn-press="onDeleteCommentBtnPress(commentIndex, comment)"
          />
        </div>
      </div>

      <p class="comment-body">{{ comment.content }}</p>

      <div class="comment-body">
        <LikeAndReplyBtnForComment
          :comment-index="commentIndex"
          :comment="comment"
          :is-liking="comment.liking"
          @set-liking-flag="setCommentLiking"
          @like-btn-press="onLikeBtnPress"
          @reply-btn-press="onReplyBtnPress"
        />

        <div v-if="comment.can_reply" class="mt-3">
          <n-input
            v-model:value="comment.reply_content"
            :placeholder="replyToPlaceholder"
            type="textarea"
            :autosize="{
              minRows: 2,
              maxRows: 20,
            }"
          ></n-input>

          <div style="text-align: right" class="mt-3">
            <n-button size="small" class="mr-3" @click="onCloseReplyBtnPress(commentIndex)">
              Cancel
            </n-button>
            <n-button
              size="small"
              type="primary"
              @click="replyComment(commentIndex)"
              :loading="replying"
              :disabled="replying || comment.reply_content.trim() === ''"
            >
              Reply
            </n-button>
          </div>
        </div>

        <div class="mt-4">
          <ReplyCommentList
            :r-comments="comment.reply_comments"
            :comment-index="commentIndex"
            :comment-id="comment.id"
            :reply-placeholder="replyToPlaceholder"
            @toggle-r-comment-can-reply="handleToggleRCommentCanReply"
            @update-reply-content="handleUpdateReplyContent"
            @hide-all-r-comment-can-reply="handleHideAllRCommentCanReply"
            @set-reply-comment-liking="handleSetReplyCommentLikingFlag"
            @like-reply-comment="handleOnLikeReplyComment"
          />

          <ViewReplyBtn
            v-if="comment.reply_count > 0"
            :comment-index="commentIndex"
            :comment="comment"
          />
        </div>
      </div>
    </div>
  </div>
</template>
