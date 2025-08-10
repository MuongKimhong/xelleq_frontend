<script setup>
import { NModal, NButton, NCard, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStorageStore } from '@/stores/storage.js'
import { useI18n } from 'vue-i18n'
import api from '@/axios.js'

const { t } = useI18n()
const message = useMessage()
const storageStore = useStorageStore()
const { fileUploads, storageData, totalFiles, showDeleteModal, pressedFileIndex } =
  storeToRefs(storageStore)

function closeModal() {
  pressedFileIndex.value = null
  showDeleteModal.value = false
}

const deleting = ref(false)
async function deleteFile() {
  if (pressedFileIndex.value === null) return

  deleting.value = true
  let file = fileUploads.value[pressedFileIndex.value]

  try {
    let res = await api.delete('/servers/delete-file-upload', {
      data: {
        upload_id: file.id,
      },
    })

    if (res.status === 200) {
      totalFiles.value -= 1
      fileUploads.value.splice(pressedFileIndex.value, 1)
      storageData.value.storage_used = res.data['storage_used']
      storageData.value.storage_used_percent = res.data['storage_used_percent']
      pressedFileIndex.value = null
    }
  } catch (_) {
    message.error(t('somethingWentWrong'))
  }
  deleting.value = false
  showDeleteModal.value = false
}
</script>

<template>
  <n-modal v-model:show="showDeleteModal" :mask-closable="false" :auto-focus="false">
    <n-card style="width: 350px" :auto-focus="false">
      <h3>{{ t('areYouSureDelete') }}</h3>

      <div style="text-align: right; margin-top: 30px; margin-bottom: 10px">
        <n-button size="small" class="mr-3" @click="closeModal()">{{ t('cancel') }}</n-button>

        <n-button
          type="error"
          size="small"
          :disabled="deleting"
          :loading="deleting"
          @click="deleteFile()"
        >
          {{ t('delete') }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
