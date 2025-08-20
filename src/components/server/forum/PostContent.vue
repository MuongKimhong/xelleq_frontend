<script setup>
import { NCard, NButton, NImage, NPopover, NIcon } from 'naive-ui'
import { CommentRegular, SaveRegular } from '@vicons/fa'
import { ThumbUpOffAltOutlined, DeleteOutlineOutlined, HideSourceTwotone } from '@vicons/material'
import { Dots, Edit } from '@vicons/tabler'
import { useRouter } from 'vue-router'
import { useForumStore, useEditPostStore } from '@/stores/forum.js'
import { useUserStore } from '@/stores/user.js'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'

import PostCarousel from './PostCarousel.vue'
import '@/assets/styles/postDetail.css'
import '@/assets/base.css'

const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const forumStore = useForumStore()
const { deletePostModalRef, hidePostModalRef } = storeToRefs(forumStore)

const editPostStore = useEditPostStore()
const { editPostRef } = storeToRefs(editPostStore)

const emit = defineEmits([
  'update-liked-flag',
  'set-save-btn-loading-flag',
  'set-unsave-btn-loading-flag',
  'post-saved-success',
  'post-unsaved-success',
])

const props = defineProps({
  postData: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: false,
  },
  useFor: {
    // "forum-tab", "post-detail-page" or "new-feed"
    type: String,
    required: true,
  },
})

function viewPost() {
  if (props.postData) {
    if (props.useFor === 'post-detail-page') return

    router.push({
      name: 'post-detail',
      params: {
        id: props.postData.id,
        serverid: props.postData.server_id,
        slug: props.postData.slug,
      },
    })
  }
}

function redirectServer() {
  if (props.postData) {
    router.push({
      name: 'server-detail',
      params: {
        id: props.postData.server_id,
        slug: props.postData.server_slug,
      },
    })
  }
}

function redirectProfile() {
  if (props.postData) {
    router.push({
      name: 'user-profile',
      params: {
        username: props.postData.owner_username,
      },
    })
  }
}

const likeInProgress = ref(false)

async function likeOrUnlikePost() {
  if (likeInProgress.value || !props.postData) return

  likeInProgress.value = true

  let postId = props.postData.id
  let updateLikeCount = true
  let optimisticLiked = !props.postData.user_liked
  emit('update-liked-flag', props.index, optimisticLiked, updateLikeCount)

  try {
    const res = await api.post('/forum/like-or-unlike-forum-post', {
      post_id: postId,
    })

    if (res.status === 200) {
      switch (res.data) {
        case 'like_success':
          emit('update-liked-flag', props.index, true, !updateLikeCount)
          break
        case 'unlike_success':
          emit('update-liked-flag', props.index, false, !updateLikeCount)
          break
      }
    }
  } catch (e) {
    emit('update-liked-flag', props.index, !optimisticLiked, updateLikeCount)
  } finally {
    likeInProgress.value = false
  }
}

function onDeletePostBtnPress() {
  deletePostModalRef.value = {
    id: props.postData.id,
    show: true,
    index: null,
    callFrom: props.useFor,
  }

  let callFrom = [
    'forum-tab',
    'user-posts-tab',
    'user-liked-posts-tab',
    'user-saved-posts-tab',
    'new-feed',
  ]
  if (callFrom.includes(props.useFor)) {
    deletePostModalRef.value['index'] = props.index
  }
}

function onHidePostBtnPress() {
  hidePostModalRef.value = {
    id: props.postData.id,
    show: true,
    index: null,
    callFrom: props.useFor,
  }

  let callFrom = [
    'forum-tab',
    'user-posts-tab',
    'user-liked-posts-tab',
    'user-saved-posts-tab',
    'new-feed',
  ]
  if (callFrom.includes(props.useFor)) {
    hidePostModalRef.value['index'] = props.index
  }
}

async function onSavePostBtnPress() {
  emit('set-save-btn-loading-flag', props.index, true)

  try {
    let res = await api.post('/forum/save-forum-post', {
      post_id: props.postData.id,
    })

    if (res.status === 200) {
      emit('post-saved-success', props.index)
    }
  } catch (_) {}

  emit('set-save-btn-loading-flag', props.index, false)
}

async function onUnsavePostBtnPress() {
  emit('set-unsave-btn-loading-flag', props.index, true)

  try {
    let res = await api.post('/forum/unsave-forum-post', {
      post_id: props.postData.id,
    })

    if (res.status === 200) {
      emit('post-unsaved-success', props.index)
    }
  } catch (_) {}

  emit('set-unsave-btn-loading-flag', props.index, false)
}

function onEditPostBtnPress() {
  editPostRef.value = props.postData
  router.push({ name: 'edit-post' })
}
</script>

