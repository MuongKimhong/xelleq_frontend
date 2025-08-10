<script setup>
import { NModal, NCard, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import api from '@/axios.js'

const { t } = useI18n()
const message = useMessage()

const emit = defineEmits(['close-delete-room-modal', 'delete-room-success'])
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

const deleting = ref(false)

async function deleteRoom() {
  if (!props.roomId) return

  deleting.value = true

  try {
    let res = await api.delete('/rooms/delete-chat-room', {
      data: {
        server_id: props.serverId,
        room_id: props.roomId,
      },
    })

    if (res.status === 200) {
      emit('delete-room-success')
    }
  } catch (_) {
    message.error('Something went wrong, please try again.')
  }
  deleting.value = false
}

function closeModal() {
  emit('close-delete-room-modal')
}
</script>

<template>
  <n-modal :show="showModal" :mask-closable="false" :auto-focus="false">
    <n-card style="width: 350px" :auto-focus="false" title="Are you sure you want to delete?">
      <div style="text-align: right; margin-top: 20px; margin-bottom: 10px">
        <n-button size="small" class="mr-3" @click="closeModal()">{{ t('close') }}</n-button>

        <n-button
          type="error"
          size="small"
          :disabled="deleting"
          :loading="deleting"
          @click="deleteRoom()"
        >
          {{ t('delete') }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
