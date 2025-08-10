<script setup>
import { NSpin, NTag, NIcon, NImage, NTabs, NTab } from 'naive-ui'
import { UserCircleRegular } from '@vicons/fa'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserProfileStore } from '@/stores/profile.js'
import { storeToRefs } from 'pinia'
import api from '@/axios.js'
import defaultUserProfile from '@/assets/default_user_profile.png'
import '@/assets/styles/server.css'
import '@/assets/base.css'

import UserPostList from '@/components/profile/UserPostList.vue'
import LikedPostList from '@/components/profile/LikedPostList.vue'
import SavedPostList from '@/components/profile/SavedPostList.vue'

const route = useRoute()
const rouer = useRouter()

const userProfileStore = useUserProfileStore()
const { userProfile } = storeToRefs(userProfileStore)

const activeTab = ref('')

const loadingProfile = ref(false)
const loadErr = ref(null)

async function getUserProfile() {
  loadErr.value = null
  userProfile.value = null
  loadingProfile.value = true

  try {
    let res = await api.get('/users/get-user-profile', {
      params: {
        username: route.params.username,
      },
    })

    if (res.status === 200) {
      userProfile.value = res.data
    }
  } catch (e) {
    let errRes = e.response.data.error

    switch (errRes) {
      case 'Account private':
        loadErr.value = 'Profile is private'
        break
      default:
        loadErr.value = 'Something went wrong, please try again.'
    }
  }
  loadingProfile.value = false
}

onMounted(async () => {
  await getUserProfile()
  activeTab.value = 'posts'
})

onBeforeUnmount(() => {
  activeTab.value = ''
})
</script>

<template>
  <div>
    <div v-if="!userProfile">
      <div v-if="loadingProfile" style="text-align: center" class="mt-4">
        <n-spin :size="55"></n-spin>
      </div>

      <div v-if="loadErr" style="text-align: center" class="mt-4">
        <n-tag type="error">{{ loadErr }}</n-tag>
      </div>
    </div>

    <div
      v-if="userProfile"
      style="display: flex; flex-direction: column; height: calc(100vh - 60px)"
    >
      <div>
        <div class="upper-detail-container" style="height: 30px">
          <n-image
            v-if="userProfile.profile_url !== null"
            :src="userProfile.profile_url"
            width="35"
            height="35"
            class="profile-img"
          />
          <n-icon v-else :size="35">
            <UserCircleRegular />
          </n-icon>

          <div class="name-detail-container">
            <div style="display: flex; flex-direction: column">
              <h4 style="margin: 0">{{ userProfile.username }}</h4>
              <small style="margin: 0">Joined {{ userProfile.date_joined }}</small>
            </div>
          </div>
        </div>

        <div v-if="userProfile.description" style="height: 30px; padding: 0px 5px">
          <h3 style="margin: 0">{{ userProfile.description }}</h3>
        </div>

        <div class="tabs-container" style="height: 40px">
          <n-tabs v-model:value="activeTab" type="line" animated size="small">
            <n-tab name="posts">Posts</n-tab>
            <n-tab v-if="userProfile.own" name="liked">Liked</n-tab>
            <n-tab v-if="userProfile.own" name="saved">Saved</n-tab>
          </n-tabs>
        </div>
      </div>

      <UserPostList v-if="activeTab === 'posts'" />
      <LikedPostList v-else-if="activeTab === 'liked'" />
      <SavedPostList v-else-if="activeTab === 'saved'" />
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
</style>
