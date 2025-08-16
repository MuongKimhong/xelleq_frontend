<script setup>
import { NSkeleton, NImage, NSpin, NButton, NTag, NModal, NTabs, NTab, useMessage } from 'naive-ui'
import { useServerStore, useViewingServerStore, useNeedJoinServerStore } from '@/stores/server.js'
import { useServerGeneralWS } from '@/stores/websocket/server_general.js'
import { useBaseStore } from '@/stores/base.js'
import { useUserStore } from '@/stores/user.js'
import { useChatWS } from '@/stores/websocket/chatroom.js'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import api from '@/axios.js'

import '@/assets/styles/server.css'
import '@/assets/base.css'

import PostApprovalTab from '@/components/server/approval/PostApprovalTab.vue'
import SettingsTab from '@/components/server/setting/SettingsTab.vue'
import StorageTab from '@/components/server/storage/StorageTab.vue'
import MembersTab from '@/components/server/member/MembersTab.vue'
import ChatsTab from '@/components/server/chat/ChatsTab.vue'
import ForumTab from '@/components/server/forum/ForumTab.vue'
import DescriptionTab from '@/components/server/DescriptionTab.vue'
import RulesTab from '@/components/server/RulesTab.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const serverGeneralWSStore = useServerGeneralWS()
const { serverGeneralWS } = storeToRefs(serverGeneralWSStore)

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const baseStore = useBaseStore()

const chatWSStore = useChatWS()
const { chatWS } = storeToRefs(chatWSStore)

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)
const viewingServerStore = useViewingServerStore()
const { viewingServer } = storeToRefs(viewingServerStore)

const needJoinServerStore = useNeedJoinServerStore()
const { needToJoinServerId } = storeToRefs(needJoinServerStore)

const isJoiningServer = ref(false)
async function joinPublicServer() {
  if (!user.value.authenticated) {
    baseStore.setCurrentUrl(window.location.href)
    needToJoinServerId.value = serverData.value.id
    router.push({ name: 'login' })
    return
  }
  isJoiningServer.value = true

  try {
    let res = await api.post('/servers/join-public-server', {
      server_id: serverData.value.id,
    })

    if (res.status === 200) {
      needToJoinServerId.value = null
      window.location.reload()
      return
    }
  } catch (err) {
    message.error('Failed to join this server')
    isJoiningServer.value = false
    needToJoinServerId.value = null
    return
  }
}

const showLeaveConfirm = ref(false)
async function leaveServer() {
  try {
    let res = await api.post('/servers/leave-server', {
      server_id: serverData.value.id,
    })

    if (res.status === 200) {
      window.location.reload()
      return
    }
  } catch (_) {
    showLeaveConfirm.value = false
    message.error('Failed to leave this server')
    return
  }
}

async function getServerData() {
  serverStore.clearServerData() // reset to trigger spinner

  let useApi = '/servers/get-server-data-unauth'

  if (user.value.authenticated) {
    useApi = '/servers/get-server-data-auth'
  }

  try {
    let res = await api.get(useApi, {
      params: {
        server_id: route.params.id,
      },
    })

    if (res.status === 200) {
      serverStore.setServerData(res.data)

      if (viewingServer.value.id.trim() === '') {
        viewingServerStore.setViewingServer({
          id: res.data.id,
          public: res.data.public,
        })
      }

      if (needToJoinServerId.value !== null) {
        await joinPublicServer()
      }
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Server not found':
        router.push({ name: 'page-not-found' })
        return
    }
  }
}

const serverPageKey = ref(null)

function cleanUp() {
  serverGeneralWSStore.disconnect()
  chatWSStore.disconnect()
  serverPageKey.value = null
}

const activeTab = ref('')

onMounted(async () => {
  await getServerData()
  serverPageKey.value = `server-${route.params.slug}`

  if (serverGeneralWS.value === null && user.value.authenticated) {
    serverGeneralWSStore.connect(serverData.value.id)

    serverGeneralWS.value.onmessage = (e) => {
      let data = JSON.parse(e.data)
      serverGeneralWSStore.handleMessageType(data)
    }
  }

  if (serverData.value && serverData.value.isMember) {
    if (chatWS.value === null && user.value.authenticated) {
      chatWSStore.connect()

      chatWS.value.onmessage = (e) => {
        let data = JSON.parse(e.data)
        chatWSStore.handleMessageType(data)
      }
    }
  }

  if (serverData.value) {
    if (serverData.value.description && (serverData.value.isMember || serverData.value.public)) {
      activeTab.value = 'description'
    } else if (serverData.value.isMember) {
      activeTab.value = 'chat'
    }

    if (route.query.tab) {
      activeTab.value = route.query.tab
    } else {
      // If no tab in query set default
      router.replace({
        query: {
          ...route.query,
          tab: activeTab.value,
        },
      })
    }
  }
})

