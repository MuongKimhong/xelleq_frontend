<script setup>
import { NInputGroup, NInput, NSwitch, NCard, NButton, useMessage } from 'naive-ui'
import { useServerStore } from '../../../stores/server.js'
import { useBreakpoint } from '../../../breakpoint.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted, onActivated } from 'vue'
import api from '../../../axios.js'

import UpdateServerProfile from './UpdateServerProfile.vue'

import '../../../assets/styles/server.css'
import '../../../assets/base.css'

const { isBreakPointSmOrXs, isBreakPointMdAndUp, isBreakPointSmAndUp } = useBreakpoint()
const { t } = useI18n()

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const message = useMessage()
const router = useRouter()

// sever type
const serverOptions = [
  {
    label: t('typePublic'),
    value: 'Public',
  },
  {
    label: t('typePublicRestrict'),
    value: 'Public & Restrict',
  },
  {
    label: t('typePrivate'),
    value: 'Private',
  },
]
const currentServerType = ref(null) // used as v-model
const serverType = ref(null) // use to store before-change value
const typeSaveBtnDisabled = ref(true)
const isSubmittingServerType = ref(false)

if (serverData.value.public && serverData.value.restrict) {
  currentServerType.value = 'Public & Restrict'
  serverType.value = 'Public & Restrict'
} else if (serverData.value.public && !serverData.value.restrict) {
  currentServerType.value = 'Public'
  serverType.value = 'Public'
} else {
  currentServerType.value = 'Private'
  serverType.value = 'Private'
}

function onServerTypeInputChange() {
  typeSaveBtnDisabled.value = true

  if (currentServerType.value != serverType.value) {
    typeSaveBtnDisabled.value = false
  }
}

// async function saveServerType() {
//   isSubmittingServerType.value = true

//   const payload = {
//     server_id: serverData.value.id,
//   }
//   switch (currentServerType.value.trim()) {
//     case 'Private':
//       payload['public'] = false
//       payload['restrict'] = false
//       break
//     case 'Public & Restrict':
//       payload['public'] = true
//       payload['restrict'] = true
//       break
//     case 'Public':
//       payload['public'] = true
//       payload['restrict'] = false
//       break
//   }

//   try {
//     let res = await api.put('/servers/update-server-public-status', payload)

//     if (res.status === 200) {
//       serverData.value.public = payload['public']
//       serverData.value.restrict = payload['restrict']
//       serverType.value = currentServerType.value
//       serverStore.updateJoinedServerType(payload['server_id'], payload['public'])
//       isSubmittingServerType.value = false
//       typeSaveBtnDisabled.value = true
//       message.success(t('saveServerTypeSuccess'))
//       return
//     }
//   } catch (_) {
//     isSubmittingServerType.value = false
//     typeSaveBtnDisabled.value = false
//     message.error(t('saveServerTypeFail'))
//     return
//   }
// }

// server name
const isSubmittingName = ref(false)
const currentName = ref(serverData.value.name)
const nameSaveBtnDisabled = ref(true)

function onNameChange() {
  nameSaveBtnDisabled.value = true

  if (
    currentName.value !== serverData.value.name &&
    currentName.value.trim() !== '' &&
    currentName.value.length <= 35
  ) {
    nameSaveBtnDisabled.value = false
  }
}

function onNameInputBlur() {
  if (currentName.value.trim() === '') {
    currentName.value = serverData.value.name
  }
}

async function saveName() {
  isSubmittingName.value = true

  const payload = {
    new_name: currentName.value,
    server_id: serverData.value.id,
  }
  try {
    let res = await api.put('/servers/update-server-name', payload)

    if (res.status === 200) {
      serverData.value.name = currentName.value
      isSubmittingName.value = false
      nameSaveBtnDisabled.value = true
      message.success(t('saveServerNameSuccess'))
      serverStore.updateJoinedServerName(serverData.value.id, currentName.value)
      return
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Server name exists':
        message.error(t('serverNameTaken'))
        break
      case 'Server name length':
        message.error(t('serverNameLength'))
        break
    }
    isSubmittingName.value = false
    nameSaveBtnDisabled.value = false
    return
  }
}

// server description
const isSubmittingDescription = ref(false)
const currentDescription = ref(serverData.value.description)
const descriptionSaveBtnDisabled = ref(true)

function onDescriptionChange() {
  descriptionSaveBtnDisabled.value = true

  if (currentDescription.value != serverData.value.description) {
    descriptionSaveBtnDisabled.value = false
  }
}

async function saveDescription() {
  isSubmittingDescription.value = true

  try {
    let res = await api.put('/servers/update-server-description', {
      description: currentDescription.value,
      server_id: serverData.value.id,
    })

    if (res.status === 200) {
      serverData.value.description = currentDescription.value
      isSubmittingDescription.value = false
      descriptionSaveBtnDisabled.value = true
      message.success(t('saveServerDescriptionSuccess'))
      return
    }
  } catch (_) {
    message.error(t('saveServerDescriptionFail'))
    isSubmittingDescription.value = false
    descriptionSaveBtnDisabled.value = false
    return
  }
}

// server rules description
const isSubmittingRules = ref(false)
const currentRules = ref(serverData.value.rules)
const rulesSaveBtnDisabled = ref(true)

