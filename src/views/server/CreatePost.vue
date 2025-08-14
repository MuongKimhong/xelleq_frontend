<script setup>
import {
  NInput,
  NIcon,
  NTabs,
  NTabPane,
  NButton,
  NTag,
  NSpin,
  NCard,
  NModal,
  NUpload,
  NCarousel,
  NSelect,
  useMessage,
} from 'naive-ui'
import { MdCloseCircleOutline } from '@vicons/ionicons4'
import { useCreatePostStore } from '@/stores/forum.js'
import { useUserStore } from '@/stores/user.js'
import { useServerStore } from '@/stores/server.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import api from '@/axios.js'

import EditorMarkdown from '@/components/server/forum/EditorMarkdown.vue'
import EditorRichText from '@/components/server/forum/EditorRichText.vue'
import '@/assets/styles/server.css'
import '@/assets/base.css'

const { t } = useI18n()
const message = useMessage()
const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const createPostStore = useCreatePostStore()
const {
  markdownInput,
  markdownOutput,
  richtextOutput,
  selectedImages,
  selectedVideo,
  selectedServerId,
  contentType,
} = storeToRefs(createPostStore)

const activeEditorTab = ref('richtext')

const activeEditorTabComponent = computed(() => {
  switch (activeEditorTab.value) {
    case 'richtext':
      contentType.value = 'richtext'
      return EditorRichText
    case 'markdown':
      contentType.value = 'markdown'
      return EditorMarkdown
  }
})

function onSelectFileForVideo(data) {
  if (data.file) {
    let file = data.file

    if (file.file) {
      // clear images if select video
      selectedImages.value.length = 0

      selectedVideo.value = {
        file: file.file,
        url: URL.createObjectURL(file.file),
      }
    }
  }
}

const uploadFileList = ref([])
function onSelectFilesAddMoreForImage(data) {
  const fileList = data.fileList

  // clear internal upload state so user can reselect same file
  uploadFileList.value = []

  const max = user.value.maxForumPostGalleryCount
  const existing = new Set(selectedImages.value.map((f) => f.file.name + '-' + f.file.size))

  if (fileList.length + selectedImages.value.length > max) {
    message.error(`You can only upload up to ${max} images at a time`)
    return false
  }

  const newFiles = fileList
    .filter((fileData) => {
      const key = fileData.file.name + '-' + fileData.file.size
      const isImage = fileData.file.type.startsWith('image/')
      return !existing.has(key) && isImage
    })
    .map((fileData) => {
      const file = fileData.file
      return reactive({
        file,
        url: URL.createObjectURL(file),
      })
    })

  selectedImages.value.push(...newFiles)

  // clear video if select images
  selectedVideo.value = null
}

function removeImage(index) {
  document.activeElement?.blur()
  selectedImages.value.splice(index, 1)
}

const serverStore = useServerStore()
const { joinedServers } = storeToRefs(serverStore)
const joinedServersOption = computed(() => {
  return joinedServers.value.map((s) => {
    return {
      label: s.name,
      value: s.id,
    }
  })
})

const creating = ref(false)
const submitPercent = ref(0)
const errText = ref('')
const showErr = ref(false)
const showSuccess = ref(false)
const title = ref('')
const showCreatingModal = ref(false)
const postApprovedByAdmin = ref(false)
const newPost = ref(null)

const canPressCreate = computed(() => {
  if (selectedServerId.value === null || title.value.trim() === '') {
    return false
  }

  let noDescription =
    richtextOutput.value.trim() === '<p></p>' && markdownOutput.value.trim() === ''

  if (selectedImages.value.length === 0 && selectedVideo.value === null && noDescription) {
    return false
  }
  return true
})

