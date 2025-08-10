<script setup>
import { NCard, NModal, NInput, NTable, NSkeleton, NButton, useMessage } from 'naive-ui'
import debounce from 'lodash/debounce'
import { useServerStore } from '../../../stores/server.js'
import { useBreakpoint } from '../../../breakpoint.js'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '../../../axios.js'

import '../../../assets/styles/server.css'
import '../../../assets/base.css'

const { isBreakPointMdAndUp } = useBreakpoint()
const message = useMessage()
const { t } = useI18n()

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const showModal = ref(false)
const searching = ref(false)
const searchText = ref('')
const users = ref([])

async function searchUser() {
  searching.value = true

  if (searchText.value.trim() === '') {
    users.value.length = 0
    searching.value = false
    return
  }

  try {
    let res = await api.get('/servers/search-user-for-invitation', {
      params: {
        search: searchText.value,
        server_id: serverData.value.id,
      },
    })

    if (res.status === 200) {
      users.value = res.data['results']
      searching.value = false
    }
  } catch (_) {
    searching.value = false
  }
}
const debouncedSearch = debounce(searchUser, 350)

const inviting = ref(false)
const invitingUserIndex = ref(new Set())

function removeInvitingUser(index) {
  invitingUserIndex.value.delete(index)
}

async function inviteUser(userId, index) {
  inviting.value = true
  invitingUserIndex.value.add(index)

  try {
    let res = await api.post('/servers/invite-user-to-join-server', {
      user_id: userId,
      server_id: serverData.value.id,
    })

    if (res.status === 200) {
      users.value[index]['invited'] = true
      inviting.value = false
      message.success(t('invitationSent'))
      removeInvitingUser(index)
      return
    }
  } catch (_) {
    inviting.value = false
    removeInvitingUser(index)
    message.error(t('inviteFail'))
  }
}
</script>

<template>
  <div v-if="isBreakPointMdAndUp">
    <n-button type="primary" @click="showModal = true">{{ t('addMember') }}</n-button>
  </div>
  <div v-else class="mt-2 mb-4 align-right">
    <n-button type="primary" @click="showModal = true">{{ t('addMember') }}</n-button>
  </div>

  <n-modal v-model:show="showModal" auto-focus :mask-closable="false">
    <n-card
      aria-modal="true"
      style="max-width: 600px; max-height: 600px; height: 600px; overflow-y: auto"
      :content-style="{ padding: '10px' }"
      :title="t('addMember')"
      closable
      @close="showModal = false"
    >
      <n-input
        v-model:value="searchText"
        :placeholder="t('addUserSearchPlaceholder')"
        :disabled="inviting"
        @input="debouncedSearch"
      ></n-input>

      <div class="mt-4 mb-4" style="overflow-x: auto; max-width: 100%">
        <n-table :bordered="true" :single-line="false">
          <colgroup>
            <col style="width: 100%" />
            <col style="width: 90px" />
          </colgroup>
          <thead>
            <tr>
              <th>{{ t('username') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody v-if="searching">
            <tr>
              <td><n-skeleton text style="width: 100%; height: 22px" /></td>
              <td>
                <n-skeleton text style="width: 100%; height: 22px" />
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="(user, index) in users" :key="index">
              <td>{{ user.username }}</td>
              <td style="text-align: center">
                <n-button v-if="user.invited" disabled>{{ t('invited') }}</n-button>
                <n-button v-else-if="user.is_member" disabled>{{ t('member') }}</n-button>
                <n-button
                  v-else
                  type="primary"
                  @click="inviteUser(user.user_id, index)"
                  :disabled="inviting && invitingUserIndex.has(index)"
                  :loading="inviting && invitingUserIndex.has(index)"
                >
                  {{ t('invite') }}
                </n-button>
              </td>
            </tr>
          </tbody>
        </n-table>
      </div>
    </n-card>
  </n-modal>
</template>

<style scoped>
.align-right {
  text-align: right;
}
</style>
