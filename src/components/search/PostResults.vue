<script setup>
import { NSpin, NImage, NTag } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useTemplateRef } from 'vue'
import defaultUserProfile from '@/assets/default_user_profile.png'
import '@/assets/styles/profile.css'
import '@/assets/styles/search.css'
import '@/assets/base.css'

import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const router = useRouter()

const emit = defineEmits(['need-fetch-more-posts'])

const props = defineProps({
  posts: {
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

const postResultContainer = useTemplateRef('postResultContainer')

function handleGetMorePostsOnScroll(event) {
  const container = event.target
  const scrollPosition = container.scrollTop + container.clientHeight
  const threshold = container.scrollHeight - 150

  if (scrollPosition >= threshold) {
    if (props.currentPage >= props.totalPages || props.fetchingMore) return
    emit('need-fetch-more-posts')
  }
}

function redirectServer(post) {
  router.push({
    name: 'server-detail',
    params: {
      id: post.server_id,
      slug: post.server_slug,
    },
  })
}

function redirectProfile(ownerUsername) {
  router.push({
    name: 'user-profile',
    params: {
      username: ownerUsername,
    },
  })
}

function redirectPostDetail(post, serverId) {
  router.push({
    name: 'post-detail',
    params: {
      id: post.id,
      slug: post.slug,
      serverid: serverId,
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
      v-if="posts.length > 0"
      :items="posts"
      :min-item-size="300"
      :key-field="'id'"
      :variable-size="true"
      class="search-result-posts-container"
      ref="postResultContainer"
      @scroll="handleGetMorePostsOnScroll"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :data-index="index"
          :size-dependencies="[item.title, item.plain_text_content, item.medias]"
        >
          <div class="post-result-wrapper" @click="redirectPostDetail(item, item.server_id)">
            <div class="upper-detail-container">
              <div>
                <n-image
                  v-if="item.server_profile_url !== null"
                  :src="item.server_profile_url"
                  width="32"
                  height="32"
                  class="profile-img mt-1"
                  preview-disabled
                  @click="redirectServer(item)"
                />
                <n-image
                  v-else
                  :src="defaultUserProfile"
                  preview-disabled
                  class="mt-1"
                  width="32"
                  height="32"
                  @click="redirectServer(item)"
                />
              </div>

              <div class="name-detail-container">
                <div style="display: flex; flex-direction: column">
                  <h4 style="margin: 0">
                    <span style="cursor: pointer" @click="redirectServer(item)">
                      {{ item.server_name }}
                    </span>
                  </h4>
                  <h5 style="margin: 0">
                    <span class="post-owner-username" @click="redirectProfile(item.owner_username)">
                      @{{ item.owner_username }}
                    </span>
                    . <small>{{ item.created_at_ago }}</small>
                  </h5>
                </div>
              </div>
            </div>

            <div class="post-result-content-wrapper">
              <div style="flex: 1">
                <h2 style="margin: 0">{{ item.title }}</h2>
              </div>

              <div v-if="item.medias.length > 0" class="post-media-wrapper">
                <img
                  v-if="item.medias[0].media_type === 'image'"
                  :src="item.medias[0].url"
                  style="max-width: 100%; max-height: 100%; object-fit: contain; display: block"
                />
                <video
                  v-else-if="item.medias[0].media_type === 'video'"
                  :src="item.medias[0].url"
                  preload="metadata"
                  muted
                  playsinline
                  style="max-width: 100%; max-height: 100%; object-fit: contain; display: block"
                />
              </div>
            </div>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <div v-if="fetchingMore" style="text-align: center">
      <n-spin :size="30" class="mt-4"></n-spin>
    </div>
  </div>
</template>