// When activeTab change update query param
watch(activeTab, (newTab) => {
  router.replace({
    query: {
      ...route.query,
      tab: newTab,
    },
  })
})

onBeforeUnmount(() => {
  cleanUp()
})
</script>

<template>
  <!-- Skeleton loading -->
  <div v-if="!serverData">
    <div class="upper-detail-container">
      <n-skeleton height="32px" width="32px" circle />

      <n-skeleton text style="width: 120px; height: 10px; margin-left: 10px" />
    </div>

    <div style="padding: 10px">
      <n-skeleton text style="height: 15px" :repeat="2" />
    </div>

    <div style="display: flex; justify-content: center; align-items: center; height: 200px">
      <n-spin :size="50" />
    </div>
  </div>

  <div
    v-if="serverPageKey && serverData"
    :key="serverPageKey"
    style="display: flex; flex-direction: column; height: calc(100dvh - 60px)"
  >
    <div>
      <div class="upper-detail-container" style="height: 30px">
        <n-image
          v-if="serverData.profileUrl !== null"
          :src="serverData.profileUrl"
          width="32"
          height="32"
          class="profile-img"
        />
        <n-image v-else src="/default_user_profile.png" width="32" height="32" />

        <div class="name-detail-container">
          <div style="display: flex; flex-direction: column">
            <h4 style="margin: 0">{{ serverData.name }}</h4>

            <small v-if="serverData.public" style="margin: 0">
              <span>{{ serverData.totalMembers }} members</span>
              <span> | Public <span v-if="serverData.restrict">& Restrict</span></span>
              <span> | {{ serverData.createdAt.split(' ')[0] }}</span>
            </small>
            <small v-else style="margin: 0">
              <span>Private</span>
              <span v-if="serverData.isMember">
                <span> | {{ serverData.totalMembers }} members</span>
                <span> | {{ serverData.createdAt.split(' ')[0] }}</span>
              </span>
            </small>
          </div>

          <n-button
            v-if="serverData.isMember"
            type="error"
            @click="showLeaveConfirm = true"
            size="small"
          >
            {{ t('leave') }}
          </n-button>
          <n-modal
            v-model:show="showLeaveConfirm"
            :mask-closable="false"
            preset="dialog"
            :title="t('leaveServerTitle')"
            :content="t('leaveServerContent')"
            :positive-text="t('leave')"
            :negative-text="t('cancel')"
            @positive-click="leaveServer()"
            @negative-click="showLeaveConfirm = false"
          />

          <n-button
            v-if="serverData.public && !serverData.isMember"
            type="primary"
            size="small"
            :disabled="isJoiningServer"
            :loading="isJoiningServer"
            @click="joinPublicServer()"
          >
            {{ t('join') }}
          </n-button>
        </div>
      </div>

      <div
        v-if="serverData.public || serverData.isMember"
        class="tabs-container"
        style="height: 35px"
      >
        <n-tabs type="line" animated size="small" v-model:value="activeTab">
          <n-tab
            v-if="serverData.description && (serverData.isMember || serverData.public)"
            name="description"
          >
            Description
          </n-tab>
          <n-tab v-if="serverData.isMember" name="chat"> Chats </n-tab>
          <n-tab name="discussion-forum"> Forum </n-tab>
          <n-tab v-if="serverData.isMember" name="storage"> Storage </n-tab>
          <n-tab v-if="serverData.isMember" name="member">Members</n-tab>
          <n-tab v-if="serverData.isAdmin || serverData.isModerator" name="post-approval">
            Post Approval
          </n-tab>
          <n-tab v-if="serverData.isAdmin" name="setting">Settings</n-tab>
          <n-tab v-if="serverData.rules && (serverData.isMember || serverData.public)" name="rule">
            Rule
          </n-tab>
        </n-tabs>
      </div>
      <div v-else>
        <h2 style="text-align: center" class="mt-4">{{ t('thisServerIsPrivate') }}</h2>
      </div>
    </div>

    <ForumTab v-show="activeTab === 'discussion-forum'" />
    <ChatsTab v-show="activeTab === 'chat'" :active-tab="activeTab" />
    <StorageTab v-if="activeTab === 'storage'" />
    <RulesTab v-else-if="activeTab === 'rule'" />
    <DescriptionTab v-else-if="activeTab === 'description'" />
    <PostApprovalTab v-else-if="activeTab === 'post-approval'" />
    <SettingsTab v-else-if="activeTab === 'setting'" />
    <MembersTab v-else-if="activeTab === 'member'" />
  </div>
</template>
