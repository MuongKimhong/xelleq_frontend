<script setup>
import { NModal, NCard, NInput, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import api from '@/axios.js'

const { t } = useI18n()
const message = useMessage()

const emit = defineEmits(['close-update-msg-modal', 'update-msg-success'])
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
  message: {
    type: Object,
    default: null,
    required: false,
  },
})

const newMsg = ref('')
const updating = ref(false)

watch(
  () => props.message,
  (msg) => {
    newMsg.value = msg?.text ?? ''
  },
)

async function updateMsg() {
  if (!props.roomId || !props.message) return

  updating.value = true

  try {
    let res = await api.put('/message/update-message', {
      new_text: newMsg.value,
      server_id: props.serverId,
      room_id: props.roomId,
      message_id: props.message.id,
    })

    if (res.status === 200) {
      emit('update-msg-success', res.data['new_text'])
      newMsg.value = ''
    }
  } catch (_) {
    message.error('Something went wrong, please try again.')
  }
  updating.value = false
}

function closeModal() {
  emit('close-update-msg-modal')
}
</script>

<template>
  <n-modal :show="showModal" :mask-closable="false" :auto-focus="false">
    <n-card style="width: 350px" :auto-focus="false">
      <n-input
        type="textarea"
        placeholder="Message"
        v-model:value="newMsg"
        :autosize="{ minRows: 2, maxRows: 8 }"
      ></n-input>

      <div style="text-align: right; margin-top: 10px; margin-bottom: 10px">
        <n-button size="small" class="mr-3" @click="closeModal()">{{ t('close') }}</n-button>

        <n-button
          type="primary"
          size="small"
          :disabled="updating"
          :loading="updating"
          @click="updateMsg()"
        >
          {{ t('save') }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
