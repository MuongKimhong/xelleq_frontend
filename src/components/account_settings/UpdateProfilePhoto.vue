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
import { useUserStore } from '../../stores/user.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '../../axios.js'

import defaultUserProfile from '../../assets/default_user_profile.png'
import '../../assets/styles/loginRegister.css'
import '../../assets/base.css'

const { t } = useI18n()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

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

  try {
    let res = await api.put('/users/update-profile-picture', formData)

    if (res.status === 200) {
      isSubmitting.value = false

      if (res.data) {
        user.value.profileUrl = res.data
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

async function removeProfilePicture() {
  isSubmitting.value = true

  try {
    let res = await api.delete('/users/remove-profile-picture')

    if (res.status === 200) {
      isSubmitting.value = false
      showRemovePhotoConfirm.value = false
      user.value.profileUrl = null
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
        v-if="user.profileUrl === null"
        :src="defaultUserProfile"
        width="100"
        height="100"
        :lazy="true"
      ></n-image>
      <n-image
        v-else
        :src="user.profileUrl"
        width="120"
        height="120"
        :lazy="true"
        class="profile-img"
      ></n-image>
    </div>

    <div style="text-align: center" class="mt-2">
      <n-popover placement="bottom" trigger="click" :show-arrow="false">
        <template #trigger>
          <n-button tertiary size="small" type="primary">{{ t('edit') }}</n-button>
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

          <div v-if="user.profileUrl !== null" style="text-align: center" class="mt-2">
            <n-popconfirm
              placement="bottom"
              v-model:show="showRemovePhotoConfirm"
              style="width: 250px"
              class="py-4"
            >
              <template #trigger>
                <n-button size="small" tertiary type="error" style="width: 100%">{{
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
                  @click="removeProfilePicture()"
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
              size="small"
              class="mr-3"
              @click="upload()"
              :disabled="isSubmitting"
              :loading="isSubmitting"
            >
              {{ t('upload') }}
            </n-button>
            <n-button @click="cancelUpload()" size="small" :disabled="isSubmitting">{{
              t('cancel')
            }}</n-button>
          </div>
        </n-card>
      </n-modal>
    </div>
  </div>
</template>
