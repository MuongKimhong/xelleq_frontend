// to be used for server-detail, forum tab

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  }),
)

export const useCreatePostStore = defineStore('createPostStore', () => {
  const selectedServerId = ref(null)
  const selectedImages = ref([])
  const selectedVideo = ref(null)
  const contentType = ref('richtext')

  const markdownInput = ref('')
  const markdownOutput = computed(() => marked.parse(markdownInput.value))

  const richtextOutput = ref('<p></p>')

  function reset() {
    selectedServerId.value = null
    selectedImages.value.length = 0
    selectedVideo.value = null
    contentType.value = "richtext"
    markdownInput.value = ""
    richtextOutput.value = "<p></p>"
  }

  return {
    selectedServerId,
    selectedImages,
    selectedVideo,
    markdownInput,
    markdownOutput,
    richtextOutput,
    contentType,
    reset
  }
})

export const useEditPostStore = defineStore('editPostStore', () => {
  const editPostRef = ref(null)

  function resetEditPostRef() {
    editPostRef.value = null
  }
  return { editPostRef, resetEditPostRef }
},
  {
    persist: true,
  }
)

// used inside Forum tab of ServerDetail page and PostDetail page
export const useForumStore = defineStore('forum', () => {
  const posts = ref([])

  const deletePostModalRef = ref({
    id: null,
    show: false,
    index: null,
    callFrom: "forum-tab" // or "post-detail-page" or "new-feed"
  })

  function resetDeletePostModalRef() {
    deletePostModalRef.value = {
      id: null,
      show: false,
      index: null,
      callFrom: "forum-tab"
    }
  }

  const hidePostModalRef = ref({
    id: null,
    show: false,
    index: null,
    callFrom: "forum-tab" // or "post-detail-page" or "new-feed"
  })

  function resetHidePostModalRef() {
    hidePostModalRef.value = {
      id: null,
      show: false,
      index: null,
      callFrom: "forum-tab"
    }
  }

  return {
    posts,
    deletePostModalRef,
    resetDeletePostModalRef,
    hidePostModalRef,
    resetHidePostModalRef
  }
})
