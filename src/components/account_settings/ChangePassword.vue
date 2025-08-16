<script setup>
import { NInputGroup, NInput, NIcon, NButton, useMessage } from 'naive-ui'
import { EyeOffOutline, EyeOutline } from '@vicons/ionicons5'
import { useLangStore } from '@/stores/lang.js'
import { useBreakpoint } from '@/breakpoint.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted, computed } from 'vue'
import api from '@/axios.js'

import '@/assets/styles/loginRegister.css'
import '@/assets/base.css'

const { isBreakPointSmOrXs, isBreakPointMdAndUp, isBreakPointSmAndUp } = useBreakpoint()
const { t } = useI18n()

const langStore = useLangStore()
const lang = computed(() => langStore.lang)

const router = useRouter()
const message = useMessage()

const inputPasswordType = ref('password')
const inputStatus = ref('')
const inputStatusTimer = ref(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const isSubmitting = ref(false)

const showPassword = ref(false)
watch(showPassword, (newVal) => {
  if (newVal) {
    inputPasswordType.value = 'text'
  } else {
    inputPasswordType.value = 'password'
  }
})

function resetInputStatus() {
  if (inputStatusTimer.value) {
    clearTimeout(inputStatusTimer.value)
  }

  inputStatusTimer.value = setTimeout(() => {
    inputStatus.value = ''
    inputStatusTimer.value = null
  }, 1500)
}

async function saveChangePassword() {
  isSubmitting.value = true
  inputStatus.value = ''

  if (
    currentPassword.value.trim() === '' ||
    newPassword.value.trim() === '' ||
    confirmNewPassword.value.trim() === ''
  ) {
    isSubmitting.value = false
    inputStatus.value = 'error'
    resetInputStatus()
    message.error('All password fields are required')
    return
  }

  if (newPassword.value != confirmNewPassword.value) {
    isSubmitting.value = false
    inputStatus.value = 'error'
    resetInputStatus()
    message.error('New password & confirm password do not match')
    return
  }

  const payload = {
    old_password: currentPassword.value,
    new_password: newPassword.value,
    confirm_password: confirmNewPassword.value,
  }
  try {
    let res = await api.put('/users/change-password', payload)

    if (res.status === 200) {
      isSubmitting.value = false
      currentPassword.value = ''
      newPassword.value = ''
      confirmNewPassword.value = ''
      message.success('New password has been set')
      inputStatus.value = 'success'
      resetInputStatus()
      return
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Two passwords do not match':
        message.error('New password & confirm password do not match')
        break
      case 'Password not strong':
        message.error('New password is not strong enough')
        break
      default:
        message.error('Current password is incorrect')
        break
    }

    isSubmitting.value = false
    inputStatus.value = 'error'
    resetInputStatus()
    return
  }
}
</script>

<template>
  <div>
    <n-input-group>
      <n-input
        :type="inputPasswordType"
        :placeholder="t('currentPassword')"
        :status="inputStatus"
        v-model:value="currentPassword"
      />
      <n-button @click="showPassword = !showPassword">
        <n-icon :size="20">
          <EyeOffOutline v-if="showPassword" />
          <EyeOutline v-else />
        </n-icon>
      </n-button>
    </n-input-group>

    <n-input
      :type="inputPasswordType"
      :placeholder="t('newPassword')"
      :status="inputStatus"
      class="mt-4"
      v-model:value="newPassword"
    />
    <small v-if="lang == 'en'">
      Password must be at least 8 characters and contains one special character !@#$%^&*
    </small>
    <small v-else-if="lang == 'kh'">
      ពាក្យសម្ងាត់ត្រូវមានចំនួន៨ខ្ទង់ឡើងលើ ហើយត្រូវមានតួអក្សរទាំងនេះ !@#$%^&* យ៉ាងតិចមួយ
    </small>
    <n-input
      :type="inputPasswordType"
      :placeholder="t('confirmNewPassword')"
      :status="inputStatus"
      class="mt-4"
      v-model:value="confirmNewPassword"
    />

    <div style="text-align: right" class="mt-3">
      <n-button @click="saveChangePassword()" :disabled="isSubmitting" :loading="isSubmitting">
        {{ t('save') }}
      </n-button>
    </div>
  </div>
</template>
