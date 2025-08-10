<script setup>
import { NImage, NTag, NIcon } from 'naive-ui'
import { PhoneAlt } from '@vicons/fa'
import { useSiderStore } from '@/stores/sider.js'
import { useServerStore, useViewingServerStore } from '@/stores/server.js'
import { useBreakpoint } from '@/breakpoint.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import defaultUserProfile from '@/assets/default_user_profile.png'
import '@/assets/styles/sider.css'
import '@/assets/base.css'

const router = useRouter()

const { isBreakPointSmOrXs } = useBreakpoint()
const siderStore = useSiderStore()

const serverStore = useServerStore()
const { joinedServers } = storeToRefs(serverStore)

const viewingServerStore = useViewingServerStore()

function redirectServerDetail(server) {
  viewingServerStore.setViewingServer(server)
  router.push({
    name: 'server-detail',
    params: {
      id: server.id,
      slug: server.slug,
    },
  })
  if (isBreakPointSmOrXs.value) {
    siderStore.toggleSider()
  }
}
</script>

<template>
  <div>
    <div v-for="server in joinedServers">
      <div
        class="joined-server-list"
        :class="{ viewing: server.id === viewingServerStore.viewingServer.id }"
        @click="redirectServerDetail(server)"
      >
        <n-image
          v-if="server.profile_url !== null"
          :src="server.profile_url"
          width="25"
          height="25"
          class="profile-img"
          preview-disabled
        ></n-image>
        <n-image v-else :src="defaultUserProfile" width="25" height="25"></n-image>
        <span>
          <n-icon :size="10" v-if="server.on_voice_call"><PhoneAlt style="color: green" /></n-icon>
          {{ server.name }}
        </span>
      </div>
    </div>
    <div v-if="joinedServers.length === 0" style="text-align: center" class="mt-4">
      <n-tag size="small">No server</n-tag>
    </div>
  </div>
</template>
