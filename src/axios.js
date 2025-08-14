import axios from 'axios'
import router from '@/router'

// const api = axios.create({
//   baseURL: 'http://localhost:8000',
//   withCredentials: true,
// })

const api = axios.create({
  baseURL: 'https://aappii.xelleq.com',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const { useUserStore } = await import('@/stores/user.js')
      const userStore = useUserStore()

      if (router.currentRoute.value.name !== 'login') {
        userStore.clearUser()
        router.push({ name: 'login' })
      }
    }

    return Promise.reject(error)
  },
)

export default api
