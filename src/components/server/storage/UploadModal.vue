<script setup>
import {
  NModal,
  NButton,
  NUpload,
  NCard,
  NIcon,
  NText,
  NSpin,
  NUploadDragger,
  NTag,
  useMessage,
} from 'naive-ui'
import { ArchiveOutline, CheckmarkDoneSharp } from '@vicons/ionicons5'
import { useStorageStore } from '@/stores/storage.js'
import { useServerStore } from '@/stores/server.js'
import { storeToRefs } from 'pinia'
import { ref, reactive } from 'vue'
import api from '@/axios.js'
import { useI18n } from 'vue-i18n'
import '@/assets/styles/server.css'
import '@/assets/base.css'

const { t } = useI18n()
const message = useMessage()
const serverStore = useServerStore()
const storageStore = useStorageStore()

const { serverData } = storeToRefs(serverStore)
const { selectedFiles, storageData, fileUploads, totalFiles, showUploadModal } =
  storeToRefs(storageStore)

function onSelectImage(data) {
  const fileList = data.fileList

  if (fileList.length > 10) {
    message.error(t('uploadFileLimit'))
    return false
  }
  selectedFiles.value = fileList.map((fileData) =>
    reactive({
      name: fileData.file.name,
      uploading: false,
      file: fileData.file,
      percent: 0,
      success: false,
      fail: false,
    }),
  )
}

const uploadingBatch = ref(false)
const showFileList = ref(true)
const showErrText = ref(false)
const errText = ref('')

async function uploadFile(selectedFile) {
  selectedFile.percent = 0
  selectedFile.success = false
  selectedFile.fail = false
  selectedFile.uploading = true

  let formData = new FormData()
  formData.append('server_id', serverData.value.id)
  formData.append('file', selectedFile.file)
  formData.append('file_name', selectedFile.name)

  try {
    let res = await api.post('/servers/upload-file-to-server-chunk', formData, {
      onUploadProgress: (progressEvent) => {
        selectedFile.percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    if (res.status === 200) {
      selectedFile.success = true
      fileUploads.value.unshift(res.data['uploaded'])
      totalFiles.value += 1
      storageData.value['storage_quota'] = res.data['storage_quota']
      storageData.value['storage_used'] = res.data['storage_used']
      storageData.value['storage_used_percent'] = res.data['storage_used_percent']
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'File storage is full':
        errText.value = t('storageFull')
        break
      case 'Unsupport media type':
        errText.value = t('unsupportFileType')
        break
      default:
        errText.value = t('somethingWentWrong')
        break
    }
    showErrText.value = true
    selectedFile.fail = true
  }
  selectedFile.uploading = false
}

async function uploadBatch() {
  showFileList.value = false
  showErrText.value = false
  uploadingBatch.value = true

  for (let i = 0; i < selectedFiles.value.length; i++) {
    if (!showErrText.value) {
      try {
        await uploadFile(selectedFiles.value[i])
      } catch (_) {
        continue
      }
    }
  }

  if (!showErrText.value) {
    message.success(t('filesUploaded'))
    setTimeout(() => closeModal(), 500)
  }
}

function selectAgain() {
  selectedFiles.value.length = 0
  uploadingBatch.value = false
  showErrText.value = false
  showFileList.value = true
}

function closeModal() {
  selectAgain()
  showUploadModal.value = false
}
</script>

<template>
  <n-modal v-model:show="showUploadModal" :mask-closable="false" :auto-focus="false">
    <n-card style="max-width: 500px" title="Upload" :bordered="false">
      <div v-if="uploadingBatch">
        <div v-if="showErrText" style="text-align: center" class="mb-4">
          <n-tag type="error">{{ errText }}</n-tag>
        </div>
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          style="display: flex; align-items: center"
        >
          <n-spin v-if="file.uploading" :size="15" class="mr-2"></n-spin>
          <n-icon v-if="file.success" class="mr-2">
            <CheckmarkDoneSharp></CheckmarkDoneSharp>
          </n-icon>
          <span :class="{ green: file.success, red: file.fail }">
            {{ file.percent }}% {{ file.name }}
          </span>
        </div>

        <div class="mt-4" style="text-align: right">
          <n-button :disabled="uploadingBatch && !showErrText" @click="closeModal()" class="mr-2">
            {{ t('close') }}
          </n-button>
          <n-button v-if="showErrText" @click="selectAgain()"> {{ t('selectAgain') }} </n-button>
        </div>
      </div>
      <div v-else>
        <n-upload
          multiple
          :max="10"
          :show-file-list="showFileList"
          :default-upload="false"
          @change="onSelectImage"
          accept="
                image/jpeg,image/png,image/gif,image/webp,image/avif,image/x-icon,image/vnd.adobe.photoshop,image/bmp,
                video/mp4,video/x-matroska,video/x-m4v,video/webm,video/x-msvideo,video/quicktime,video/mpeg,
                audio/mpeg,audio/midi,audio/mp4,audio/ogg,audio/wav,
                application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,
                application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.presentation,
                application/font-woff,application/font-sfnt,application/pdf,text/csv,
                text/plain,text/markdown,text/x-python,text/rust,text/javascript,text/typescript,
                text/x-java-source,text/x-c,text/x-c++,text/html,text/css,application/json,text/x-go,
                application/x-php,text/x-ruby,application/x-sh,text/x-swift,text/x-kotlin,text/x-scala,text/x-lua,
                text/x-dart,application/sql,application/x-yaml
              "
        >
          <n-upload-dragger>
            <div style="margin-bottom: 12px">
              <n-icon size="40" :depth="3">
                <ArchiveOutline />
              </n-icon>
            </div>
            <n-text style="font-size: 16px"> {{ t('clickToUpload') }} </n-text>
            <div class="mt-4">
              <span style="margin: 8px 0 0 0"> {{ t('uploadFileLimit') }} </span>
            </div>
          </n-upload-dragger>
        </n-upload>
        <div class="mt-3" style="text-align: right">
          <n-button class="mr-3" @click="closeModal()">{{ t('close') }}</n-button>
          <n-button type="primary" :disabled="selectedFiles.length <= 0" @click="uploadBatch()">
            {{ t('uploadNow') }}
          </n-button>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<style scoped>
.red {
  color: red;
}
.green {
  color: lightgreen;
}
</style>
