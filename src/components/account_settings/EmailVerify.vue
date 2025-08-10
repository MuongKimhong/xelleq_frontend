<script setup>
import { NTag, NIcon, NCard, NButton, NInput, NInputGroup } from 'naive-ui'
import { WarningOutline } from '@vicons/ionicons5'
import { useUserStore } from '../../stores/user.js'
import { useBreakpoint } from '../../breakpoint.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted } from 'vue'
import api from '../../axios.js'

import defaultUserProfile from '../../assets/default_user_profile.png'
import '../../assets/base.css'

const { isBreakPointSmOrXs, isBreakPointMdAndUp, isBreakPointSmAndUp } = useBreakpoint()
const { t } = useI18n()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const code = ref('')
const canEnterCode = ref(false)
const isVerifying = ref(false)
const showErrText = ref(false)
const errText = ref('')

async function getVerificationCode() {
  showErrText.value = false
  canEnterCode.value = false
  isVerifying.value = true

  const payload = {
    email: user.value.email,
  }
  try {
    let res = await api.post('/users/get-verification-code', payload)

    if (res.status == 200) {
      isVerifying.value = false
      showErrText.value = false
      canEnterCode.value = true
      return
    }
  } catch (_) {
    isVerifying.value = false
    canEnterCode.value = false
    showErrText.value = true
    errText.value = t('failSendCode')
    return
  }
}

async function verifyEmailWithCode() {
  showErrText.value = false
  isVerifying.value = true

  if (code.value.trim() === '' || code.value.length !== 6) {
    showErrText.value = true
    isVerifying.value = false
    errText.value = t('codeInvalid')
    return
  }

  try {
    let res = await api.post('/users/verify-email', { code: code.value })

    if (res.status === 200) {
      isVerifying.value = false
      showErrText.value = false
      canEnterCode.value = false
      user.value.emailVerified = true
      return
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Verification expired':
        errText.value = t('codeExpired')
        break
      default:
        errText.value = t('codeInvalid')
    }

    showErrText.value = true
    isVerifying.value = false
    return
  }
}
</script>

<template>
  <div class="mb-3">
    <n-card v-if="!user.emailVerified && !canEnterCode" :content-style="{ padding: '10px 15px' }">
      <div style="text-align: center">
        <n-tag v-if="!showErrText" type="warning"> {{ t('emailNotVerified') }} </n-tag>
        <n-tag v-else type="error"> {{ errText }} </n-tag>
      </div>

      <div v-if="isBreakPointSmAndUp" class="email-verify-card">
        <span class="label-with-icon">
          <n-icon><WarningOutline /></n-icon>
          {{ user.email }}
        </span>
        <n-button type="primary" size="small" @click="getVerificationCode()" :loading="isVerifying">
          {{ t('verifyNow') }}
        </n-button>
      </div>
      <div v-else>
        <div style="text-align: center" class="my-4">
          <span class="label-with-icon">
            <n-icon><WarningOutline /></n-icon>
            {{ user.email }}
          </span>
        </div>
        <div style="text-align: center" class="my-4">
          <n-button
            type="primary"
            size="small"
            @click="getVerificationCode()"
            :loading="isVerifying"
          >
            {{ t('verifyNow') }}
          </n-button>
        </div>
      </div>
    </n-card>

    <n-card v-if="canEnterCode" :content-style="{ padding: '10px 15px' }">
      <div v-if="showErrText" style="text-align: center">
        <n-tag type="error"> {{ errText }} </n-tag>
      </div>
      <n-input-group class="mt-4">
        <n-input :placeholder="t('codePlaceholder')" v-model:value="code"></n-input>
        <n-button type="primary" @click="verifyEmailWithCode()" :loading="isVerifying">
          {{ t('verify') }}
        </n-button>
      </n-input-group>
    </n-card>

    <n-card v-if="user.emailVerified && !canEnterCode" :content-style="{ padding: '10px 15px' }">
      <div style="text-align: center">
        <n-tag type="success"> {{ t('emailIsVerified') }} </n-tag>
        <h3>{{ user.email }}</h3>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.email-verify-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: 5px;
  padding-right: 5px;
  gap: 12px;
}
</style>
