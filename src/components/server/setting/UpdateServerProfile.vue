<script setup>
import {
  NImage,
  NModal,
  NCard,
  NPopconfirm,
  NUpload,
  NButton,
  NPopover,
  useMessage,
} from 'naive-ui'
import { useServerStore } from '../../../stores/server.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '../../../axios.js'

import defaultUserProfile from '../../../assets/default_user_profile.png'

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)
const { t } = useI18n()

const message = useMessage()
const router = useRouter()

const isSubmitting = ref(false)
const errText = ref('')
const showRemovePhotoConfirm = ref(false)

// file upload
const selectedFile = ref(null)
const selectedFileUrl = ref('')
const showPreviewImageConfirm = ref(false)

function onSelectImage(data) {
  showPreviewImageConfirm.value = false

  if (data.file) {
    let file = data.file

    if (file.file) {
      selectedFile.value = file.file
      selectedFileUrl.value = URL.createObjectURL(file.file)

      if (selectedFileUrl.value !== '') {
        showPreviewImageConfirm.value = true
      }
    }
  }
}

function cancelUpload() {
  selectedFileUrl.value = ''
  showPreviewImageConfirm.value = false
}

async function upload() {
  isSubmitting.value = true

  if (selectedFile.value === null) {
    isSubmitting.value = false
    message.error(t('failUploadPhoto'), { duration: 4000 })
    return
  }

  let formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('server_id', serverData.value.id)

  try {
    let res = await api.put('/servers/update-server-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (res.status === 200) {
      isSubmitting.value = false

      if (res.data) {
        serverData.value.profileUrl = res.data
        serverStore.updateJoinedServerProfile(serverData.value.id, res.data)
        showPreviewImageConfirm.value = false
        return
      }
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'File size exceeds limit':
        errText.value = t('fileSizeExceedsLimit')
        break

      case 'Unsupport media type':
        errText.value = t('unsupportImageType')
        break
    }

    message.error(errText.value)
    isSubmitting.value = false
    showPreviewImageConfirm.value = false
    return
  }
}

async function removeServerProfile() {
  isSubmitting.value = true

  try {
    let res = await api.delete('/servers/remove-server-profile', {
      data: {
        server_id: serverData.value.id,
      },
    })

    if (res.status === 200) {
      isSubmitting.value = false
      showRemovePhotoConfirm.value = false
      serverData.value.profileUrl = null
      serverStore.updateJoinedServerProfile(serverData.value.id, null)
      return
    }
  } catch (_) {
    isSubmitting.value = false
    showRemovePhotoConfirm.value = false
    return
  }
}
</script>

<template>
  <div>
    <div style="text-align: center">
      <n-image
        v-if="serverData.profileUrl !== null"
        :src="serverData.profileUrl"
        width="100"
        height="100"
        class="profile-img"
      ></n-image>
      <n-image v-else :src="defaultUserProfile" width="80" height="80"></n-image>
    </div>
    <div style="text-align: center" class="mt-2">
      <n-popover placement="bottom" trigger="click" :show-arrow="false">
        <template #trigger>
          <n-button tertiary type="primary">{{ t('edit') }}</n-button>
        </template>

        <div>
          <div style="text-align: center">
            <n-upload
              :default-upload="false"
              :show-preview-button="false"
              :show-file-list="false"
              accept="image/png, image/jpeg, image/webp, image/avif, image/gif"
              @change="onSelectImage"
            >
              <n-button tertiary type="success">{{ t('uploadNewPhoto') }}</n-button>
            </n-upload>
          </div>

          <div v-if="serverData.profileUrl !== null" style="text-align: center" class="mt-2">
            <n-popconfirm
              placement="bottom"
              v-model:show="showRemovePhotoConfirm"
              style="width: 250px"
              class="py-4"
            >
              <template #trigger>
                <n-button tertiary type="error" style="width: 100%">{{
                  t('removePhoto')
                }}</n-button>
              </template>
              {{ t('removePhotoConfirm') }}
              <template #action>
                <n-button size="small" @click="showRemovePhotoConfirm = false">
                  {{ t('cancel') }}
                </n-button>
                <n-button
                  size="small"
                  type="error"
                  @click="removeServerProfile()"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  {{ t('remove') }}
                </n-button>
              </template>
            </n-popconfirm>
          </div>
        </div>
      </n-popover>

      <!-- confirm image modal, need to be outside popover -->
      <n-modal v-model:show="showPreviewImageConfirm" :close-on-esc="false" :mask-closable="false">
        <n-card style="width: 300px">
          <div style="text-align: center">
            <n-image :src="selectedFileUrl" width="200"></n-image>
          </div>

          <div style="text-align: center" class="mt-4">
            <n-button
              type="success"
              class="mr-3"
              @click="upload()"
              :disabled="isSubmitting"
              :loading="isSubmitting"
            >
              {{ t('upload') }}
            </n-button>
            <n-button @click="cancelUpload()" :disabled="isSubmitting">{{ t('cancel') }}</n-button>
          </div>
        </n-card>
      </n-modal>
    </div>
  </div>
</template>
