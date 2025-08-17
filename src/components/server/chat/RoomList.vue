<script setup>
import { NTag, NSpin, NPopover, NButton, NIcon } from 'naive-ui'
import { DotsVertical } from '@vicons/tabler'
import { Speaker220Regular } from '@vicons/fluent'
import { Plus } from '@vicons/fa'
import { useChatStore } from '@/stores/chat.js'
import { useServerStore } from '@/stores/server.js'
import { useBreakpoint } from '@/breakpoint.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, defineAsyncComponent } from 'vue'
import api from '@/axios.js'

const CreateRoomModal = defineAsyncComponent(() => import('./CreateRoomModal.vue'))
const RenameRoomModal = defineAsyncComponent(() => import('./RenameRoomModal.vue'))
const DeleteRoomModal = defineAsyncComponent(() => import('./DeleteRoomModal.vue'))

import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import '@/assets/styles/chatroom.css'
import '@/assets/styles/server.css'
import '@/assets/base.css'

const emit = defineEmits(['romm-press-md-and-down'])

const { isBreakPointLgAndUp, isBreakPointMdAndDown } = useBreakpoint()
const { t } = useI18n()

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const chatStore = useChatStore()
const { openingRoom, rooms } = storeToRefs(chatStore)

const showCreateRoomModal = ref(false)
const showRenameRoomModal = ref(false)
const renamingRoomIndex = ref(null)
const renamingRoomId = ref(null)
const showDeleteRoomModal = ref(false)
const deletingRoomIndex = ref(null)
const deletingRoomId = ref(null)
const loading = ref(false)
const loadErr = ref(false)

async function getChatRooms() {
  loading.value = true
  loadErr.value = false

  try {
    let res = await api.get('/rooms/get-all-chat-rooms', {
      params: {
        server_id: serverData.value.id,
      },
    })

    if (res.status === 200) {
      rooms.value = res.data
    }
  } catch (_) {
    loadErr.value = true
  }

  loading.value = false
}

function onCreateRoomSuccess(newRoom) {
  rooms.value.unshift(newRoom)
  showCreateRoomModal.value = false
}

function onRenameBtnPress(index, id) {
  renamingRoomIndex.value = index
  renamingRoomId.value = id
  showRenameRoomModal.value = true
}

function onRenameRoomSuccess(newName) {
  if (renamingRoomIndex.value !== null) {
    rooms.value[renamingRoomIndex.value]['name'] = newName

    if (openingRoom.value) {
      if (rooms.value[renamingRoomIndex.value].id === openingRoom.value.id) {
        openingRoom.value.name = newName
      }
    }

    showRenameRoomModal.value = false
    renamingRoomIndex.value = null
    renamingRoomId.value = null
  }
}

function onDeleteBtnPress(index, id) {
  deletingRoomIndex.value = index
  deletingRoomId.value = id
  showDeleteRoomModal.value = true
}

function onDeleteRoomSuccess() {
  if (deletingRoomIndex.value !== null) {
    rooms.value.splice(deletingRoomIndex.value, 1)
    showDeleteRoomModal.value = false
    deletingRoomIndex.value = null
    deletingRoomId.value = null
  }
}

function onRoomPress(room, roomIndex) {
  openingRoom.value = room

  if (rooms.value.length > 0) {
    rooms.value[roomIndex]['has_msg_to_be_seen'] = false
  }

  if (isBreakPointMdAndDown.value) {
    emit('romm-press-md-and-down')
  }
}

onMounted(async () => {
  await getChatRooms()
})
</script>

<template>
  <div>
    <CreateRoomModal
      v-if="serverData.isAdmin || serverData.isModerator"
      :show-modal="showCreateRoomModal"
      :server-id="serverData.id"
      @close-create-room-modal="showCreateRoomModal = false"
      @create-room-success="onCreateRoomSuccess"
    />

    <RenameRoomModal
      v-if="serverData.isAdmin || serverData.isModerator"
      :show-modal="showRenameRoomModal"
      :server-id="serverData.id"
      :room-id="renamingRoomId"
      @close-rename-room-modal="showRenameRoomModal = false"
      @rename-room-success="onRenameRoomSuccess"
    />

    <DeleteRoomModal
      v-if="serverData.isAdmin || serverData.isModerator"
      :show-modal="showDeleteRoomModal"
      :server-id="serverData.id"
      :room-id="deletingRoomId"
      @close-delete-room-modal="showDeleteRoomModal = false"
      @delete-room-success="onDeleteRoomSuccess"
    />

    <div
      :class="{
        'room-list-container-lg-and-up': isBreakPointLgAndUp,
        'room-list-container-md-and-down': isBreakPointMdAndDown,
      }"
    >
      <div class="upper-container">
        <span style="font-size: 16px">Rooms</span>
        <n-button
          v-if="serverData.isAdmin || serverData.isModerator"
          type="primary"
          size="tiny"
          @click="showCreateRoomModal = true"
        >
          <template #icon>
            <n-icon>
              <Plus />
            </n-icon>
          </template>
        </n-button>
      </div>

      <hr class="hr-line" />

      <div>
        <div
          v-for="(room, index) in rooms"
          :key="room.id"
          class="mb-1 room"
          :class="{ viewing: openingRoom && room.id === openingRoom.id }"
          @click="onRoomPress(room, index)"
        >
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div
              :class="{
                'room-name-lg-and-up': isBreakPointLgAndUp,
                'room-name-md-and-down': isBreakPointMdAndDown,
              }"
            >
              <span> # {{ room.name }} </span>
            </div>

            <div v-if="room.has_msg_to_be_seen">
              <n-tag type="error" size="small" class="mr-1" round>new</n-tag>

              <n-popover
                v-if="serverData.isAdmin || serverData.isModerator"
                trigger="click"
                placement="left"
                :show-arrow="false"
              >
                <template #trigger>
                  <n-button size="tiny" tertiary round>
                    <n-icon :size="10"><DotsVertical /></n-icon>
                  </n-button>
                </template>
                <div style="width: 80px; padding: 0px">
                  <div class="room-popover-list" @click="onRenameBtnPress(index, room.id)">
                    {{ t('rename') }}
                  </div>
                  <!-- <div class="room-popover-list" @click="onDeleteBtnPress(index, room.id)">
                    {{ t('delete') }}
                  </div> -->
                </div>
              </n-popover>
            </div>
          </div>

          <!-- list of user in call -->
          <div style="padding-left: 10px" class="mt-1" v-if="room.users_in_voice_call.length > 0">
            <div
              v-for="userInCall in room.users_in_voice_call"
              :key="userInCall"
              :class="{
                'user-incall-name-lg-and-up': isBreakPointLgAndUp,
                'user-incall-name-md-and-down': isBreakPointMdAndDown,
              }"
            >
              <n-icon :size="15"><Speaker220Regular /> </n-icon>
              <span class="ml-1"> {{ userInCall }} </span>
            </div>
          </div>
        </div>

        <div v-if="loading" style="text-align: center; height: 150px">
          <n-spin :size="35" class="mt-4"></n-spin>
        </div>
      </div>
    </div>
  </div>
</template>
