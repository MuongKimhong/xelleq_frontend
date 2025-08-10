<script setup>
import { NInput, NImage, NButton, NIcon, NUpload, useMessage } from 'naive-ui'
import {
  ArrowUp,
  ImageRegular,
  Microphone,
  FileVideoRegular,
  WindowCloseRegular,
  TrashAlt,
  MicrophoneAlt,
  MicrophoneAltSlash,
} from '@vicons/fa'
import { useChatStore } from '@/stores/chat.js'
import { useServerStore } from '@/stores/server.js'
import { storeToRefs } from 'pinia'
import { ref, reactive, computed, useTemplateRef } from 'vue'
import api from '@/axios.js'

import '@/assets/styles/chatroom.css'
import '@/assets/base.css'

const emit = defineEmits(['new-msg-sent', 'close-reply-to', 'sending-msg'])

const props = defineProps({
  replyToMsg: {
    type: Object,
    default: null,
    required: false,
  },
})

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const chatStore = useChatStore()
const { openingRoomId } = storeToRefs(chatStore)

const naiveUIMessage = useMessage()
const message = ref('')
const selectedImages = ref([])
const uploadImageFiles = ref([])
const selectedVideo = ref(null)
const selectedAudio = ref(null)
const audioBtnPressed = ref(false)
const maxAudioDuration = 2 * 60 * 1000 // 2min or 120000 ms
const recording = ref(false)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const stopTimeout = ref(null)
const currentDuration = ref(0)
const durationInterval = ref(null)
const sending = ref(false)
const sendingPercent = ref(0)

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

  const options = { mimeType: 'audio/mp4;codecs=opus', audioBitsPerSecond: 48000 }

  audioChunks.value = []
  mediaRecorder.value = new MediaRecorder(stream, options)

  mediaRecorder.value.ondataavailable = (e) => {
    if (e.data.size > 0) {
      audioChunks.value.push(e.data)
    }
  }

  mediaRecorder.value.onstop = async () => {
    clearTimeout(stopTimeout)
    const blob = new Blob(audioChunks.value, { type: 'audio/mp4' })
    selectedAudio.value = blob
    selectedVideo.value = null
    selectedImages.value.length = 0
    await sendMessage()
    selectedAudio.value = null
  }

  mediaRecorder.value.start()
  recording.value = true
  currentDuration.value = 0

  durationInterval.value = setInterval(() => {
    currentDuration.value += 1000
  }, 1000)

  // Stop after 2 minutes
  stopTimeout.value = setTimeout(() => stopRecording(), maxAudioDuration)
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }

  recording.value = false
  mediaRecorder.value = null
  currentDuration.value = 0

  clearTimeout(stopTimeout.value)
  clearInterval(durationInterval.value)
  stopTimeout.value = null
  durationInterval.value = null
  audioBtnPressed.value = false
}

function onSelectImages(data) {
  const fileList = data.fileList

  // clear internal upload state so user can reselect same file
  uploadImageFiles.value = []

  if (fileList.length + selectedImages.value.length > 25) {
    message.error(`You can only upload up to ${25} images at a time`)
    return false
  }
  const newFiles = fileList
    .filter((fileData) => {
      const isImage = fileData.file.type.startsWith('image/')
      return isImage
    })
    .map((fileData) => {
      const file = fileData.file
      return reactive({
        file,
        url: URL.createObjectURL(file),
      })
    })

  selectedImages.value.push(...newFiles)

  // clear video and audio if images selected
  selectedVideo.value = null
  selectedAudio.value = null
}

function removeImgFromSelectedImages(imgIndex) {
  if (selectedImages.value.length > 0) {
    selectedImages.value.splice(imgIndex, 1)
  }
}

function onSelectVideo(data) {
  if (data.file) {
    let file = data.file

    if (file.file) {
      // clear images and audio if select video
      selectedImages.value.length = 0
      selectedAudio.value = null

      selectedVideo.value = {
        file: file.file,
        url: URL.createObjectURL(file.file),
      }
    }
  }
}

