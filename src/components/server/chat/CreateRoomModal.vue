<script setup>
import { NModal, NCard, NInput, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import api from '@/axios.js'

const { t } = useI18n()
const message = useMessage()

const emit = defineEmits(['close-create-room-modal', 'create-room-success'])
const props = defineProps({
  showModal: {
    type: Boolean,
    required: true,
  },
  serverId: {
    type: String,
    required: true,
  },
})

const roomName = ref('')
const creating = ref(false)

async function createRoom() {
  creating.value = true

  try {
    let res = await api.post('/rooms/create-chat-room', {
      name: roomName.value,
      server_id: props.serverId,
    })

    if (res.status === 200) {
      emit('create-room-success', res.data)
      roomName.value = ''
    }
  } catch (_) {
    message.error('Something went wrong, please try again.')
  }
  creating.value = false
}

function closeModal() {
  emit('close-create-room-modal')
}
</script>

<template>
  <n-modal :show="showModal" :mask-closable="false" :auto-focus="false">
    <n-card style="width: 350px" :auto-focus="false" title="Create room">
      <n-input
        placeholder="Enter room name"
        v-model:value="roomName"
        maxlength="25"
        show-count
      ></n-input>

      <div style="text-align: right; margin-top: 30px; margin-bottom: 10px">
        <n-button size="small" class="mr-3" @click="closeModal()">{{ t('close') }}</n-button>

        <n-button
          type="primary"
          size="small"
          :disabled="creating"
          :loading="creating"
          @click="createRoom()"
        >
          {{ t('create') }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
