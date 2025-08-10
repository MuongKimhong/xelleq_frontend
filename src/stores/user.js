import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import api from '../axios.js'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    id: '',
    email: '',
    username: '',
    description: null,
    authenticated: false,
    profileUrl: null,
    online: false,
    emailVerified: false,
    receiveEmailNotification: false,
    public: false,
    maxForumPostGalleryCount: 0,
  })

  function setUser(userData) {
    user.value = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      description: userData.description,
      authenticated: true,
      profileUrl: userData.profile_url,
      online: userData.online,
      emailVerified: userData.email_verified,
      receiveEmailNotification: userData.receive_email_notification,
      public: userData.public,
      maxForumPostGalleryCount: userData.max_forum_post_gallery_count,
    }
  }

  function clearUser() {
    user.value = {
      id: '',
      email: '',
      username: '',
      description: null,
      authenticated: false,
      profileUrl: null,
      online: false,
      emailVerified: false,
      receiveEmailNotification: false,
      public: false,
      maxForumPostGalleryCount: 0,
    }
  }

  async function getUserData() {
    try {
      let res = await api.get('/users/get-user-data')

      if (res.status === 200) {
        setUser(res.data)
      }
    } catch (err) {
      clearUser()
    }
  }

  return { user, setUser, clearUser, getUserData }
})
