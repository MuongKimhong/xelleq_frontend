<script setup>
import { NSpin, NTag, NPopover, NButton, NIcon, NImage } from 'naive-ui'
import { UserCircleRegular, PhoneAlt } from '@vicons/fa'
import { CheckmarkDone } from '@vicons/ionicons5'
import { IosArrowDown } from '@vicons/ionicons4'
import { ArrowBackIosRound } from '@vicons/material'
import {
  ref,
  computed,
  watch,
  useTemplateRef,
  defineAsyncComponent,
  onBeforeUnmount,
  nextTick,
} from 'vue'
import { useChatStore, useVoiceCallStore } from '@/stores/chat.js'
import { useServerStore } from '@/stores/server.js'
import { useBreakpoint } from '@/breakpoint.js'
import { useUserStore } from '@/stores/user.js'
import { useUserWS } from '@/stores/websocket/user.js'
import { storeToRefs } from 'pinia'
import api from '@/axios.js'

const DeleteMessageModal = defineAsyncComponent(() => import('./DeleteMessageModal.vue'))
const UpdateMessageModal = defineAsyncComponent(() => import('./UpdateMessageModal.vue'))
import ReplyToMessageWrapper from './ReplyToMessageWrapper.vue'
import MessageInput from './MessageInput.vue'
import MessageFileList from './MessageFileList.vue'
import '@/assets/styles/chatroom.css'
import '@/assets/base.css'

