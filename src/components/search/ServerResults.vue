<script setup>
import { NSpin, NImage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useTemplateRef } from 'vue'
import '@/assets/styles/profile.css'
import '@/assets/styles/search.css'
import '@/assets/base.css'

import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const router = useRouter()

const emit = defineEmits(['need-fetch-more-servers'])

const props = defineProps({
  servers: {
    type: Array,
    default: [],
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 0,
  },
  fetchingMore: {
    type: Boolean,
    default: false,
  },
})

const serverResultContainer = useTemplateRef('serverResultContainer')

function handleGetMoreServersOnScroll(event) {
  const container = event.target
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 150

  if (scrollPosition >= threshold) {
    if (props.currentPage >= props.totalPages || props.fetchingMore) return
    emit('need-fetch-more-servers')
  }
}

function redirectServer(server) {
  router.push({
    name: 'server-detail',
    params: {
      id: server.id,
      slug: server.slug,
    },
  })
}
</script>

<template>
  <div
    style="
      height: calc(100dvh - 135px);
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
      margin-bottom: 100px;
    "
  >
    <DynamicScroller
      v-if="servers.length > 0"
      :items="servers"
      :min-item-size="300"
      :key-field="'id'"
      :variable-size="true"
      class="search-result-server-container"
      ref="serverResultContainer"
      @scroll="handleGetMoreServersOnScroll"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :data-index="index"
          :size-dependencies="[item.name, item.description]"
        >
          <div class="server-result-wrapper" @click="redirectServer(item)">
            <div style="display: flex; flex-direction: row; align-items: flex-start; padding: 10px">
              <div>
                <n-image
                  v-if="item.profile_url !== null"
                  :src="item.profile_url"
                  width="35"
                  height="35"
                  class="profile-img mt-1"
                  preview-disabled
                />
                <n-image
                  v-else
                  src="/default_user_profile.png"
                  preview-disabled
                  class="mt-1"
                  width="35"
                  height="35"
                />
              </div>

              <div class="ml-3">
                <h3 style="margin: 0; font-size: 20px">
                  <strong>{{ item.name }}</strong>
                </h3>
                <div v-if="item.description">
                  <span>{{ item.description }}</span>
                </div>
                <small class="mt-2">
                  {{ item.total_members }} Member<span v-if="item.total_members > 1">s</span>
                </small>
              </div>
            </div>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <div v-if="!fetchingMore && servers.length === 0" style="text-align: center">
      <span>Sorry, we don't have what you're looking for.</span>
    </div>

    <div v-if="fetchingMore" style="text-align: center">
      <n-spin :size="30" class="mt-4"></n-spin>
    </div>
  </div>
</template>
