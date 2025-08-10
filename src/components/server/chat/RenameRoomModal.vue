<script setup>
import { NModal, NCard, NInput, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import api from '@/axios.js'

const { t } = useI18n()
const message = useMessage()

const emit = defineEmits(['close-rename-room-modal', 'rename-room-success'])
const props = defineProps({
  showModal: {
    type: Boolean,
    required: true,
  },
  serverId: {
    type: String,
    required: true,
  },
  roomId: {
    type: Number,
    default: null,
    required: false,
  },
})

const roomName = ref('')
const renaming = ref(false)

async function rename() {
  if (!props.roomId) return

  renaming.value = true

  try {
    let res = await api.put('/rooms/rename-chat-room', {
      new_name: roomName.value,
      server_id: props.serverId,
      room_id: props.roomId,
    })

    if (res.status === 200) {
      emit('rename-room-success', roomName.value)
      roomName.value = ''
    }
  } catch (_) {
    message.error('Something went wrong, please try again.')
  }
  renaming.value = false
}

function closeModal() {
  emit('close-rename-room-modal')
}
</script>

<template>
  <n-modal :show="showModal" :mask-closable="false" :auto-focus="false">
    <n-card style="width: 350px" :auto-focus="false" title="Rename room">
      <n-input
        placeholder="Enter new name"
        v-model:value="roomName"
        maxlength="25"
        show-count
      ></n-input>

      <div style="text-align: right; margin-top: 30px; margin-bottom: 10px">
        <n-button size="small" class="mr-3" @click="closeModal()">{{ t('close') }}</n-button>

        <n-button
          type="primary"
          size="small"
          :disabled="renaming"
          :loading="renaming"
          @click="rename()"
        >
          {{ t('rename') }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