const props = defineProps({
  activeTab: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['go-back-to-room-list'])

const { isBreakPointMdAndDown } = useBreakpoint()

const messageArea = useTemplateRef('messageArea')

const userWS = useUserWS()

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const chatStore = useChatStore()
const { openingRoom, messages } = storeToRefs(chatStore)

const voiceCallStore = useVoiceCallStore()
const { agoraClient } = storeToRefs(voiceCallStore)

const loading = ref(false)
const loadErr = ref(false)
const changingRoom = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const showJumpDownBtn = ref(false)

// map ref and each message div
// easy to scroll to specific message by id
const messageRefs = new Map()

function setMessageRef(id, el) {
  if (el) {
    messageRefs.set(id, el)
  }
}

function handleScrollToMessage(msgId) {
  const el = messageRefs.get(msgId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function getMessages(roomId, switchTab) {
  if (loading.value) return

  loading.value = true
  loadErr.value = false

  if (switchTab) {
    currentPage.value = 0
  }
  try {
    const res = await api.get('/message/get-messages', {
      params: {
        room_id: roomId,
        server_id: serverData.value.id,
        page: currentPage.value,
      },
    })

    if (res.status === 200) {
      if (switchTab) {
        messages.value = res.data['messages']
      } else {
        messages.value.unshift(...res.data['messages'])
      }

      currentPage.value += 1
      totalPages.value = res.data['total_pages']
    }
  } catch (_) {
    loadErr.value = true
  }

  loading.value = false
}

function jumpToButtom() {
  if (messageArea.value) {
    messageArea.value.scrollTop = 0
  }
}

async function handleScroll() {
  const container = messageArea.value
  if (!container || loading.value || !openingRoom.value) return

  if (container.scrollTop < 0) {
    showJumpDownBtn.value = true
  } else {
    showJumpDownBtn.value = false
  }

  // second condition to give time to show/shide showJumpDownBtn
  if (currentPage.value >= totalPages.value) return

  const threshold = 100
  const distanceToBottom = container.scrollHeight - -container.scrollTop - container.clientHeight

  // In column-reverse, bottom = older messages
  if (distanceToBottom <= threshold) {
    await getMessages(openingRoom.value.id, false)
  }
}

function addScrollListener() {
  if (messageArea.value) {
    messageArea.value.addEventListener('scroll', handleScroll)
  }
}

function removeScrollListener() {
  if (messageArea.value) {
    messageArea.value.removeEventListener('scroll', handleScroll)
  }
}

watch(
  () => props.activeTab,
  (tab) => {
    if (tab === 'chat') {
      nextTick(() => {
        removeScrollListener()
        addScrollListener()
      })
    } else {
      removeScrollListener()
    }
  },
)

watch(
  () => openingRoom.value?.id,
  async (newOpeningRoomId) => {
    if (newOpeningRoomId) {
      removeScrollListener()
      changingRoom.value = true
      await getMessages(newOpeningRoomId, true)
      changingRoom.value = false
      addScrollListener()
    }
  },
)

onBeforeUnmount(() => {
  removeScrollListener()
})

function onNewMessageSent() {
  // messages.value.push(newMsg)
  setTimeout(() => {
    if (messageArea.value) {
      messageArea.value.scrollTop = 0
    }
  }, 200)
}

function onMessageWrapperHover(msgIndex) {
  if (messages.value.length > 0) {
    messages.value[msgIndex]['show_option'] = true
  }
}

function onMessageWrapperLeave(msgIndex) {
  if (messages.value.length > 0) {
    messages.value[msgIndex]['show_option'] = false
  }
}

const sendingMsg = ref(false)
const showMsgPopover = ref(false)
const msgPopoverX = ref(0)
const msgPopoverY = ref(0)
const msgIndexPopover = ref(null) // msg index that tigger popover
const msgObjectPopover = ref(null) // msg object that trigger popover
const replyToMsg = ref(null)
const showDeleteModal = ref(false)
const showUpdateModal = ref(false)

function openMsgPopover(msgIndex, msg, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  msgIndexPopover.value = msgIndex
  msgObjectPopover.value = msg
  msgPopoverX.value = rect.left
  msgPopoverY.value = rect.bottom
  showMsgPopover.value = true
}

function onDeleteMsgSuccess() {
  if (messages.value.length > 0 && msgIndexPopover.value) {
    messages.value.splice(msgIndexPopover.value, 1)
    msgIndexPopover.value = null
    msgObjectPopover.value = null
    showDeleteModal.value = false
  }
}

function onUpdateMsgSuccess(newText) {
  if (messages.value.length > 0 && msgIndexPopover.value) {
    messages.value[msgIndexPopover.value]['text'] = newText
    msgIndexPopover.value = null
    msgObjectPopover.value = null
    showUpdateModal.value = false
  }
}

function onReplyToMessage() {
  if (msgObjectPopover.value) {
    replyToMsg.value = msgObjectPopover.value
  }
}

function onCloseReplyToMsg() {
  replyToMsg.value = null
}

function onSendingMsg(flag) {
  sendingMsg.value = flag
}

// async function toggleMessageReaction(reactionType) {
//   if (!msgObjectPopover.value || !msgIndexPopover.value) return

//   try {
//     let res = await api.post('/message/toggle-message-reaction', {
//       message_id: msgObjectPopover.value.id,
//       server_id: serverData.value.id,
//       room_id: msgObjectPopover.value.room_id,
//       reaction: reactionType,
//     })

//     if (res.status === 200) {
//       console.log(res.data)
//     }
//   } catch (_) {}
// }

const joiningCall = ref(false)
const leavingCall = ref(false)

async function joinCall() {
  if (!serverData.value || !openingRoom.value) return

  joiningCall.value = true

  try {
    await voiceCallStore.cleanUpChannel()

    let res = await api.post('/voicecall/join-voice-call', {
      server_id: serverData.value.id,
      room_id: openingRoom.value.id,
    })

    if (res.status === 200) {
      voiceCallStore.setClient()
      await agoraClient.value.join(
        voiceCallStore.appId,
        res.data['channel_name'],
        res.data['token'],
        res.data['joiner_uid'],
      )
      userWS.updateUserJoinOrLeave(true, res.data)
      await voiceCallStore.setupCallProcess()
    }
  } catch (_) {}

  joiningCall.value = false
}

async function leaveCall() {
  if (!serverData.value || !openingRoom.value) return

  leavingCall.value = true

  try {
    let res = await api.delete('/voicecall/leave-voice-call', {
      data: {
        room_id: openingRoom.value.id,
        server_id: serverData.value.id,
      },
    })

    if (res.status === 200) {
      userWS.updateUserJoinOrLeave(false, res.data)
      await voiceCallStore.cleanUpChannel()
    }
  } catch (_) {}

  leavingCall.value = false
}
</script>

<template>
  <div v-if="!loadErr" class="message-container">
    <div v-if="openingRoom" class="message-upper-container">
      <div style="display: flex; align-items: center">
        <n-button
          v-if="isBreakPointMdAndDown"
          type="primary"
          size="tiny"
          class="mr-1"
          :disabled="sendingMsg"
          round
          @click="emit('go-back-to-room-list')"
        >
          <template #icon>
            <n-icon><ArrowBackIosRound /></n-icon>
          </template>
        </n-button>
        <span style="font-weight: bold">#{{ openingRoom.name }}</span>
      </div>

      <div>
        <n-button
          v-if="!openingRoom.users_in_voice_call.includes(user.username)"
          type="primary"
          size="tiny"
          round
          :disabled="joiningCall"
          :loading="joiningCall"
          @click="joinCall()"
        >
          <template #icon>
            <n-icon><PhoneAlt /></n-icon>
          </template>
          Join
        </n-button>
        <n-button
          v-else-if="openingRoom.users_in_voice_call.includes(user.username)"
          type="error"
          size="tiny"
          round
          :disabled="leavingCall"
          :loading="leavingCall"
          @click="leaveCall()"
        >
          <template #icon>
            <n-icon><PhoneAlt /></n-icon>
          </template>
          Leave
        </n-button>
      </div>
    </div>

    <div v-if="loading" style="text-align: center" class="mt-2">
      <n-spin :size="25"></n-spin>
    </div>

    <DeleteMessageModal
      v-if="openingRoom"
      :show-modal="showDeleteModal"
      :server-id="serverData.id"
      :room-id="openingRoom.id"
      :message="msgObjectPopover"
      @close-delete-msg-modal="showDeleteModal = false"
      @delete-msg-success="onDeleteMsgSuccess"
    />

    <UpdateMessageModal
      v-if="openingRoom"
      :show-modal="showUpdateModal"
      :server-id="serverData.id"
      :room-id="openingRoom.id"
      :message="msgObjectPopover"
      @close-update-msg-modal="showUpdateModal = false"
      @update-msg-success="onUpdateMsgSuccess"
    />

    <n-popover
      trigger="manual"
      :show-arrow="false"
      :show="showMsgPopover"
      :x="msgPopoverX"
      :y="msgPopoverY"
      placement="top"
      style="padding: 5px"
      @clickoutside="showMsgPopover = false"
    >
      <div v-if="msgObjectPopover !== null && msgObjectPopover.own">
        <div class="my-1">
          <n-button size="small" tertiary style="width: 100%" @click="showUpdateModal = true">
            Edit
          </n-button>
        </div>
        <div class="my-1">
          <n-button size="small" tertiary style="width: 100%" @click="showDeleteModal = true">
            Delete
          </n-button>
        </div>
      </div>
      <!-- <div v-else>
        <div>
          <n-button size="small" style="width: 100%">React</n-button>
        </div>
        <div class="mt-2">
          <n-button size="small" style="width: 100%">Testing</n-button>
        </div>
      </div> -->
      <div class="my-1">
        <n-button size="small" tertiary style="width: 100%" @click="onReplyToMessage()">
          Reply
        </n-button>
      </div>
      <!-- <div class="mt-2">
        <n-button size="small" tertiary @click="toggleMessageReaction('thumbup')">
          &#128077;
        </n-button>
        <n-button size="small" tertiary @click="toggleMessageReaction('thumbdown')">
          &#128078;
        </n-button>
        <n-button size="small" tertiary @click="toggleMessageReaction('heart')">&#128147;</n-button>
        <n-button size="small" tertiary @click="toggleMessageReaction('laugh')">&#128514;</n-button>
        <n-button size="small" tertiary @click="toggleMessageReaction('sad')">&#128557;</n-button>
        <n-button size="small" tertiary @click="toggleMessageReaction('smile')">&#128522;</n-button>
      </div> -->
    </n-popover>

    <div class="message-area" ref="messageArea">
      <transition-group name="message-fade" tag="div">
        <div v-if="!changingRoom">
          <div
            v-for="(message, index) in messages"
            :key="message.id"
            :ref="(el) => setMessageRef(message.id, el)"
            @mouseover="onMessageWrapperHover(index)"
            @mouseleave="onMessageWrapperLeave(index)"
          >
            <h3 v-if="message.date" style="margin: 0; text-align: center">{{ message.date }}</h3>

            <div v-else-if="message.own && !message.date" class="message-wrapper">
              <div style="display: flex; flex-direction: row; justify-content: flex-end">
                <n-button
                  v-if="message.show_option"
                  tertiary
                  size="tiny"
                  style="margin-top: 5px; margin-right: 5px"
                  @click="openMsgPopover(index, message, $event)"
                >
                  ⋯
                </n-button>
                <div class="message own-msg">
                  <ReplyToMessageWrapper
                    :reply-to-msg="message.reply_to_message"
                    @scroll-to-message="handleScrollToMessage"
                  />
                  <span class="mb-1">{{ message.text }}</span>
                  <MessageFileList :message="message" />

                  <div style="text-align: right; display: flex; justify-content: flex-end">
                    <small style="font-size: 10px">
                      {{ message.created_at }}
                    </small>
                    <n-icon v-if="message.seen_by_other" :size="16" class="ml-1">
                      <CheckmarkDone />
                    </n-icon>
                  </div>
                </div>
              </div>
              <!-- <div style="display: flex; flex-direction: row; justify-content: flex-end">
                <span style="font-size: 15px">&#128514;</span>
                <span style="font-size: 15px">&#128151;</span>
                <span style="font-size: 15px">&#128293;</span>
                <span style="font-size: 15px">&#128525;</span>
                <span style="font-size: 15px">&#129505;</span>
              </div> -->
            </div>

            <div
              v-else-if="!message.own && !message.date"
              style="display: flex; flex-direction: row; justify-content: flex-start"
              class="message-wrapper"
            >
              <div class="message other-msg">
                <div
                  style="
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    align-content: center;
                  "
                >
                  <div>
                    <n-image
                      v-if="message.sender_profile_url"
                      :src="message.sender_profile_url"
                      width="25"
                      height="25"
                      preview-disabled
                      class="sender-profile-img"
                    ></n-image>
                    <n-icon v-else :size="25"><UserCircleRegular /></n-icon>
                  </div>
                  <span style="font-size: 15px" class="ml-1">{{ message.sender_name }}</span>
                </div>

                <ReplyToMessageWrapper
                  :reply-to-msg="message.reply_to_message"
                  @scroll-to-message="handleScrollToMessage"
                />
                <span class="mb-1">{{ message.text }}</span>
                <MessageFileList :message="message" />

                <div style="text-align: right">
                  <small style="font-size: 10px">{{ message.created_at }}</small>
                </div>
              </div>
              <n-button
                v-if="message.show_option"
                tertiary
                size="tiny"
                style="margin-top: 5px; margin-left: 5px"
                @click="openMsgPopover(index, message, $event)"
              >
                ⋯
              </n-button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <div class="input-area">
      <div
        v-show="showJumpDownBtn"
        style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 5;
          text-align: center;
        "
      >
        <n-button size="tiny" type="primary" round @click="jumpToButtom">
          <template #icon>
            <n-icon :size="20" :component="IosArrowDown"></n-icon>
          </template>
        </n-button>
      </div>
      <MessageInput
        @new-msg-sent="onNewMessageSent"
        @close-reply-to="onCloseReplyToMsg"
        @sending-msg="onSendingMsg"
        :reply-to-msg="replyToMsg"
      />
    </div>
  </div>
  <div
    v-else
    style="display: flex; width: 100%; justify-content: center; align-items: center; height: 100%"
  >
    <n-tag>No Messages</n-tag>
  </div>
</template>

<style scoped>
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.2s ease;
}
.message-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.message-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