async function createPost() {
  showErr.value = false
  showSuccess.value = false
  creating.value = true
  showCreatingModal.value = true

  let plainText = ''
  let tempDiv = document.createElement('div')

  let formData = new FormData()
  formData.append('server_id', selectedServerId.value)
  formData.append('title', title.value)
  formData.append('content_type', contentType.value)

  if (activeEditorTab.value === 'richtext') {
    tempDiv.innerHTML = richtextOutput.value
    plainText = tempDiv.textContent || tempDiv.innerText || ''
    formData.append('content', richtextOutput.value)
  } else if (activeEditorTab.value === 'markdown') {
    tempDiv.innerHTML = markdownOutput.value
    plainText = tempDiv.textContent || tempDiv.innerText || ''
    formData.append('content', markdownOutput.value)
    formData.append('raw_markdown_content', markdownInput.value)
  }

  formData.append('plain_text_content', plainText)

  if (selectedImages.value.length > 0) {
    for (let i = 0; i < selectedImages.value.length; i++) {
      formData.append(`media-${i}`, selectedImages.value[i].file)
    }
  } else if (selectedVideo.value) {
    formData.append('media-0', selectedVideo.value.file)
  }

  try {
    let res = await api.post('/forum/create-forum-post', formData, {
      onUploadProgress: (progressEvent) => {
        submitPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    if (res.status === 200) {
      showSuccess.value = true
      newPost.value = res.data['new_post']
      postApprovedByAdmin.value = res.data['approved_by_server_admin_or_mod']
    }
  } catch (e) {
    if (e.response.data?.error) {
      let errRes = e.response.data?.error

      switch (errRes) {
        case 'Exceed gallery count':
          errText.value = `You can only upload up to ${user.value.maxForumPostGalleryCount} images/videos at a time`
          break
        case 'Member is banned':
          errText.value = 'You have been banned from posting in this server'
          break
        case 'Unsupport media type':
          errText.value = 'Accept only .jpg, .png, .avif, .webp, .mp4, .webm, .avi, .mov, .mpg'
          break
        default:
          errText.value = 'Something went wrong, please try again.'
          break
      }
    } else if (e.response.data) {
      errText.value =
        typeof e.response.data === 'string' ? e.response.data : 'An unknown error occurred.'
    }

    showErr.value = true
  }
  creating.value = false
  createPostStore.reset()
}

function redirectServer() {
  router.push({
    name: 'server-detail',
    params: {
      id: selectedServerId.value,
    },
  })
}

function redirectPost() {
  if (newPost.value) {
    router.push({
      name: 'post-detail',
      params: {
        id: newPost.value.id,
        slug: newPost.value.slug,
        serverid: newPost.value.server_id,
      },
    })
  }
}

onBeforeUnmount(() => {
  uploadFileList.value.length = 0
  createPostStore.reset()
})
</script>

<template>
  <div
    style="
      height: calc(100dvh - 60px);
      overflow-y: auto;
      scroll-behavior: smooth;
      will-change: transform;
    "
  >
    <div class="create-post-container">
      <div class="wrapper">
        <h2 class="mt-4">Select server</h2>
        <n-select
          v-model:value="selectedServerId"
          :options="joinedServersOption"
          :disabled="creating"
        />

        <h2 class="mt-4">Title</h2>
        <n-input
          v-model:value="title"
          type="textarea"
          maxlength="300"
          show-count
          placeholder="Title"
          :autosize="{
            minRows: 1,
            maxRows: 5,
          }"
        />

        <div class="mt-4">
          <h2>Description</h2>
          <n-tabs type="segment" animated v-model:value="activeEditorTab">
            <n-tab-pane name="richtext" tab="Richtext Editor" />
            <n-tab-pane name="markdown" tab="Markdown Editor" />
          </n-tabs>

          <div style="width: 100%">
            <keep-alive>
              <component
                :is="activeEditorTabComponent"
                v-model:markdowninput="markdownInput"
                :markdownoutput="markdownOutput"
                v-model:richtextoutput="richtextOutput"
              />
            </keep-alive>
          </div>
        </div>

        <div class="mt-4">
          <h2>Medias</h2>
          <n-tabs type="segment" animated>
            <n-tab-pane name="images" tab="Images">
              <div style="text-align: center; margin-top: 30px; margin-bottom: 30px">
                <n-upload
                  :file-list="uploadFileList"
                  :default-upload="false"
                  :show-preview-button="false"
                  :show-file-list="false"
                  multiple
                  :disabled="selectedImages.length >= user.maxForumPostGalleryCount"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                  @change="onSelectFilesAddMoreForImage"
                >
                  <n-button>
                    {{
                      selectedImages.length === 0
                        ? `Attach up to ${user.maxForumPostGalleryCount} images`
                        : `Add more ${user.maxForumPostGalleryCount - selectedImages.length} images`
                    }}
                  </n-button>
                </n-upload>

                <n-carousel show-arrow class="mt-4" :touchable="false">
                  <div v-for="(image, index) in selectedImages" :key="index" class="carousel-slide">
                    <img :src="image.url" class="carousel-bg" alt="" />

                    <n-button
                      circle
                      size="small"
                      class="remove-button"
                      type="primary"
                      @click.stop="
                        (e) => {
                          e.currentTarget.blur()
                          removeImage(index)
                        }
                      "
                    >
                      <n-icon size="20"><MdCloseCircleOutline /></n-icon>
                    </n-button>
                    <img :src="image.url" class="carousel-img" alt="" />
                  </div>
                </n-carousel>
              </div>
            </n-tab-pane>
            <n-tab-pane name="video" tab="Video">
              <div style="text-align: center; margin-top: 30px; margin-bottom: 30px">
                <n-upload
                  :default-upload="false"
                  :show-preview-button="false"
                  :show-file-list="false"
                  accept="
                  video/mp4,video/x-matroska,video/x-m4v,video/webm,
                  video/x-msvideo,video/quicktime,video/mpeg
                "
                  @change="onSelectFileForVideo"
                >
                  <n-button> Attach video </n-button>
                </n-upload>

                <div v-if="selectedVideo" class="carousel-slide-video mt-4">
                  <video
                    :src="selectedVideo.url"
                    class="carousel-video"
                    alt=""
                    autoplay
                    muted
                    playsinline
                    loop
                  />
                </div>
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>

        <div v-if="canPressCreate" style="text-align: right; margin-top: 10px; margin-bottom: 30px">
          <n-button type="primary" :loading="creating" :disabled="creating" @click="createPost()">
            Create
          </n-button>
        </div>

        <n-modal v-model:show="showCreatingModal" :mask-closable="false" :auto-focus="false">
          <n-card style="max-width: 400px; padding: 15px">
            <div v-if="creating" style="text-align: center">
              <n-spin :size="50"></n-spin>
              <h3>Please wait {{ submitPercent }}%</h3>
            </div>

            <div v-if="showErr" style="text-align: center">
              <n-tag type="error">{{ errText }}</n-tag>
            </div>

            <div v-if="showSuccess" style="text-align: center">
              <div v-if="!postApprovedByAdmin">
                <span style="color: #18a058">Your post has been sent.</span><br />
                <span style="color: #18a058" class="mt-3">awaiting admin/moderator approval.</span>
              </div>
              <n-tag v-else type="success"> Your post has been published </n-tag>
            </div>

            <div v-if="!showSuccess && !creating" style="text-align: right" class="mt-4">
              <n-button size="small" :disabled="creating" @click="showCreatingModal = false">
                Close
              </n-button>
            </div>

            <div v-if="showSuccess" style="text-align: center" class="mt-4">
              <n-button size="tiny" class="mr-3" @click="router.push({ name: 'home' })">
                Go to Home
              </n-button>
              <!-- <n-button size="tiny" @click="redirectServer()">Go to Server</n-button> -->
              <n-button v-if="postApprovedByAdmin" size="tiny" class="ml-3" @click="redirectPost()">
                View Post
              </n-button>
            </div>
          </n-card>
        </n-modal>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-post-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  /*height: calc(100vh - 60px);*/
  /*overflow-y: auto;
  scroll-behavior: smooth;
  will-change: transform;*/
  margin-left: auto;
  margin-right: auto;
  max-width: 500px;
}
.wrapper {
  padding: 10px;
}
.carousel-slide {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  overflow: hidden;
}
.carousel-slide-video {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: auto;
  overflow: hidden;
}
.carousel-video {
  max-width: 100%;
  object-fit: contain;
  z-index: 1;
  position: relative;
}
.carousel-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  z-index: 1;
  position: relative;
}
.carousel-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(20px);
  transform: scale(1.1); /* Slight zoom for better edge handling */
  z-index: 0;
}
.remove-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
</style>
