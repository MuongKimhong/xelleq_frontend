<script setup>
import { NCard, NInput, NIcon, NTable, NSkeleton, NButton, NTag } from 'naive-ui'
import { ArrowRight, ArrowLeft } from '@vicons/fa'
import { DotsVertical } from '@vicons/tabler'
import debounce from 'lodash/debounce'
import { useServerStore, useServerMemberStore } from '../../../stores/server.js'
import { useUserStore } from '../../../stores/user.js'
import { useBreakpoint } from '../../../breakpoint.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import api from '../../../axios.js'

import AddMember from './AddMember.vue'
import MemberOptionModal from './MemberOptionModal.vue'
import '../../../assets/styles/server.css'
import '../../../assets/base.css'

const { isBreakPointMdAndUp } = useBreakpoint()
const { t } = useI18n()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)

const memberStore = useServerMemberStore()
const { members } = storeToRefs(memberStore)

const loadingMembers = ref(true)
const loadMemberErr = ref(false)
const loadingSkeletonRow = ref(1)
const paginationPage = ref(0) // sea-orm use 0-based
const totalPages = ref(0)
const searchExistingMemberText = ref('')

async function getAllMembers() {
  loadingMembers.value = true
  loadMemberErr.value = false

  try {
    let res = await api.get('/servers/get-server-members', {
      params: {
        server_id: serverData.value.id,
        page: paginationPage.value,
      },
    })

    if (res.status === 200) {
      memberStore.setMembers(res.data.members)
      totalPages.value = res.data.total_pages
      loadingSkeletonRow.value = res.data.members.length
      loadingMembers.value = false
    }
  } catch (_) {
    loadMemberErr.value = true
  }
}

async function onNextButtonPress() {
  if (paginationPage.value >= totalPages.value) {
    return
  }
  paginationPage.value += 1

  if (searchExistingMemberText.value.trim() !== '') {
    await searchExistingMember()
  } else {
    await getAllMembers()
  }
}

async function onBackButtonPress() {
  if (paginationPage.value <= 0) {
    return
  }
  paginationPage.value -= 1

  if (searchExistingMemberText.value.trim() !== '') {
    await searchExistingMember()
  } else {
    await getAllMembers()
  }
}
async function searchExistingMember() {
  loadingMembers.value = true
  loadMemberErr.value = false

  if (searchExistingMemberText.value.trim() === '') {
    await getAllMembers()
    return
  }

  try {
    let res = await api.get('/servers/search-existing-member', {
      params: {
        server_id: serverData.value.id,
        page: paginationPage.value,
        text: searchExistingMemberText.value,
      },
    })

    if (res.status === 200) {
      memberStore.setMembers(res.data.members)
      totalPages.value = res.data.total_pages
      loadingSkeletonRow.value = res.data.members.length
      loadingMembers.value = false
    }
  } catch (_) {
    loadMemberErr.value = true
  }
}
const debouncedSearch = debounce(searchExistingMember, 200)

const showOptionModal = ref(false)
const chosenMember = ref(null)
const chosenMemberIndex = ref(null)

function onMemberButtonPress(member, index) {
  showOptionModal.value = true
  chosenMember.value = member
  chosenMemberIndex.value = index
}

function handleCloseMemberOptionModal() {
  showOptionModal.value = false
  chosenMember.value = null
  chosenMemberIndex.value = null
}

function updateMemberAllowPostFlag(newFlag) {
  members.value[chosenMemberIndex.value]['can_post_in_restrict'] = newFlag
}

function updateMemberBanFlag(newFlag) {
  members.value[chosenMemberIndex.value]['is_banned'] = newFlag
}

function handlePromotedToAdmin(currentAdminNewRole) {
  // update current admin role
  const currentAdminIndex = members.value.findIndex((member) => member.role === 'admin')
  members.value[currentAdminIndex]['role'] = currentAdminNewRole
  serverData.value.isAdmin = false

  if (currentAdminNewRole === 'moderator') {
    serverData.value.isModerator = true
  } else {
    serverData.value.isModerator = false
  }

  members.value[chosenMemberIndex.value]['role'] = 'admin'
  handleCloseMemberOptionModal()
}

function handlePromotedToModerator() {
  members.value[chosenMemberIndex.value]['role'] = 'moderator'
  serverData.value.moderators += 1
}

function handleDemotedToMember() {
  members.value[chosenMemberIndex.value]['role'] = 'member'
  serverData.value.moderators -= 1
}

