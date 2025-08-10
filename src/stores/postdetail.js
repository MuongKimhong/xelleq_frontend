import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const usePostDetailStore = defineStore('postDetailStore', () => {
  const postData = ref(null)
  const comments = ref([])

  // use to be shown a single comment thread, when redicted
  // from notification. show the comment and all its replies.
  //
  // when redirect to post detail, if singleComment is not null
  // show single comment thread
  const singleComment = ref(null)

  const editCommentModalRef = ref({
    show: false,
    id: null,
    commentIndex: null,
    replyCommentIndex:null,
    content: "",
    editType: "comment" // or "reply-comment"
  })

  const deleteCommentModalRef = ref({
    show: false,
    id: null,
    commentIndex: null,
    replyCommentIndex: null,
    deleteType: "comment" // or "reply-comment"
  })

  function resetEditCommentModalRef() {
    editCommentModalRef.value = {
      show: false,
      id: null,
      commentIndex: null,
      replyCommentIndex:null,
      content: "",
      editType: "comment"
    }
  }

  function resetDeleteCommentModalRef() {
     deleteCommentModalRef.value = {
      show: false,
      id: null,
      commentIndex: null,
      replyCommentIndex:null,
      deleteType: "comment"
    }
  }

  return {
    postData,
    comments,
    editCommentModalRef,
    resetEditCommentModalRef,
    deleteCommentModalRef,
    resetDeleteCommentModalRef,
    singleComment
  }
})
