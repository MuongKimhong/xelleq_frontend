<script setup>
import { NCard, NButton, NImage, NIcon } from 'naive-ui'
import { UserCircleRegular } from '@vicons/fa'
import { useRouter } from 'vue-router'
import '@/assets/base.css'

import PostCarousel from '@/components/server/forum/PostCarousel.vue'

const router = useRouter()
const emit = defineEmits(['view-post', 'approve-post', 'reject-post'])

const props = defineProps({
  posts: {
    type: Array,
    required: true,
  },
})

function viewPost(post) {
  emit('view-post', post)
}

function approvePost(index) {
  emit('approve-post', index)
}

function rejectPost(index) {
  emit('reject-post', index)
}

function redirectProfile(username) {
  router.push({
    name: 'user-profile',
    params: {
      username: username,
    },
  })
}
</script>

<template>
  <div class="mb-4">
    <div class="mt-2" v-for="(post, index) in posts" :key="post.id">
      <n-card :content-style="{ padding: '0px' }">
        <div class="upper-detail-container">
          <n-image
            v-if="post.owner_profile_url !== null"
            :src="post.owner_profile_url"
            width="30"
            height="30"
            class="profile-img"
          />
          <n-icon v-else :size="30">
            <UserCircleRegular />
          </n-icon>

          <div class="name-detail-container">
            <div style="display: flex; flex-direction: column">
              <h3 style="margin: 0">
                <span @click="redirectProfile(post.owner_username)" class="username">
                  {{ post.owner_username }}
                </span>
                <small> . {{ post.created_at_ago }}</small>
              </h3>
            </div>
          </div>
        </div>

        <div
          style="padding-left: 10px; padding-right: 10px; padding-bottom: 10px; cursor: pointer"
          @click="viewPost(post)"
        >
          <h2 style="font-weight: bold; margin: 0">{{ post.title }}</h2>

          <p class="text-truncate">{{ post.plain_text_content }}</p>
        </div>

        <div style="cursor: pointer">
          <PostCarousel :medias="post.medias" :full-screen="false" />
        </div>

        <div
          style="display: flex; justify-content: flex-end; gap: 8px; padding: 0 10px"
          class="pb-3"
        >
          <n-button
            size="small"
            type="success"
            @click="approvePost(index)"
            :loading="post.approving"
            :disabled="post.approving || post.rejecting"
          >
            Approve
          </n-button>
          <n-button
            size="small"
            type="error"
            @click="rejectPost(index)"
            :loading="post.rejecting"
            :disabled="post.rejecting || post.approving"
          >
            Reject
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.upper-detail-container {
  display: flex;
  align-items: center;
}
.name-detail-container {
  margin-left: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.username {
  cursor: pointer;
}
.username:hover {
  color: #2080f0;
}
</style>
