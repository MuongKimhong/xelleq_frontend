<script setup>
import { NSpin, NTag, NButton } from 'naive-ui'
import { useUpdatePostDetailWS } from '@/stores/websocket/post_detail.js'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { useForumStore } from '@/stores/forum.js'
import { useUserStore } from '@/stores/user.js'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ref, onBeforeUnmount, watch, onMounted, nextTick, useTemplateRef } from 'vue'
import hljs from 'highlight.js'
import api from '@/axios.js'

// import EditorRichText from '../../components/server/forum/EditorRichText.vue'
import CommentList from '@/components/server/forum/comment/CommentList.vue'
import CommentInput from '@/components/server/forum/comment/CommentInput.vue'
import PostContent from '@/components/server/forum/PostContent.vue'
import 'highlight.js/styles/github-dark.css'
import '@/assets/base.css'

const route = useRoute()
const router = useRouter()

const updatePostDetailWSStore = useUpdatePostDetailWS()
const { updatePostDetailWS } = storeToRefs(updatePostDetailWSStore)

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const postDetailStore = usePostDetailStore()
const { postData, comments, singleComment } = storeToRefs(postDetailStore)

const loading = ref(false)
const loadErr = ref(false)

async function getPostDetail() {
  loadErr.value = false
  loading.value = true

  let useEndpoint = '/forum/get-post-detail-unauth'

  if (user.value.authenticated) {
    useEndpoint = '/forum/get-post-detail-auth'
  }

  try {
    let res = await api.get(useEndpoint, {
      params: {
        post_id: route.params.id,
        server_id: route.params.serverid,
      },
    })

    if (res.status === 200) {
      postData.value = res.data['post']
    }
  } catch (_) {
    router.push({ name: 'page-not-found' })
    return
  }
  loading.value = false
}

const loadingComments = ref(false)
const currentCommentPage = ref(0)
const totalCommentPages = ref(0)

async function getComments() {
  if (loadingComments.value) return

  loadingComments.value = true

  if (singleComment.value !== null) {
    try {
      let res = await api.get('/forum/get-forum-single-comment', {
        params: {
          comment_id: singleComment.value.commentId,
          post_id: singleComment.value.postId,
        },
      })

      if (res.status === 200) {
        comments.value.push(res.data)
      }
    } catch (_) {}
  } else {
    let useEndpoint = '/forum/get-forum-comments-unauth'

    if (user.value.authenticated) {
      useEndpoint = '/forum/get-forum-comments-auth'
    }

    try {
      let res = await api.get(useEndpoint, {
        params: {
          page: currentCommentPage.value,
          post_id: route.params.id,
        },
      })
      if (res.status === 200) {
        comments.value.push(...res.data['comments'])
        totalCommentPages.value = res.data['total_pages']
        currentCommentPage.value += 1
      }
    } catch (_) {
      router.push({ name: 'page-not-found' })
      return
    }
  }

  loadingComments.value = false
}

async function seeAllComments() {
  singleComment.value = null
  currentCommentPage.value = 0
  totalCommentPages.value = 0
  comments.value.length = 0
  await getComments()
}

async function handleGetMoreCommentsOnScroll() {
  const container = postDetailContainer.value
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 200

  if (scrollPosition >= threshold) {
    if (currentCommentPage.value >= totalCommentPages.value || loadingComments.value) return
    getComments()
  }
}

function cleanUpEventAndWS() {
  updatePostDetailWSStore.disconnect()

  if (postDetailContainer.value) {
    postDetailContainer.value.removeEventListener('scroll', handleGetMoreCommentsOnScroll)
  }
  comments.value.length = 0
  singleComment.value = null
}

onMounted(async () => {
  await getPostDetail()
  await getComments()
  await nextTick()
  highlightCodeBlocks()

  if (updatePostDetailWS.value === null && user.value.authenticated) {
    updatePostDetailWSStore.connect(postData.value.id)

    updatePostDetailWS.value.onmessage = (e) => {
      let data = JSON.parse(e.data)
      updatePostDetailWSStore.handleMessageType(data)
    }
  }

  if (postDetailContainer.value) {
    postDetailContainer.value.addEventListener('scroll', handleGetMoreCommentsOnScroll)
  }
})

onBeforeUnmount(() => {
  cleanUpEventAndWS()
})

watch(
  () => postData.value?.html_content,
  async () => {
    await nextTick()
    highlightCodeBlocks()
  },
)

function onUpdateLikedFlag(_index, flag, updateLikeCount) {
  if (postData.value) {
    postData.value.user_liked = flag

    if (updateLikeCount) {
      if (flag) {
        postData.value.like_count += 1
      } else {
        postData.value.like_count -= 1
      }
    }
  }
}

function onSetSaveBtnLoadingFlag(_index, flag) {
  if (postData.value) {
    postData.value.saving = flag
  }
}

function onSetUnsaveBtnLoadingFlag(_index, flag) {
  if (postData.value) {
    postData.value.unsaving = flag
  }
}

function onPostSavedSuccess(_index) {
  if (postData.value) {
    postData.value.user_saved = true
  }
}

function onPostUnsavedSuccess(_index) {
  if (postData.value) {
    postData.value.user_saved = false
  }
}

function highlightCodeBlocks() {
  document
    .querySelectorAll('.html-content pre code')
    .forEach((block) => hljs.highlightElement(block))
}

const postDetailContainer = useTemplateRef('postDetailContainer')
</script>

<template>
  <!-- 60px is navbar width to avoid unwanted overflow -->
  <div ref="postDetailContainer" class="post-detail-container">
    <div v-if="loading" class="mt-4" style="text-align: center">
      <n-spin :size="55"></n-spin>
    </div>

    <div v-if="loadErr" class="mt-4" style="text-align: center">
      <n-tag type="error">Something went wrong, please try again!</n-tag>
    </div>

    <div v-if="postData && !loadErr && !loading">
      <PostContent
        :post-data="postData"
        :index="0"
        :use-for="`post-detail-page`"
        @update-liked-flag="onUpdateLikedFlag"
        @set-save-btn-loading-flag="onSetSaveBtnLoadingFlag"
        @set-unsave-btn-loading-flag="onSetUnsaveBtnLoadingFlag"
        @post-saved-success="onPostSavedSuccess"
        @post-unsaved-success="onPostUnsavedSuccess"
      />

      <CommentInput v-if="user.authenticated" />
    </div>

    <div v-if="!loadErr">
      <div
        v-if="singleComment"
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 15px;
          padding-right: 15px;
          padding-top: 10px;
          padding-bottom: 10px;
        "
      >
        <span style="color: #2080f0">Single comment thread</span>
        <n-button size="tiny" tertiary @click="seeAllComments">See all comments</n-button>
      </div>
      <CommentList />
    </div>
  </div>
</template>

<style>
.post-detail-container {
  scroll-behavior: smooth;
  will-change: transform;
  height: calc(100dvh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}
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
</style>