<template>
  <n-card :content-style="{ padding: '0px' }">
    <div class="upper-detail-container">
      <div>
        <n-image
          v-if="postData.server_profile_url !== null"
          :src="postData.server_profile_url"
          width="30"
          height="30"
          class="profile-img mt-1"
          preview-disabled
          @click="redirectServer()"
        />
        <n-image
          v-else
          src="/default_user_profile.png"
          @click="redirectServer()"
          preview-disabled
          class="mt-1"
          width="30"
          height="30"
        />
      </div>

      <div class="name-detail-container">
        <div style="display: flex; flex-direction: column">
          <h4 style="margin: 0">
            <span style="cursor: pointer" @click="redirectServer()">
              {{ postData.server_name }}
            </span>
          </h4>
          <h5 style="margin: 0">
            <span class="post-owner-username" @click="redirectProfile()">
              @{{ postData.owner_username }}
            </span>
            . <small>{{ postData.created_at_ago }}</small>
          </h5>
        </div>
      </div>

      <n-popover
        v-if="user.authenticated"
        trigger="click"
        :show-arrow="false"
        placement="left-start"
        style="width: 125px"
      >
        <template #trigger>
          <n-button tertiary size="tiny" round>
            <template #icon>
              <n-icon><Dots /></n-icon>
            </template>
          </n-button>
        </template>

        <div v-if="postData.owner_id === user.id">
          <div>
            <n-button
              quaternary
              size="small"
              type="primary"
              style="width: 100%"
              @click="onEditPostBtnPress()"
            >
              <template #icon>
                <n-icon><Edit /></n-icon>
              </template>
              Edit
            </n-button>
          </div>
          <div>
            <n-button
              quaternary
              size="small"
              type="error"
              style="width: 100%"
              @click="onDeletePostBtnPress()"
            >
              <template #icon>
                <n-icon><DeleteOutlineOutlined /></n-icon>
              </template>
              Delete
            </n-button>
          </div>
        </div>
        <div v-else>
          <div>
            <n-button
              v-if="postData.user_saved"
              quaternary
              size="small"
              style="width: 100%"
              :loading="postData.unsaving"
              :disabled="postData.unsaving"
              @click="onUnsavePostBtnPress()"
            >
              <template #icon>
                <n-icon><SaveRegular /></n-icon>
              </template>
              Unsave Post
            </n-button>
            <n-button
              v-else
              quaternary
              size="small"
              style="width: 100%"
              :loading="postData.saving"
              :disabled="postData.saving"
              @click="onSavePostBtnPress()"
            >
              <template #icon>
                <n-icon><SaveRegular /></n-icon>
              </template>
              Save Post
            </n-button>
          </div>
          <div>
            <n-button quaternary size="small" style="width: 100%" @click="onHidePostBtnPress()">
              <template #icon>
                <n-icon><HideSourceTwotone /></n-icon>
              </template>
              Hide Post
            </n-button>
          </div>
        </div>
      </n-popover>
    </div>

    <div style="padding-left: 10px; padding-right: 10px; padding-bottom: 10px">
      <div style="margin: 0">
        <h2 v-if="useFor !== 'post-detail-page'" style="margin: 0">
          <span @click="viewPost()" style="cursor: pointer; font-weight: bold">
            {{ postData.title }}
          </span>
        </h2>
        <h2 v-else style="font-weight: bold; margin: 0">{{ postData.title }}</h2>
      </div>

      <!-- <div style="margin: 0; background-color: red"> -->
      <div v-if="useFor !== 'post-detail-page'" class="text-truncate py-1">
        <span @click="viewPost()" style="cursor: pointer; font-size: 16px">{{
          postData.plain_text_content
        }}</span>
      </div>
      <div v-else class="html-content" v-html="postData.html_content"></div>
      <!-- </div> -->

      <div style="cursor: pointer" class="mt-2">
        <PostCarousel :medias="postData.medias" :full-screen="false" />
      </div>

      <div>
        <n-button
          :disabled="!user.authenticated || likeInProgress"
          :type="postData.user_liked ? 'primary' : 'default'"
          size="small"
          round
          @click="likeOrUnlikePost()"
        >
          <template #icon>
            <n-icon><ThumbUpOffAltOutlined /></n-icon>
          </template>
          {{ postData.like_count }}
        </n-button>
        <n-button size="small" round class="ml-2" @click="viewPost()">
          <template #icon>
            <n-icon><CommentRegular /></n-icon>
          </template>
          {{ postData.comment_count }}
        </n-button>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.upper-detail-container {
  display: flex;
  align-items: center;
}
.name-detail-container {
  margin-left: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
