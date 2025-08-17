<script setup>
import {
  NButton,
  NSpin,
  NTag,
  NInput,
  NIcon,
  NImage,
  NProgress,
  NGrid,
  NGridItem,
  NPopover,
  useMessage,
} from 'naive-ui'
import { DotsVertical } from '@vicons/tabler'
import debounce from 'lodash/debounce'
import { ref, useTemplateRef, computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user.js'
import { useStorageStore } from '@/stores/storage.js'
import { useServerStore } from '@/stores/server.js'
import { isImage, isVideo, isAudio, isPdf, isDoc } from '@/utils.js'
import api from '@/axios.js'

import UploadModal from './UploadModal.vue'
import DeleteModal from './DeleteModal.vue'
import UpdateNameModal from './UpdateNameModal.vue'

import '@/assets/styles/server.css'
import '@/assets/base.css'

const { t } = useI18n()
const message = useMessage()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const serverStore = useServerStore()
const storageStore = useStorageStore()
const { serverData } = storeToRefs(serverStore)
const {
  storageData,
  fileUploads,
  totalFiles,
  showUploadModal,
  showDeleteModal,
  showUpdateNameModal,
  pressedFileIndex,
  pressedFileName,
  pressedFileExtension,
} = storeToRefs(storageStore)

const storageBarColor = computed(() => {
  if (storageData.value) {
    let percent = storageData.value.storage_used_percent

    if (percent > 60 && percent < 85) {
      return 'warning'
    } else if (percent >= 85) {
      return 'error'
    }
  }
  return 'info'
})

const canUpload = computed(() => {
  let s = serverData.value

  if (s.public && !s.restrict) {
    if (s.isAdmin || s.isModerator) {
      return true
    }
  } else if (s.public && s.restrict) {
    if (s.canPostInRestrict) {
      return true
    }
  } else if (!s.public) {
    return true
  }
  return false
})

const loading = ref(false)
const loadFileErr = ref(false)
const copiedFileUploads = ref([])
const currentPage = ref(0)
const totalPages = ref(0)
const copiedTotalFiles = ref(0)
async function getStorageData(onlyFilesFlag) {
  if (loading.value) return

  loading.value = true
  try {
    let res = await api.get('/servers/get-storage-data', {
      params: {
        server_id: serverData.value.id,
        only_files: onlyFilesFlag,
        page: currentPage.value,
      },
    })

    if (res.status === 200) {
      if (!onlyFilesFlag) {
        storageData.value = res.data['storage']
      }
      totalFiles.value = res.data['total_files']
      copiedTotalFiles.value = res.data['total_files']
      totalPages.value = res.data['total_pages']
      fileUploads.value.push(...res.data['file_uploads'])
      copiedFileUploads.value.push(...res.data['file_uploads'])
      currentPage.value += 1
    }
  } catch (_) {
    if (!onlyFilesFlag) loadFileErr.value = true
  }
  loading.value = false
}

const searchText = ref('')
const searching = ref(false)

async function handleSearch() {
  searching.value = true

  if (searchText.value.trim() === '') {
    fileUploads.value = copiedFileUploads.value
    totalFiles.value = copiedTotalFiles.value
    searching.value = false
    return
  }

  try {
    let res = await api.get('/servers/search-file', {
      params: {
        server_id: serverData.value.id,
        text: searchText.value,
      },
    })

    if (res.status === 200) {
      totalFiles.value = res.data['total_files']
      fileUploads.value = res.data['results']
    }
  } catch (_) {}

  searching.value = false
}
const debouncedSearch = debounce(handleSearch, 350)

function onRenameBtnPress(fileIndex, fileName) {
  pressedFileIndex.value = fileIndex

  let fileSplit = fileName.split('.')
  pressedFileName.value = fileSplit[0]
  pressedFileExtension.value = fileSplit[fileSplit.length - 1]
  showUpdateNameModal.value = true
}

function onDeleteBtnPress(fileIndex) {
  pressedFileIndex.value = fileIndex
  showDeleteModal.value = true
}

const storageTabContainer = useTemplateRef('storageTabContainer')

function handleGetFileUploadsOnScroll() {
  const container = storageTabContainer.value
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 100

  if (scrollPosition >= threshold) {
    if (currentPage.value >= totalPages.value || loading.value) return
    getStorageData(true)
  }
}

onMounted(async () => {
  fileUploads.value.length = 0
  copiedFileUploads.value.length = 0
  await getStorageData(false)

  if (storageTabContainer.value) {
    storageTabContainer.value.addEventListener('scroll', handleGetFileUploadsOnScroll)
  }
})

onBeforeUnmount(() => {
  fileUploads.value.length = 0
  copiedFileUploads.value.length = 0

  if (storageTabContainer.value) {
    storageTabContainer.value.removeEventListener('scroll', handleGetFileUploadsOnScroll)
  }
})
</script>

<template>
  <div
    v-if="serverData.isMember"
    class="mt-2 tab-content storage-tab-container"
    ref="storageTabContainer"
  >
    <div v-if="loadFileErr" style="text-align: center">
      <n-tag type="error">{{ t('loadFileFail') }}</n-tag>
    </div>

    <div v-if="storageData">
      <div class="mt-4">
        <div style="text-align: center">
          <span>{{ storageData.storage_used }} mb / {{ storageData.storage_quota }} mb</span>
        </div>
        <n-progress
          class="mt-1"
          type="line"
          :status="storageBarColor"
          :percentage="storageData.storage_used_percent"
          :show-indicator="false"
        />
      </div>
      <div class="title-wrapper mt-4">
        <span style="font-size: 22px; padding: 2px 0px; justify-content: center; display: flex">
          {{ t('totalFiles') }}: {{ totalFiles }}
          <n-spin v-show="searching" :size="20" class="ml-2"></n-spin>
        </span>

        <UploadModal />
        <div v-if="canUpload" style="text-align: right">
          <n-button type="primary" @click="showUploadModal = true">
            {{ t('uploadFile') }}
          </n-button>
        </div>
      </div>

      <div v-show="totalFiles > 0" class="mt-4">
        <n-input
          :placeholder="t('search')"
          v-model:value="searchText"
          @input="debouncedSearch"
        ></n-input>
      </div>

      <DeleteModal />
      <UpdateNameModal />

      <n-grid class="mt-4" cols="2 400:3 600:4 900:6 1200:8" x-gap="50" y-gap="10">
        <n-grid-item v-for="(file, index) in fileUploads" :key="file.id">
          <div class="file-wrapper">
            <a :href="file.url" target="_blank" rel="noopener noreferrer">
              <n-image
                v-if="isImage(file.extension)"
                :src="file.url"
                width="100%"
                lazy
                preview-disabled
              ></n-image>
              <n-image
                v-else-if="isVideo(file.extension)"
                src="/video_icon.png"
                width="100%"
                preview-disabled
              ></n-image>
              <n-image
                v-else-if="isAudio(file.extension)"
                src="/audio_icon.png"
                width="100%"
                preview-disabled
              ></n-image>
              <n-image
                v-else-if="isPdf(file.extension)"
                src="/pdf_icon.png"
                width="100%"
                preview-disabled
              ></n-image>
              <n-image
                v-else-if="isDoc(file.extension)"
                src="/docx_icon.png"
                width="100%"
                preview-disabled
              ></n-image>
              <n-image v-else src="/file-icon.png" width="100%" preview-disabled></n-image>
            </a>

            <div class="file-header">
              <span class="file-name">{{ file.file_name }}</span>

              <n-popover
                v-if="file.upload_by_user_id === user.id"
                trigger="click"
                placement="bottom"
                :show-arrow="false"
              >
                <template #trigger>
                  <n-button size="tiny" style="margin-top: 8px" round>
                    <n-icon :size="10"><DotsVertical /></n-icon>
                  </n-button>
                </template>
                <div style="width: 100px; padding: 0px">
                  <div class="file-popover-list" @click="onRenameBtnPress(index, file.file_name)">
                    {{ t('rename') }}
                  </div>
                  <div class="file-popover-list" @click="onDeleteBtnPress(index)">
                    {{ t('delete') }}
                  </div>
                </div>
              </n-popover>
            </div>
          </div>
        </n-grid-item>
      </n-grid>

      <div v-if="loading" style="text-align: center; height: 150px">
        <n-spin :size="55" class="mt-4"></n-spin>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.file-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.file-wrapper:hover {
  background-color: rgba(32, 128, 240, 0.15);
  border-radius: 4px;
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-size: 14px;
  margin-top: 8px;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 6px;
}
.file-popover-list {
  text-align: center;
  padding-top: 5px;
  padding-bottom: 5px;
  width: 100%;
  cursor: pointer;
}
.file-popover-list:hover {
  background-color: rgba(32, 128, 240, 0.15);
}
</style>