function onRulesChange() {
  rulesSaveBtnDisabled.value = true

  if (currentRules.value != serverData.value.rules) {
    rulesSaveBtnDisabled.value = false
  }
}

async function saveRules() {
  isSubmittingRules.value = true

  try {
    let res = await api.put('/servers/update-server-rules-description', {
      description: currentRules.value,
      server_id: serverData.value.id,
    })

    if (res.status === 200) {
      serverData.value.rules = currentRules.value
      isSubmittingRules.value = false
      rulesSaveBtnDisabled.value = true
      message.success(t('saveServerRulesSuccess'))
      return
    }
  } catch (_) {
    message.error(t('saveServerRulesFail'))
    isSubmittingRules.value = false
    rulesSaveBtnDisabled.value = false
    return
  }
}

// posts need approval status
const currentApproval = ref(serverData.value.postsNeedApproval)
const isSubmittingApproval = ref(false)
const approvalSaveBtnDisabled = ref(true)

async function saveApprovalStatus() {
  isSubmittingApproval.value = true
  currentApproval.value = !currentApproval.value

  try {
    let res = await api.put('/servers/update-server-need-approval-flag', {
      need_approval: currentApproval.value,
      server_id: serverData.value.id,
    })

    if (res.status === 200) {
      serverData.value.postsNeedApproval = currentApproval.value
      isSubmittingApproval.value = false
      approvalSaveBtnDisabled.value = true
      message.success(t('saveServerApprovalStatusSuccess'))
      return
    }
  } catch (_) {
    message.error(t('saveServerApprovalStatusFail'))
    isSubmittingApproval.value = false
    approvalSaveBtnDisabled.value = false
  }
}
</script>

<template>
  <div
    v-if="serverData.isAdmin"
    id="server-settings-container"
    class="mt-2 tab-content settings-tab-container"
  >
    <div>
      <UpdateServerProfile />
    </div>

    <n-card :class="{ 'info-card-sm-xs': isBreakPointSmOrXs, 'info-card': isBreakPointMdAndUp }">
      <div>
        <span class="info-title">{{ t('serverName') }}</span>
        <hr class="underline" />
        <n-input-group>
          <n-input
            v-model:value="currentName"
            :placeholder="t('serverName')"
            maxlength="30"
            show-count
            @input="onNameChange"
            @blur="onNameInputBlur"
          ></n-input>
          <n-button :disabled="nameSaveBtnDisabled" :loading="isSubmittingName" @click="saveName()">
            {{ t('save') }}
          </n-button>
        </n-input-group>
      </div>

      <div class="mt-4">
        <span class="info-title">{{ t('serverDescription') }}</span>
        <hr class="underline" />
        <n-input-group>
          <n-input
            v-model:value="currentDescription"
            :placeholder="t('serverDescription')"
            size="large"
            type="textarea"
            maxlength="200"
            :autosize="{
              minRows: 5,
              maxRows: 8,
            }"
            @input="onDescriptionChange"
            show-count
          />
        </n-input-group>
        <div style="text-align: right" class="mt-2">
          <n-button
            :disabled="descriptionSaveBtnDisabled"
            :loading="isSubmittingDescription"
            @click="saveDescription()"
          >
            {{ t('save') }}
          </n-button>
        </div>
      </div>

      <div class="mt-4">
        <span class="info-title">{{ t('serverRules') }}</span>
        <hr class="underline" />
        <n-input-group>
          <n-input
            v-model:value="currentRules"
            :placeholder="t('serverRules')"
            size="large"
            type="textarea"
            maxlength="600"
            :autosize="{
              minRows: 5,
              maxRows: 15,
            }"
            show-count
            @input="onRulesChange"
          />
        </n-input-group>
        <div style="text-align: right" class="mt-2">
          <n-button
            :disabled="rulesSaveBtnDisabled"
            :loading="isSubmittingRules"
            @click="saveRules()"
          >
            {{ t('save') }}
          </n-button>
        </div>
      </div>

      <!-- <div class="mt-4">
        <span class="info-title">{{ t('serverType') }}</span>
        <hr class="underline" />
        <n-select
          :placeholder="t('serverType')"
          v-model:value="currentServerType"
          :options="serverOptions"
          @update:value="onServerTypeInputChange"
        />
        <div style="text-align: right" class="mt-3">
          <n-button
            :disabled="typeSaveBtnDisabled"
            :loading="isSubmittingServerType"
            @click="saveServerType()"
          >
            {{ t('save') }}
          </n-button>
        </div>
      </div> -->

      <div class="mt-4">
        <span class="info-title">Post approval</span>
        <hr class="underline" />
        <div class="info-row">
          <span>{{ t('postsNeedApproval') }}</span>
          <n-switch
            :rubber-band="false"
            :value="currentApproval"
            :loading="isSubmittingApproval"
            :disabled="isSubmittingApproval"
            @update:value="saveApprovalStatus()"
          ></n-switch>
        </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
#server-settings-container {
  padding-top: 25px;
  padding-bottom: 55px;
}
.info-card-sm-xs {
  max-width: 400px;
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 15px;
}
.info-card {
  width: 450px;
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 15px;
}
.info-row {
  display: flex;
  justify-content: space-between;
}
.info-title {
  font-size: 20px;
}
</style>
