<script setup>
defineOptions({
  name: 'ChatsTab',
})
import { useServerStore } from '@/stores/server.js'
import { useUserStore } from '@/stores/user.js'
import { useChatStore } from '@/stores/chat.js'
import { useChatWS } from '@/stores/websocket/chatroom.js'
import { useBreakpoint } from '@/breakpoint.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onBeforeUnmount } from 'vue'

import MessageList from './MessageList.vue'
import RoomList from './RoomList.vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import '@/assets/styles/server.css'
import '@/assets/base.css'

const { isBreakPointLgAndUp, isBreakPointMdAndDown } = useBreakpoint()
const { t } = useI18n()

const props = defineProps({
  activeTab: {
    type: String,
    required: true,
  },
})

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const chatWSStore = useChatWS()
const { chatWS } = storeToRefs(chatWSStore)

const chatStore = useChatStore()
const { openingRoomId, openingRoomName, openingRoom, rooms, messages } = storeToRefs(chatStore)

const showMessageListOnSmallScreen = ref(false)

onMounted(() => {
  if (serverData.value.isMember) {
    if (chatWS.value === null && user.value.authenticated) {
      chatWSStore.connect()

      chatWS.value.onmessage = (e) => {
        let data = JSON.parse(e.data)
        chatWSStore.handleMessageType(data)
      }
    }
  }
})

onBeforeUnmount(() => {
  openingRoomId.value = null
  openingRoomName.value = null
  openingRoom.value = null
  rooms.value.length = 0
  messages.value.length = 0
})

function onGoBackRoomList() {
  showMessageListOnSmallScreen.value = false
  openingRoomId.value = null
  openingRoomName.value = null
  openingRoom.value = null
  messages.value.length = 0
}
</script>

<template>
  <div
    v-if="serverData.isMember"
    style="height: calc(100vh - 125px); overflow-y: hidden; min-height: 0"
  >
    <div
      :class="{
        'chats-tab-wrapper-lg-and-up': isBreakPointLgAndUp,
        'chats-tab-wrapper-md-and-down': isBreakPointMdAndDown,
      }"
    >
      <RoomList
        v-show="isBreakPointLgAndUp || (!showMessageListOnSmallScreen && isBreakPointMdAndDown)"
        @romm-press-md-and-down="showMessageListOnSmallScreen = true"
      />
      <MessageList
        v-show="isBreakPointLgAndUp || (showMessageListOnSmallScreen && isBreakPointMdAndDown)"
        :active-tab="activeTab"
        @go-back-to-room-list="onGoBackRoomList"
      />
    </div>
  </div>
</template>

<style scoped>
.chats-tab-wrapper-lg-and-up {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.chats-tab-wrapper-md-and-down {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
