<script setup>
import '@/assets/styles/chatroom.css'
import '@/assets/base.css'

const emit = defineEmits(['scroll-to-message'])

const props = defineProps({
  replyToMsg: {
    type: Object,
    default: null,
    required: false,
  },
})
</script>

<template>
  <div
    v-if="replyToMsg"
    class="message-reply-to-wrapper mb-1"
    @click="emit('scroll-to-message', replyToMsg.id)"
  >
    <div class="pl-1">
      <span>
        Replied to
        <strong>{{ replyToMsg.sender_name }}</strong>
      </span>
    </div>
    <div v-if="replyToMsg.text.trim() === ''" class="mt-1 pl-1">Attachments</div>
    <div v-else class="mt-1 pl-1 text-truncate">
      {{ replyToMsg.text }}
    </div>
  </div>
</template>
