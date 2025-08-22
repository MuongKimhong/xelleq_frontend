import { createRouter, createWebHistory  } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { storeToRefs } from "pinia"
import { useViewingServerStore } from '../stores/server.js'

import HomeView from '@/views/HomeView.vue'
import ServerDetail from '@/views/server/ServerDetail.vue'
import CreatePost from '@/views/server/CreatePost.vue'
import CreateServer from "@/views/server/CreateServer.vue"
import EditPost from "@/views/server/EditPost.vue"
import PostDetail from '@/views/server/PostDetail.vue'
import UserProfile from "@/views/auth/UserProfile.vue"
import SearchView from "@/views/SearchView.vue"
import LogInView from "@/views/auth/LogInView.vue"
import RegisterView from "@/views/auth/RegisterView.vue"
import AccountSettings from "@/views/auth/AccountSettings.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Xelleq',
        description: 'Create, Connect & Share, all in one place.'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LogInView,
      meta: {
        title: 'Login - Xelleq',
        description: 'Log into Xelleq'
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        title: 'Register Account - Xelleq',
        description: "Register new xelleq account"
      }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordView.vue'),
      meta: {
        title: 'Forgot password - Xelleq',
        description: "Forgot password"
      }
    },
    {
      path: '/account-settings',
      name: 'account-settings',
      component: AccountSettings,
      meta: {
        title: 'Account settings - Xelleq',
        description: "Account settings"
      }
    },
    {
      path: "/profile/:username",
      name: "user-profile",
      component: UserProfile,
      meta: {
        title: 'Profile - Xelleq',
        description: "User Profile page"
      }
    },
    {
      path: '/reset-pass',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPassword.vue'),
      meta: {
        title: 'Reset password - Xelleq',
        description: "Reset password page"
      }
    },
    {
      path: '/create-server',
      name: 'create-server',
      component: CreateServer,
      meta: {
        title: 'Create server - Xelleq',
        description: "Create server page"
      }
    },
    {
      path: '/server/:slug/:id',
      name: 'server-detail',
      component: ServerDetail,
      meta: {
        title: (route) => `Server ${route.params.slug}`,
        description: (route) => `Details for server ID: ${route.params.id}`
      }
    },
    {
      path: '/create-post',
      name: 'create-post',
      component: CreatePost,
      meta: {
        title: 'Create post - Xelleq',
        description: "Create post page"
      }
    },
    {
      path: '/edit-post',
      name: 'edit-post',
      component: EditPost,
      meta: {
        title: 'Edit post - Xelleq',
        description: "Edit post page"
      }
    },
    {
      path: '/post/:slug/:id/:serverid',
      name: 'post-detail',
      component: PostDetail,
      meta: {
        title: (route) => `Post ${route.params.slug}`,
        description: (route) => `Details for post ID: ${route.params.id}`
      }
    },
    {
      path: '/accept-invitation',
      name: 'accept-invitation',
      component: () => import('../views/server/AcceptInvitation.vue'),
      meta: {
        title: 'Accept invitation - Xelleq',
        description: "Accept invitation page"
      }
    },
    {
      path: "/search",
      name: "search",
      component: SearchView,
      meta: {
        title: 'Search - Xelleq',
        description: "Search content page"
      }
    },
    {
      path: "/notifications",
      name: "notifications",
      component: () => import("../views/NotificationView.vue"),
      meta: {
        title: "Notification"
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'page-not-found',
      component: () => import('../views/PageNotFound.vue'),
      meta: {
        title: 'Page not found - Xelleq',
        description: "Page not found"
      }
    },
  ],
})

const unAuthOnlyRoutes = ['login', 'register', 'forgot-password', 'reset-password']
const authOnlyRoutes = ['account-settings', 'create-server', 'create-post', 'edit-post', 'user-profile', 'notifications']

router.beforeEach(async (to, _) => {
  const title = typeof to.meta.title === 'function' ? to.meta.title(to) : to.meta.title
  document.title = title || 'Xelleq'

  const userStore = useUserStore()
  const viewingServerStore = useViewingServerStore()

  const { user } = storeToRefs(userStore)

  if (user.value.authenticated && unAuthOnlyRoutes.includes(to.name)) {
    return { name: 'home' }
  }

  if (!user.value.authenticated && authOnlyRoutes.includes(to.name)) {
    return { name: 'login' }
  }

  if (to.name !== 'server-detail') {
    viewingServerStore.clearViewingServer()
  }
})

export default router
