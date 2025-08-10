<script setup>
import { NCard, NInput, NInputGroup, NButton, NIcon, NTag } from 'naive-ui'
import { EyeOffOutline, EyeOutline } from '@vicons/ionicons5'
import { useBaseStore } from '../../stores/base.js'
import { useUserStore } from '../../stores/user.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import api from '../../axios.js'

import '../../assets/base.css'
import '../../assets/styles/loginRegister.css'

const { t } = useI18n()
const router = useRouter()

const { getUserData } = useUserStore()

const baseStore = useBaseStore()
const { currentUrl } = storeToRefs(baseStore)

const showErrText = ref(false)
const inputPasswordType = ref('password')
const username = ref('')
const password = ref('')
const isSubmitting = ref(false)

const showPassword = ref(false)
watch(showPassword, (newVal) => {
  if (newVal) {
    inputPasswordType.value = 'text'
  } else {
    inputPasswordType.value = 'password'
  }
})

function redirectRegister() {
  router.push({ name: 'register' })
}

function redirectForgotPassword() {
  router.push({ name: 'forgot-password' })
}

async function logIn() {
  showErrText.value = false
  isSubmitting.value = true

  // check empty field
  if (username.value.trim() === '' || password.value.trim() === '') {
    showErrText.value = true
    isSubmitting.value = false
    return
  }

  const payload = {
    username: username.value,
    password: password.value,
  }
  try {
    let res = await api.post('/users/log-in', payload)
    if (res.status === 200) {
      try {
        await getUserData()

        // redirect to set url
        if (currentUrl.value !== null) {
          let url = currentUrl.value
          baseStore.clearCurrentUrl()
          window.location.href = url
          return
        }

        router.push({ name: 'home' })
      } catch (_) {
        showErrText.value = true
        isSubmitting.value = false
        return
      }
    }
  } catch (_) {
    showErrText.value = true
    isSubmitting.value = false
    return
  }
}

// on enter key press
const handleEnter = (e) => e.key === 'Enter' && logIn()
onMounted(() => window.addEventListener('keydown', handleEnter))
onUnmounted(() => window.removeEventListener('keydown', handleEnter))
</script>

<template>
  <div class="container">
    <n-card id="login-card">
      <h2 style="text-align: center">{{ t('login') }}</h2>

      <transition name="fade">
        <div v-if="showErrText" class="input" style="text-align: center">
          <n-tag type="error" size="large">{{ t('loginErr') }}</n-tag>
        </div>
      </transition>
      <div>
        <div class="input">
          <n-input type="text" :placeholder="t('usernameOrEmail')" v-model:value="username" />
        </div>
        <div class="input">
          <n-input-group>
            <n-input
              :type="inputPasswordType"
              :placeholder="t('password')"
              v-model:value="password"
            />
            <n-button tertiary type="primary" @click="showPassword = !showPassword">
              <n-icon :size="20">
                <EyeOffOutline v-if="showPassword" />
                <EyeOutline v-else />
              </n-icon>
            </n-button>
          </n-input-group>
        </div>
        <div class="input-text">
          <span class="link-span" @click="redirectForgotPassword()">{{ t('forgotPassword') }}</span>
        </div>
        <div class="input-text">
          <span>
            {{ t('newToCelliq') }}
            <span class="link-span" @click="redirectRegister()">{{ t('register') }}</span>
          </span>
        </div>
        <div class="input" style="text-align: center">
          <n-button
            tertiary
            type="primary"
            :disabled="isSubmitting"
            :loading="isSubmitting"
            @click="logIn()"
          >
            {{ t('login') }}
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>
