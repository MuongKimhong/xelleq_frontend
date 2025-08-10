<script setup>
import { NTag } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user.js'
import { useBaseStore } from '../../stores/base.js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import api from '../../axios.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const baseStore = useBaseStore()

const showErrText = ref(false)
const errText = ref('')

const showSuccessText = ref(false)
const successText = ref(t('invitationAccept'))

function redirectServer(serverId) {
  const url = new URL(window.location.href)
  const origin = url.origin
  window.location.href = `${origin}/server/${serverId}`
}

async function acceptInvitation() {
  if (!user.value.authenticated) {
    baseStore.setCurrentUrl(window.location.href)
    router.push({ name: 'login' })
    return
  }

  let { id, server, token } = route.query

  if (!id || !server || !token) {
    showErrText.value = true
    errText.value = t('invitationLinkInvalid')
    return
  }

  try {
    let res = await api.post('/servers/accept-server-invitation', {
      invitation_id: id,
      server_id: server,
      token: token,
    })

    if (res.status === 200) {
      showSuccessText.value = true
      setTimeout(() => redirectServer(server), 2000)
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'User is already a member':
        redirectServer(server)
      case 'Fail to join server':
        errText.value = t('invitationAcceptFail')
        break
      default:
        errText.value = t('invitationLinkInvalid')
        break
    }
    showErrText.value = true
    return
  }
}

onMounted(async () => {
  await acceptInvitation()
})
</script>

<template>
  <div>
    <div v-if="showErrText" style="text-align: center; margin-top: 20px">
      <n-tag type="error" size="large">{{ errText }}</n-tag>
    </div>
    <div v-if="showSuccessText" style="text-align: center; margin-top: 20px">
      <n-tag type="success" size="large">{{ successText }}</n-tag>
    </div>
  </div>
</template>
