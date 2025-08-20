<script setup>
import { NCard, NInput, NInputGroup, NButton, NIcon, NTag, NCheckbox, NDatePicker } from 'naive-ui'
import { EyeOffOutline, EyeOutline } from '@vicons/ionicons5'
import { useBaseStore } from '@/stores/base.js'
import { useLangStore } from '@/stores/lang.js'
import { useUserStore } from '@/stores/user.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { staticSiteUrl } from '@/utils.js'
import api from '@/axios.js'

import '@/assets/base.css'
import '@/assets/styles/loginRegister.css'

const { t } = useI18n()
const router = useRouter()

const langStore = useLangStore()
const lang = computed(() => langStore.lang)

const { getUserData } = useUserStore()

const baseStore = useBaseStore()
const { currentUrl } = storeToRefs(baseStore)

const showErrText = ref(false)
const errText = ref('Username taken')
const inputPasswordType = ref('password')
const agreedTermCondition = ref(false)
const agreedPrivacyPolicy = ref(false)
const isSubmitting = ref(false)

const registerInfo = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '1999-01-01',
})

const showPassword = ref(false)
watch(showPassword, (newVal) => {
  if (newVal) {
    inputPasswordType.value = 'text'
  } else {
    inputPasswordType.value = 'password'
  }
})

function redirectLogIn() {
  router.push({ name: 'login' })
}

async function register() {
  errText.value = ''
  showErrText.value = false
  isSubmitting.value = true

  // check empty field
  for (var key of Object.keys(registerInfo.value)) {
    if (registerInfo.value[key].trim() === '') {
      errText.value = t('hasEmptyField')
      showErrText.value = true
      isSubmitting.value = false
      return
    }
  }

  // check two passwords
  let password = registerInfo.value['password']
  let confirmPassword = registerInfo.value['confirmPassword']

  if (password !== confirmPassword) {
    errText.value = t('registerErrTwoPasswordNotMatch')
    showErrText.value = true
    isSubmitting.value = false
    return
  }

  // check agree term-condition and privacy policy
  if (!agreedTermCondition.value) {
    errText.value = t('registerErrAgreeTerm')
    showErrText.value = true
    isSubmitting.value = false
    return
  }
  if (!agreedPrivacyPolicy.value) {
    errText.value = t('registerErrAgreePrivacy')
    showErrText.value = true
    isSubmitting.value = false
    return
  }

  const infoVal = registerInfo.value
  const payload = {
    email: infoVal.email,
    username: infoVal.username,
    password: infoVal.password,
    confirm_password: infoVal.confirmPassword,
    agreed_term_condition: agreedTermCondition.value,
    agreed_privacy_policy: agreedPrivacyPolicy.value,
    date_of_birth: infoVal.dateOfBirth,
  }
  try {
    let res = await api.post('/users/register', payload)
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
        router.push({ name: 'login' })
      }
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Invalid email':
        errText.value = t('invalidEmail')
        break
      case 'Email exists':
        errText.value = t('registerErrEmailTaken')
        break
      case 'Username exists':
        errText.value = t('registerErrUsernameTaken')
        break
      case 'Username length is 20 characters at max':
        errText.value = t('registerErrUsernameTooLong')
        break
      case 'Password not strong':
        errText.value = t('registerErrPasswordNotStrong')
        break
      default:
        errText.value = t('registerErr')
    }
    showErrText.value = true
  }
  isSubmitting.value = false
}

const googleBtn = ref(null)

async function handleGoogleCredentialResponse(response) {
  isSubmitting.value = true
  showErrText.value = false
  errText.value = ''

  try {
    let res = await api.post('/users/signin-with-google', {
      id_token: response.credential,
    })

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
        router.push({ name: 'login' })
      }
    }
  } catch (_) {
    errText.value = 'Something went wrong, please try again.'
    showErrText.value = true
  }

  isSubmitting.value = false
}

// on enter key press
const handleEnter = (e) => e.key === 'Enter' && register()

onMounted(() => {
  window.addEventListener('keydown', handleEnter)

  window.google.accounts.id.initialize({
    client_id: '36909106385-3rcspt9lh9jtml83b10cbvfv2onqluh6.apps.googleusercontent.com',
    callback: handleGoogleCredentialResponse,
  })

  window.google.accounts.id.renderButton(
    googleBtn.value,
    { theme: 'outline', size: 'large', text: 'continue_with' }, // button style
  )
})
onUnmounted(() => window.removeEventListener('keydown', handleEnter))
</script>

<template>
  <div class="container">
    <n-card id="register-card">
      <h2 style="text-align: center">{{ t('register') }}</h2>

      <transition name="fade">
        <div v-if="showErrText" class="input" style="text-align: center">
          <n-tag type="error" size="large">{{ errText }}</n-tag>
        </div>
      </transition>

      <div>
        <!-- Container for the Google button -->
        <div ref="googleBtn" style="width: 100%"></div>

        <div class="input" style="text-align: center">
          <span>or</span>
        </div>

        <div class="input">
          <n-input
            type="text"
            :placeholder="t('email')"
            clearable
            v-model:value="registerInfo.email"
          />
        </div>
        <div class="input">
          <n-input
            type="text"
            :placeholder="t('username')"
            maxlength="20"
            show-count
            clearable
            v-model:value="registerInfo.username"
          />
        </div>
        <div class="input">
          <n-input-group>
            <n-input
              :type="inputPasswordType"
              :placeholder="t('password')"
              v-model:value="registerInfo.password"
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
        <div class="input">
          <n-input
            :type="inputPasswordType"
            :placeholder="t('confirmPassword')"
            v-model:value="registerInfo.confirmPassword"
          />
        </div>
        <div class="input">
          <n-date-picker
            v-model:formatted-value="registerInfo.dateOfBirth"
            value-format="yyyy-MM-dd"
            type="date"
          />
          <small v-if="lang == 'en'"> Year-month-day </small>
          <small v-else-if="lang == 'kh'"> ឆ្នាំ-ខែ-ថ្ងៃ </small>
        </div>
        <div class="input-text">
          <n-checkbox v-model:checked="agreedTermCondition">
            <a
              class="link-span"
              :href="`${staticSiteUrl}/termofservice-en/`"
              target="_blank"
              @click.stop
            >
              {{ t('agreeTermCondition') }}
            </a>
          </n-checkbox>
        </div>
        <div class="input-text">
          <n-checkbox v-model:checked="agreedPrivacyPolicy">
            <a
              class="link-span"
              target="_blank"
              @click.stop
              :href="`${staticSiteUrl}/privacypolicy-en/`"
            >
              {{ t('agreePrivacyPolicy') }}
            </a>
          </n-checkbox>
        </div>
        <div class="input-text">
          <span>
            {{ t('alreadyHasAccount') }}
            <span class="link-span" @click="redirectLogIn()">{{ t('login') }}</span>
          </span>
        </div>
        <div class="input" style="text-align: center">
          <n-button
            tertiary
            type="primary"
            @click="register()"
            :disabled="isSubmitting"
            :loading="isSubmitting"
          >
            {{ t('register') }}
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>
