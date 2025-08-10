<script setup>
import { NModal, NCard, NButton, useMessage } from 'naive-ui'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../../axios.js'
import '../../../assets/base.css'

const { t } = useI18n()
const message = useMessage()

const props = defineProps({
  showOptionModal: Boolean,
  member: {
    type: Object,
    default: null,
  },
  serverData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'close-option-modal',
  'update-allow-post-flag',
  'member-kicked',
  'update-ban-flag',
  'promoted-to-admin',
  'promoted-to-moderator',
  'demoted-to-member',
])

const cardTitle = computed(() => props.member?.username)

const allowButtonType = computed(() => (props.member?.can_post_in_restrict ? 'warning' : 'primary'))
const allowButtonText = computed(() =>
  props.member?.can_post_in_restrict ? t('disallowMemberPost') : t('allowMemberPost'),
)
const submittingAllowOrDisallow = ref(false)

async function allowOrDisallowPost() {
  submittingAllowOrDisallow.value = true

  let currentFlag = props.member.can_post_in_restrict

  try {
    let res = await api.put('/servers/allow-disallow-post', {
      server_id: props.serverData.id,
      member_id: props.member.member_id,
      allow: !currentFlag,
    })

    if (res.status === 200) {
      emit('update-allow-post-flag', !currentFlag)
      submittingAllowOrDisallow.value = false
      message.success(t('updated'))
    }
  } catch (_) {
    message.error(t('allowDisallowFail'))
    submittingAllowOrDisallow.value = false
  }
}

const showKickConfirm = ref(false)
const submittingKick = ref(false)

async function kickMember() {
  submittingKick.value = true

  try {
    let res = await api.post('/servers/kick-member', {
      server_id: props.serverData.id,
      member_id: props.member.member_id,
    })

    if (res.status === 200) {
      emit('member-kicked')
      submittingKick.value = false
      showKickConfirm.value = false
      message.success(t('kicked'))
    }
  } catch (_) {
    message.error(t('kickFail'))
    submittingKick.value = false
  }
}

const banButtonType = computed(() => (props.member?.is_banned ? 'warning' : 'error'))
const banButtonText = computed(() => (props.member?.is_banned ? t('unBanMember') : t('banMember')))
const banning = ref(false)

async function banMember() {
  banning.value = true
  let currentFlag = props.member.is_banned

  try {
    let res = await api.put('/servers/ban-or-unban-server-member', {
      member_id: props.member.member_id,
      server_id: props.serverData.id,
      ban: !currentFlag,
    })

    if (res.status === 200) {
      emit('update-ban-flag', !currentFlag)
      banning.value = false
      message.success(t('updated'))
    }
  } catch (_) {
    banning.value = false
    message.error(t('banFail'))
  }
  return
}

const showPromoteAdminConfirm = ref(false)
const promotingAdmin = ref(false)

async function promoteToAdmin() {
  promotingAdmin.value = true

  try {
    let res = await api.put('/servers/promote-member-to-admin-role', {
      server_id: props.serverData.id,
      member_id: props.member.member_id,
    })

    if (res.status === 200) {
      emit('promoted-to-admin', res.data) // res.data = old admin's new role
      message.success(t('promoted'))
    }
  } catch (_) {
    message.error(t('promoteFail'))
  }
  promotingAdmin.value = false
  showPromoteAdminConfirm.value = false
  return
}

const showPromoteModeratorConfirm = ref(false)
const promotingOrDemotingModerator = ref(false)
const showPromoteModeratorButton = computed(() => {
  if (
    props.serverData?.isAdmin &&
    props.member?.role === 'member' &&
    props.serverData?.moderators < 2
  ) {
    return true
  } else {
    return false
  }
})

async function promoteToModerator() {
  promotingOrDemotingModerator.value = true

  try {
    let res = await api.put('/servers/promote-member-to-moderator-role', {
      server_id: props.serverData.id,
      member_id: props.member.member_id,
    })

    if (res.status === 200) {
      emit('promoted-to-moderator')
      message.success(t('promoted'))
    }
  } catch (_) {
    message.error(t('promoteFail'))
  }
  promotingOrDemotingModerator.value = false
  showPromoteModeratorConfirm.value = false
  return
}

const showDemoteModeratorConfirm = ref(false)
const showDemoteModeratorButton = computed(() => {
  if (
    props.serverData?.isAdmin &&
    props.member?.role === 'moderator' &&
    props.serverData?.moderators > 0
  ) {
    return true
  } else {
    return false
  }
})