async function sendMessage() {
  if (openingRoomId.value === null) return

  sending.value = true
  emit('sending-msg', true)

  let formData = new FormData()
  formData.append('text', message.value)
  formData.append('server_id', serverData.value.id)
  formData.append('room_id', openingRoomId.value)

  if (props.replyToMsg) {
    formData.append('reply_to_message_id', props.replyToMsg.id)
  }

  if (selectedImages.value.length > 0) {
    for (let i = 0; i < selectedImages.value.length; i++) {
      formData.append(`file_field-${i}`, selectedImages.value[i].file)
    }
    formData.append('message_type', 'image')
  } else if (selectedVideo.value !== null) {
    formData.append('file_field', selectedVideo.value.file)
    formData.append('message_type', 'video')
  } else if (selectedAudio.value !== null) {
    formData.append('file_field', selectedAudio.value)
    formData.append('message_type', 'audio')
  } else {
    formData.append('message_type', 'text')
  }

  try {
    let res = await api.post('/message/send-message', formData, {
      onUploadProgress: (progressEvent) => {
        sendingPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    if (res.status === 200) {
      message.value = ''
      emit('new-msg-sent', res.data['new_msg'])
      emit('close-reply-to')

      selectedVideo.value = null
      selectedImages.value.length = 0
      selectedAudio.value = null
      sendingPercent.value = 0
    }
  } catch (e) {
    naiveUIMessage.error('Something went wrong, please try again!')
  }
  sending.value = false
  emit('sending-msg', false)
}

const canSendMessage = computed(() => {
  if (
    message.value.trim() === '' &&
    !selectedVideo.value &&
    !selectedAudio.value &&
    selectedImages.value.length === 0
  ) {
    return false
  }

  return true
})

const textInputRef = useTemplateRef('textInputRef')

async function onEnterPress(e) {
  // if has shiftkey, simulate new line
  if (e.shiftKey) return

  e.preventDefault()

  if (message.value.trim() === '') return

  // otherwise send mesg
  await sendMessage()

  if (textInputRef.value) {
    textInputRef.value.focus()
  }
}
</script>

<template>
  <div v-if="openingRoomId">
    <div v-if="selectedImages.length > 0" class="mb-2">
      <transition-group
        name="message-fade"
        tag="div"
        style="display: flex; flex-direction: row; width: 100%; overflow-x: auto"
      >
        <div
          v-for="(img, imgIndex) in selectedImages"
          :key="imgIndex"
          style="position: relative; margin-right: 10px"
        >
          <n-image :src="img.url" width="180" height="180" preview-disabled></n-image>
          <n-button
            size="tiny"
            type="error"
            style="position: absolute; z-index: 1; right: 0; top: 0"
            @click="removeImgFromSelectedImages(imgIndex)"
          >
            <template #icon>
              <n-icon><TrashAlt /></n-icon>
            </template>
          </n-button>
        </div>
      </transition-group>
    </div>

    <div v-if="selectedVideo" class="mb-2">
      <div style="display: flex; flex-direction: row; width: 100%">
        <video
          :src="selectedVideo.url"
          controls
          style="max-width: 400px; max-height: 300px"
        ></video>

        <n-button size="tiny" type="error" @click="selectedVideo = null">
          <template #icon>
            <n-icon><TrashAlt /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <div v-if="audioBtnPressed" class="mb-2">
      <div style="display: flex; flex-direction: row; justify-content: space-between">
        <div>
          <n-button :loading="recording" type="primary" @click="startRecording()">
            <template #icon>
              <n-icon><MicrophoneAlt /></n-icon>
            </template>
            <span v-if="recording">Recording {{ formatDuration(currentDuration) }}</span>
          </n-button>
          <n-button type="error" class="ml-2" v-if="recording" @click="stopRecording()">
            <template #icon>
              <n-icon><MicrophoneAltSlash /></n-icon>
            </template>
            <span>Stop recording</span>
          </n-button>
        </div>
      </div>
    </div>

    <div v-if="replyToMsg !== null" class="mb-2">
      <div>
        <n-button size="tiny" round class="mr-2" @click="emit('close-reply-to')">X</n-button>
        <span>
          Replying to <strong>{{ replyToMsg.sender_name }}</strong>
        </span>
      </div>
      <div v-if="replyToMsg.text.trim() === ''" class="mt-2">Attachments</div>
      <div v-else class="mt-2 text-truncate">{{ replyToMsg.text }}</div>
    </div>

    <n-input
      ref="textInputRef"
      type="textarea"
      placeholder="Type a message"
      v-model:value="message"
      :autosize="{ minRows: 1, maxRows: 8 }"
      :disabled="sending || audioBtnPressed"
      @keydown.enter="onEnterPress"
    />
    <div class="mt-2 input-area-bottom-container">
      <div style="display: flex; flex-direction: row">
        <n-upload
          :file-list="uploadImageFiles"
          :default-upload="false"
          :show-preview-button="false"
          :show-file-list="false"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
          @change="onSelectImages"
          :disabled="sending || audioBtnPressed || selectedVideo !== null"
        >
          <n-button size="small" round>
            <template #icon>
              <n-icon><ImageRegular /></n-icon>
            </template>
          </n-button>
        </n-upload>

        <n-upload
          :default-upload="false"
          :show-preview-button="false"
          :show-file-list="false"
          @change="onSelectVideo"
          :disabled="sending || audioBtnPressed || selectedImages.length > 0"
          accept="
        video/mp4,video/x-matroska,video/x-m4v,video/webm,
        video/x-msvideo,video/quicktime,video/mpeg
      "
        >
          <n-button size="small" round class="ml-1">
            <template #icon>
              <n-icon><FileVideoRegular /></n-icon>
            </template>
          </n-button>
        </n-upload>

        <n-button
          size="small"
          round
          class="ml-1"
          @click="audioBtnPressed = !audioBtnPressed"
          :disabled="sending || recording || selectedImages.length > 0 || selectedVideo !== null"
        >
          <template #icon>
            <n-icon><Microphone /></n-icon>
          </template>
        </n-button>
      </div>
      <n-button
        size="small"
        round
        :loading="sending"
        :disabled="sending || audioBtnPressed || !canSendMessage"
        @click="sendMessage()"
      >
        <template #icon>
          <n-icon><ArrowUp /></n-icon>
        </template>
        <span
          v-if="
            (selectedImages.length > 0 || selectedVideo !== null || selectedAudio !== null) &&
            sending
          "
        >
          {{ sendingPercent }}%
        </span>
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}
.message-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.message-fade-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.message-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.message-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