function handleMemberKicked() {
  members.value.splice(chosenMemberIndex.value, 1)
  handleCloseMemberOptionModal()
  serverData.value.totalMembers -= 1
  serverData.value.moderators -= 1
}

onMounted(async () => {
  await getAllMembers()
})
</script>

<template>
  <div v-if="serverData.isMember" class="mt-2 tab-content members-tab-container">
    <span style="font-size: 22px; padding: 2px 0px">
      {{ serverData.totalMembers }} Member<span v-if="serverData.totalMembers > 1">s</span>
    </span>
    <div v-if="loadMemberErr" style="text-align: center">
      <n-tag type="error">Failed to load members, please try again!</n-tag>
    </div>

    <MemberOptionModal
      :show-option-modal="showOptionModal"
      :member="chosenMember"
      :server-data="serverData"
      @close-option-modal="handleCloseMemberOptionModal"
      @update-allow-post-flag="updateMemberAllowPostFlag"
      @member-kicked="handleMemberKicked"
      @update-ban-flag="updateMemberBanFlag"
      @promoted-to-admin="handlePromotedToAdmin"
      @promoted-to-moderator="handlePromotedToModerator"
      @demoted-to-member="handleDemotedToMember"
    />

    <div
      v-if="isBreakPointMdAndUp"
      class="mt-2 mb-2"
      style="display: flex; align-items: center; gap: 8px"
    >
      <n-input
        v-model:value="searchExistingMemberText"
        :placeholder="t('searchMember')"
        @input="debouncedSearch"
      ></n-input>
      <AddMember />
    </div>
    <div v-else class="mt-2 mb-2">
      <AddMember />
      <n-input
        v-model:value="searchExistingMemberText"
        :placeholder="t('searchMember')"
        @input="debouncedSearch"
      ></n-input>
    </div>

    <div class="mt-4 mb-4" style="overflow-x: auto; max-width: 100%">
      <n-table :bordered="true" :single-line="false">
        <colgroup>
          <col style="width: 400px" />
          <col v-if="serverData.isAdmin || serverData.isModerator" style="width: 60px" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th v-if="serverData.isAdmin || serverData.isModerator"></th>
          </tr>
        </thead>
        <tbody v-if="loadingMembers">
          <tr v-for="i in loadingSkeletonRow" :key="i">
            <td><n-skeleton text style="width: 100%; height: 22px" /></td>
            <td
              v-if="serverData.isAdmin || serverData.isModerator"
              style="width: 60px; text-align: center; padding: 4px"
            >
              <n-button tertiary size="small" type="primary" disabled>
                <n-icon>
                  <DotsVertical />
                </n-icon>
              </n-button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="(member, index) in members" :key="index">
            <td>
              <span v-if="user.id === member.user_id" style="color: #2080f0">{{
                member.username
              }}</span>
              <span v-else>{{ member.username }}</span>
              <n-tag type="primary" class="ml-2" size="small">{{ member.role }}</n-tag>
              <n-tag
                v-if="serverData.restrict && member.can_post_in_restrict"
                type="success"
                class="ml-2"
                size="small"
              >
                Allow
              </n-tag>
              <n-tag
                v-else-if="serverData.restrict && !member.can_post_in_restrict"
                type="warning"
                class="ml-2"
                size="small"
              >
                Not Allow
              </n-tag>
              <n-tag v-if="member.is_banned" type="error" class="ml-2" size="small"> Banned </n-tag>
            </td>
            <td
              v-if="serverData.isAdmin || serverData.isModerator"
              style="width: 60px; text-align: center; padding: 4px"
            >
              <n-button
                v-if="user.id != member.user_id && (serverData.isAdmin || member.role === 'member')"
                tertiary
                size="small"
                type="primary"
                @click="onMemberButtonPress(member, index)"
              >
                <n-icon>
                  <DotsVertical />
                </n-icon>
              </n-button>
            </td>
          </tr>
        </tbody>
      </n-table>
    </div>

    <div
      class="mt-4 mb-4"
      style="display: flex; justify-content: center; align-items: center; gap: 8px"
    >
      <n-button :disabled="paginationPage <= 0" @click="onBackButtonPress()">
        <n-icon class="mr-2"><ArrowLeft /></n-icon> Back
      </n-button>
      <span class="ml-4 mr-4">{{ paginationPage + 1 }}</span>
      <n-button :disabled="paginationPage + 1 >= totalPages" @click="onNextButtonPress()">
        Next <n-icon class="ml-2"><ArrowRight /></n-icon>
      </n-button>
    </div>
  </div>
</template>
