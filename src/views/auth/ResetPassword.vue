<script setup>
import {
  NCard,
  NInput,
  NInputGroup,
  NButton,
  NTag,
  NIcon,
  NBreadcrumb,
  NBreadcrumbItem,
} from 'naive-ui'
import { EyeOffOutline, EyeOutline } from '@vicons/ionicons5'
import { useLangStore } from '@/stores/lang.js'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import api from '@/axios.js'

import '@/assets/base.css'
import '@/assets/styles/loginRegister.css'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const langStore = useLangStore()
const lang = computed(() => langStore.lang)

const resetPassErrText = ref('')
const showErrTextInvalid = ref(false)
const showErrTextLinkExpired = ref(false)
const isSubmitting = ref(false)
const passedValidation = ref(false)
const inputPasswordType = ref('password')
const newPassword = ref('')
const confirmPassword = ref('')

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

function redirectLogIn() {
  router.push({ name: 'login' })
}

function redirectForgotPassword() {
  router.push({ name: 'forgot-password' })
}

async function validateResetPasswordToken() {
  const { id, email, token } = route.query
  showErrTextInvalid.value = false
  showErrTextLinkExpired.value = false
  passedValidation.value = false

  if (!id || !email || !token) {
    showErrTextInvalid.value = true
    resetPassErrText = t('failToValidateResetPassLink')
    return
  }

  const payload = {
    request_id: id,
    email: email,
    token: token,
  }
  try {
    let res = await api.post('/users/validate-reset-password-link', payload)
    if (res.status === 200) {
      passedValidation.value = true
    }
  } catch (_) {
    showErrTextLinkExpired.value = true
    return
  }
}

async function resetPassword() {
  const { id, email, token } = route.query

  showErrTextInvalid.value = false
  showErrTextLinkExpired.value = false
  isSubmitting.value = true

  if (newPassword.value.trim() === '' || confirmPassword.value.trim() === '') {
    resetPassErrText.value = t('hasEmptyField')
    showErrTextInvalid.value = true
    isSubmitting.value = false
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    resetPassErrText.value = t('registerErrTwoPasswordNotMatch')
    showErrTextInvalid.value = true
    isSubmitting.value = false
    return
  }

  const payload = {
    email: email,
    token: token,
    request_id: id,
    new_pass: newPassword.value,
    confirm_new_pass: confirmPassword.value,
  }
  try {
    let res = await api.post('/users/reset-password', payload)
    if (res.status === 200) {
      router.push({ name: 'login' })
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Link expire':
        resetPassErrText.value = t('resetPassLinkExpired')
        break
      case 'Password not strong':
        resetPassErrText.value = t('registerErrPasswordNotStrong')
        break
      default:
        resetPassErrText.value = t('failToValidateResetPassLink')
    }
    showErrTextInvalid.value = true
    isSubmitting.value = false
  }
}

const handleEnter = (e) => e.key === 'Enter' && resetPassword()

onMounted(async () => {
  try {
    await validateResetPasswordToken()
  } catch (_) {}

  window.addEventListener('keydown', handleEnter)
})

onUnmounted(() => window.removeEventListener('keydown', handleEnter))
</script>

<template>
  <div class="container">
    <n-card id="login-card">
      <div v-if="showErrTextInvalid" class="input" style="text-align: center">
        <n-tag type="error" size="large">{{ resetPassErrText }}</n-tag>
      </div>

      <div v-if="showErrTextLinkExpired" class="input" style="text-align: center">
        <n-tag type="error" size="large">{{ t('resetPassLinkExpired') }}</n-tag>
      </div>

      <div v-if="passedValidation" class="input">
        <n-input-group>
          <n-input
            :type="inputPasswordType"
            :placeholder="t('password')"
            v-model:value="newPassword"
          />
          <n-button tertiary type="primary" @click="showPassword = !showPassword">
            <n-icon :size="20">
              <EyeOffOutline v-if="showPassword" />
              <EyeOutline v-else />
            </n-icon>
          </n-button>
        </n-input-group>
        <small v-if="lang == 'en'">
          Password must be at least 8 characters and contains one special character !@#$%^&*
        </small>
        <small v-else-if="lang == 'kh'">
          ពាក្យសម្ងាត់ត្រូវមានចំនួន៨ខ្ទង់ឡើងលើ ហើយត្រូវមានតួអក្សរទាំងនេះ !@#$%^&* យ៉ាងតិចមួយ
        </small>
      </div>
      <div v-if="passedValidation" class="input">
        <n-input
          :type="inputPasswordType"
          :placeholder="t('confirmPassword')"
          v-model:value="confirmPassword"
        />
      </div>

      <div v-if="passedValidation" class="input" style="text-align: center">
        <n-button
          tertiary
          type="primary"
          @click="resetPassword()"
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
          <n-breadcrumb-item>
            <span class="link-span" @click="redirectForgotPassword()">
              {{ t('forgotPassword') }}
            </span>
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
    </n-card>
  </div>
</template>
