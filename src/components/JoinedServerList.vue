<script setup>
import { NImage, NTag, NIcon } from 'naive-ui'
import { Speaker220Regular } from '@vicons/fluent'
import { useSiderStore } from '@/stores/sider.js'
import { useServerStore, useViewingServerStore } from '@/stores/server.js'
import { useBreakpoint } from '@/breakpoint.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

import '@/assets/styles/sider.css'
import '@/assets/base.css'

const router = useRouter()

const { isBreakPointSmOrXs } = useBreakpoint()
const siderStore = useSiderStore()

const serverStore = useServerStore()
const { joinedServers, onCallServerId } = storeToRefs(serverStore)

const viewingServerStore = useViewingServerStore()
const { viewingServer } = storeToRefs(viewingServerStore)

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

onMounted(() => {
  if (viewingServer.value.id.trim() !== '') {
    router.push({
      name: 'server-detail',
      params: {
        id: viewingServer.value.id,
        slug: viewingServer.value.slug,
      },
    })
  }
})
</script>

<template>
  <div>
    <div v-for="server in joinedServers">
      <div
        class="joined-server-list"
        :class="{ viewing: server.id === viewingServerStore.viewingServer.id }"
        @click="redirectServerDetail(server)"
      >
        <n-icon :size="20" v-if="onCallServerId === server.id">
          <Speaker220Regular />
        </n-icon>
        <n-image
          v-if="server.profile_url !== null"
          :src="server.profile_url"
          width="25"
          height="25"
          class="profile-img"
          preview-disabled
        ></n-image>
        <n-image v-else src="/default_user_profile.png" width="25" height="25"></n-image>
        <span>
          {{ server.name }}
        </span>
      </div>
    </div>
    <div v-if="joinedServers.length === 0" style="text-align: center" class="mt-4">
      <n-tag size="small">No server</n-tag>
    </div>
  </div>
</template>
