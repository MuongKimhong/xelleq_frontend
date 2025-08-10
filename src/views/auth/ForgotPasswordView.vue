<script setup>
import { NCard, NInput, NButton, NTag, NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../axios.js'

import '../../assets/base.css'
import '../../assets/styles/loginRegister.css'

const { t } = useI18n()
const router = useRouter()

const email = ref('')
const showErrText = ref(false)
const isSubmitting = ref(false)
const linkSent = ref(false)

function redirectRegister() {
  router.push({ name: 'register' })
}

function redirectLogIn() {
  router.push({ name: 'login' })
}

async function requestResetPasswordLink() {
  showErrText.value = false
  isSubmitting.value = true
  linkSent.value = false

  if (email.value.trim() === '') {
    showErrText.value = true
    isSubmitting.value = false
    return
  }

  const payload = { email: email.value }
  try {
    let res = await api.post('/users/request-forget-password', payload)
    if (res.status === 200) {
      linkSent.value = true
      isSubmitting.value = false
      return
    }
  } catch (_) {
    showErrText.value = true
    isSubmitting.value = false
    return
  }
}

const handleEnter = (e) => e.key === 'Enter' && requestResetPasswordLink()
onMounted(() => window.addEventListener('keydown', handleEnter))
onUnmounted(() => window.removeEventListener('keydown', handleEnter))
</script>

<template>
  <div class="container">
    <n-card id="login-card">
      <h2 style="text-align: center">{{ t('resetYourPassword') }}</h2>

      <transition name="fade">
        <div v-if="showErrText" class="input" style="text-align: center">
          <n-tag type="error" size="large">{{ t('emailErr') }}</n-tag>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="linkSent" class="input" style="text-align: center">
          <n-tag type="success" size="large">{{ t('resetPassLinkSent') }}</n-tag>
        </div>
      </transition>

      <div>
        <div class="input">
          <n-input type="text" :placeholder="t('email')" v-model:value="email" />
          <small>{{ t('resetPasswordDescription') }}</small>
        </div>
        <div class="input" style="text-align: center">
          <n-button
            tertiary
            type="primary"
            @click="requestResetPasswordLink"
            :disabled="isSubmitting"
            :loading="isSubmitting"
          >
            {{ t('resetPassword') }}
          </n-button>
        </div>
        <div class="input-text" style="text-align: center">
          <n-breadcrumb>
            <n-breadcrumb-item>
              <span class="link-span" @click="redirectLogIn()">{{ t('login') }}</span>
            </n-breadcrumb-item>
            <n-breadcrumb-item>
              <span class="link-span" @click="redirectRegister()">
                {{ t('register') }}
              </span>
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
      </div>
    </n-card>
  </div>
</template>