async function demoteFromModerator() {
  promotingOrDemotingModerator.value = true

  try {
    let res = await api.put('/servers/demote-moderator-to-member-role', {
      server_id: props.serverData.id,
      member_id: props.member.member_id,
    })

    if (res.status === 200) {
      emit('demoted-to-member')
      message.success(t('demoted'))
    }
  } catch (_) {
    message.error(t('demoteFail'))
  }
  promotingOrDemotingModerator.value = false
  showDemoteModeratorConfirm.value = false
  return
}
</script>

<template>
  <n-modal :show="showOptionModal" :mask-closable="false">
    <n-card
      aria-modal="true"
      style="max-width: 350px; max-height: 380px; height: 380px; overflow-y: auto"
      :content-style="{ padding: '10px' }"
      :title="cardTitle"
      closable
      @close="$emit('close-option-modal')"
    >
      <div v-if="member && serverData">
        <div v-if="serverData.restrict">
          <n-button
            tertiary
            :type="allowButtonType"
            class="option-btn"
            :loading="submittingAllowOrDisallow"
            :disabled="submittingAllowOrDisallow"
            @click="allowOrDisallowPost()"
          >
            {{ allowButtonText }}
          </n-button>
        </div>

        <div v-if="serverData.isAdmin" class="mt-4">
          <div
            v-if="showPromoteAdminConfirm"
            style="display: flex; justify-content: center; gap: 10px"
          >
            <n-button tertiary class="kick-confirm-btn" @click="showPromoteAdminConfirm = false">
              {{ t('cancel') }}
            </n-button>
            <n-button tertiary type="primary" class="kick-confirm-btn" @click="promoteToAdmin()">
              {{ t('promoteToAdmin') }}
            </n-button>
          </div>
          <n-button
            v-else
            tertiary
            type="primary"
            class="option-btn"
            @click="showPromoteAdminConfirm = true"
          >
            {{ t('promoteToAdminRole') }}
          </n-button>
        </div>

        <div v-if="showPromoteModeratorButton" class="mt-4">
          <div
            v-if="showPromoteModeratorConfirm"
            style="display: flex; justify-content: center; gap: 10px"
          >
            <n-button tertiary style="width: 30%" @click="showPromoteModeratorConfirm = false">
              {{ t('cancel') }}
            </n-button>
            <n-button tertiary type="primary" style="width: 60%" @click="promoteToModerator()">
              {{ t('promoteToModerator') }}
            </n-button>
          </div>
          <n-button
            v-else
            tertiary
            type="primary"
            class="option-btn"
            @click="showPromoteModeratorConfirm = true"
          >
            {{ t('promoteToModeratorRole') }}
          </n-button>
        </div>

        <div v-if="showDemoteModeratorButton" class="mt-4">
          <div
            v-if="showDemoteModeratorConfirm"
            style="display: flex; justify-content: center; gap: 10px"
          >
            <n-button tertiary style="width: 30%" @click="showDemoteModeratorConfirm = false">
              {{ t('cancel') }}
            </n-button>
            <n-button tertiary type="primary" style="width: 60%" @click="demoteFromModerator()">
              {{ t('demoteToMember') }}
            </n-button>
          </div>
          <n-button
            v-else
            tertiary
            type="primary"
            class="option-btn"
            @click="showDemoteModeratorConfirm = true"
          >
            {{ t('demoteToMemberRole') }}
          </n-button>
        </div>

        <div class="mt-4">
          <div v-if="showKickConfirm" style="display: flex; justify-content: center; gap: 10px">
            <n-button tertiary class="kick-confirm-btn" @click="showKickConfirm = false">
              {{ t('cancel') }}
            </n-button>
            <n-button tertiary type="error" class="kick-confirm-btn" @click="kickMember()">
              {{ t('kick') }}
            </n-button>
          </div>
          <n-button v-else tertiary type="error" class="option-btn" @click="showKickConfirm = true">
            {{ t('kickMember') }}
          </n-button>
        </div>

        <div v-if="serverData.isAdmin" class="mt-4">
          <n-button
            tertiary
            :type="banButtonType"
            class="option-btn"
            :disabled="banning"
            :loading="banning"
            @click="banMember()"
          >
            {{ banButtonText }}
          </n-button>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<style scoped>
.option-btn {
  width: 100%;
}
.kick-confirm-btn {
  width: 45%;
}
</style>
