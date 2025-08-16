<script setup>
import { NInputGroup, NInput, NSwitch, NCard, NButton, NPopover, useMessage } from 'naive-ui'
import { useUserStore } from '../../stores/user.js'
import { useBreakpoint } from '../../breakpoint.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref, watch, onMounted } from 'vue'
import api from '../../axios.js'

// local components
import EmailVerify from '../../components/account_settings/EmailVerify.vue'
import UpdateProfilePhoto from '../../components/account_settings/UpdateProfilePhoto.vue'
import ChangePassword from '../../components/account_settings/ChangePassword.vue'

import '../../assets/styles/loginRegister.css'
import '../../assets/base.css'

const { isBreakPointSmOrXs, isBreakPointMdAndUp, isBreakPointSmAndUp } = useBreakpoint()
const { t } = useI18n()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const message = useMessage()
const router = useRouter()

// username
const isSubmittingUsername = ref(false)
const currentUsername = ref(user.value.username)
const usernameSaveBtnDisabled = ref(true)

function onUsernameChange() {
  usernameSaveBtnDisabled.value = true

  if (
    currentUsername.value !== user.value.username &&
    currentUsername.value.trim() !== '' &&
    currentUsername.value.length <= 20
  ) {
    usernameSaveBtnDisabled.value = false
  }
}

function onUsernameInputBlur() {
  if (currentUsername.value.trim() === '') {
    currentUsername.value = user.value.username
  }
}

async function saveUsername() {
  isSubmittingUsername.value = true

  try {
    let res = await api.put('/users/update-username', { username: currentUsername.value })

    if (res.status === 200) {
      isSubmittingUsername.value = false
      user.value.username = currentUsername.value
      usernameSaveBtnDisabled.value = true
      message.success(t('usernameSaveSuccess'))
      return
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Username exists':
        message.error(t('registerErrUsernameTaken'))
        break
      default:
        message.error(t('failSaveUsername'))
        break
    }
    usernameSaveBtnDisabled.value = false
    isSubmittingUsername.value = false
    return
  }
}

// description
const currentDescription = ref(user.value.description)
const descriptionSaveBtnDisabled = ref(true)
const isSubmittingDescription = ref(false)

function onDescriptionChange() {
  descriptionSaveBtnDisabled.value = true

  if (currentDescription.value !== null && currentDescription.value !== user.value.description) {
    descriptionSaveBtnDisabled.value = false
  }
}

async function saveDescription() {
  isSubmittingDescription.value = true

  const payload = {
    description: currentDescription.value,
  }
  try {
    let res = await api.put('/users/update-description', payload)

    if (res.status === 200) {
      isSubmittingDescription.value = false
      descriptionSaveBtnDisabled.value = true
      user.value.description = currentDescription.value
      message.success(t('descriptionSaveSuccess'))
      return
    }
  } catch (_) {
    isSubmittingDescription.value = false
    message.error(t('descriptionSaveFail'))
  }
}

// privacy
const currentPublicStatus = ref(user.value.public)
const isSubmittingPublicStatus = ref(false)

async function togglePrivacyPublicStatus() {
  isSubmittingPublicStatus.value = true

  try {
    let res = await api.put('/users/update-public-status', { public: !currentPublicStatus.value })

    if (res.status === 200) {
      currentPublicStatus.value = !currentPublicStatus.value
      user.value.public = currentPublicStatus.value

      if (currentPublicStatus.value) {
        message.success(t('switchToPublicSuccess'))
      } else {
        message.success(t('switchToPrivateSuccess'))
      }
      isSubmittingPublicStatus.value = false
      return
    }
  } catch (_) {
    isSubmittingPublicStatus.value = false
    message.error(t('switchPrivacyFail'))
    return
  }
}

// email notification
const currentReceiveEmailNotification = ref(user.value.receiveEmailNotification)
const isSubmittingEmailNotification = ref(false)

async function toggleReceiveEmailNotification() {
  isSubmittingEmailNotification.value = true

  try {
    let res = await api.put('/users/toggle-receive-email-notification', {
      can_receive: !currentReceiveEmailNotification.value,
    })

    if (res.status === 200) {
      currentReceiveEmailNotification.value = !currentReceiveEmailNotification.value
      user.value.receiveEmailNotification = currentReceiveEmailNotification.value

      if (currentReceiveEmailNotification.value) {
        message.success(t('switchReceiveSuccess'))
      } else {
        message.success(t('switchNoReceiveSuccess'))
      }

      isSubmittingEmailNotification.value = false
      return
    }
  } catch (_) {
    isSubmittingEmailNotification.value = false
    message.error(t('switchEmailNotificationFail'))
    return
  }
}
</script>

<template>
  <div id="acc-settings-container">
    <div>
      <div class="input">
        <EmailVerify />
      </div>
    </div>
    <div class="input">
      <UpdateProfilePhoto />
    </div>

    <n-card :class="{ 'info-card-sm-xs': isBreakPointSmOrXs, 'info-card': isBreakPointMdAndUp }">
      <h2 style="text-align: center">{{ t('accountSetting') }}</h2>

      <div>
        <span class="info-title">{{ t('username') }}</span>
        <hr class="underline" />
        <n-input-group>
          <n-input
            :placeholder="t('username')"
            maxlength="20"
            show-count
            v-model:value="currentUsername"
            @input="onUsernameChange"
            @blur="onUsernameInputBlur"
          ></n-input>
          <n-button
            :disabled="usernameSaveBtnDisabled"
            @click="saveUsername()"
            :loading="isSubmittingUsername"
          >
            {{ t('save') }}
          </n-button>
        </n-input-group>
      </div>

      <div class="mt-4">
        <span class="info-title">{{ t('description') }}</span>
        <hr class="underline" />
        <n-input-group>
          <n-input
            :placeholder="t('description')"
            maxlength="30"
            show-count
            v-model:value="currentDescription"
            @input="onDescriptionChange"
          ></n-input>
          <n-button
            :disabled="descriptionSaveBtnDisabled"
            @click="saveDescription()"
            :loading="isSubmittingDescription"
          >
            {{ t('save') }}
          </n-button>
        </n-input-group>
      </div>

      <div class="mt-4">
        <span class="info-title">{{ t('privacy') }}</span>
        <hr class="underline" />
        <div class="info-row">
          <span>{{ t('makeAccPublic') }}</span>
          <n-switch
            :rubber-band="false"
            :value="currentPublicStatus"
            :loading="isSubmittingPublicStatus"
            :disabled="isSubmittingPublicStatus"
            @update:value="togglePrivacyPublicStatus()"
          ></n-switch>
        </div>
      </div>

      <div class="mt-4">
        <span class="info-title">{{ t('emailNotification') }}</span>
        <hr class="underline" />
        <div class="info-row">
          <span>{{ t('receiveNotificationViaEmail') }}</span>
          <n-switch
            :rubber-band="false"
            :value="currentReceiveEmailNotification"
            :loading="isSubmittingEmailNotification"
            :disabled="isSubmittingEmailNotification"
            @update:value="toggleReceiveEmailNotification()"
          ></n-switch>
        </div>
      </div>

      <div class="mt-4">
        <span class="info-title">{{ t('changePassword') }}</span>
        <hr class="underline" />
        <ChangePassword />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
#acc-settings-container {
  justify-content: center;
  align-content: center;
  margin-bottom: 30px;
}
.info-card-sm-xs {
  max-width: 400px;
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
}
.info-card {
  width: 450px;
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
}
.info-row {
  display: flex;
  justify-content: space-between;
}
.info-title {
  font-size: 20px;
}
</style>
