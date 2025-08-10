<script setup>
import { NModal, NButton, NInput, NCard, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useStorageStore } from '@/stores/storage.js'
import api from '@/axios.js'

const { t } = useI18n()
const message = useMessage()
const storageStore = useStorageStore()
const {
  fileUploads,
  showUpdateNameModal,
  pressedFileIndex,
  pressedFileName,
  pressedFileExtension,
} = storeToRefs(storageStore)

function closeModal() {
  pressedFileIndex.value = null
  pressedFileName.value = ''
  showUpdateNameModal.value = false
}

const renaming = ref(false)

async function updateName() {
  if (pressedFileIndex.value == null) return

  renaming.value = true
  let file = fileUploads.value[pressedFileIndex.value]

  try {
    let res = await api.put('/servers/update-file-upload-name', {
      upload_id: file.id,
      new_name: `${pressedFileName.value}.${pressedFileExtension.value}`,
    })

    if (res.status === 200) {
      fileUploads.value[pressedFileIndex.value].file_name = res.data
    }
  } catch (_) {
    message.error(t('somethingWentWrong'))
  }
  renaming.value = false
  closeModal()
}
</script>

<template>
  <n-modal v-model:show="showUpdateNameModal" :mask-closable="false" :auto-focus="false">
    <n-card style="width: 350px" :auto-focus="false" :title="t('rename')">
      <n-input placeholder="Enter name" v-model:value="pressedFileName"></n-input>

      <div style="text-align: right; margin-top: 30px; margin-bottom: 10px">
        <n-button size="small" class="mr-3" @click="closeModal()">{{ t('close') }}</n-button>

        <n-button
          type="primary"
          size="small"
          :disabled="renaming"
          :loading="renaming"
          @click="updateName()"
        >
          {{ t('rename') }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
