import { ref, markRaw } from 'vue'
import { defineStore } from 'pinia'
import AgoraRTC from 'agora-rtc-sdk-ng'

export const useChatStore = defineStore('chatStore', () => {
  const openingRoom = ref(null)
  const rooms = ref([])
  const messages = ref([])

  return {
    openingRoom,
    rooms,
    messages
  }
})

export const useVoiceCallStore = defineStore('voiceCallStore', () => {
  // const appId = "f0ec4f9c13a14238b9a912b79cc406ba"
  const appId = "bb7651659ff940dd99e3e5fa5a41fa1e"
  const agoraClient = ref(null)
  const localAudioTrack = ref(null)
  const userUserUIDS = ref([])

  function setClient() {
    // vue reactivity interfer with agora object,
    // has to use markRaw to store raw object without reactivity
    agoraClient.value = markRaw(AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))
  }

  async function setLocalAudio() {
    try {
      localAudioTrack.value = markRaw(await AgoraRTC.createMicrophoneAudioTrack())
    } catch (e) {
      throw e
    }
  }

  async function cleanUpChannel() {
    try {
      if (localAudioTrack.value) {
        localAudioTrack.value.stop()
        localAudioTrack.value.close()
      }
      if (agoraClient.value) {
        await agoraClient.value.leave()
        agoraClient.value.removeAllListeners()
      }
    }
    catch (e) {
      throw e
    }
    agoraClient.value = null
    localAudioTrack.value = null
  }

  async function publishLocalAudio() {
    try {
      await agoraClient.value.publish([localAudioTrack.value])
    } catch (e) {
      throw e
    }
  }

  async function setupCallProcess() {
    try {
      agoraClient.value.on('user-published', async (user, mediaType) => {
        await agoraClient.value.subscribe(user, mediaType)
        if (mediaType === 'audio') user.audioTrack.play()
      })

      agoraClient.value.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') user.audioTrack.stop()
      })

      agoraClient.value.on('user-left', (user) => {
        if (user.audioTrack) {
          user.audioTrack.stop()
          user.audioTrack.removeAllListeners()
        }
      })

      await setLocalAudio()
      await publishLocalAudio()
    } catch (e) {
      throw e
    }
  }

  return {
    appId,
    agoraClient,
    cleanUpChannel,
    setClient,
    setLocalAudio,
    publishLocalAudio,
    setupCallProcess,
    userUserUIDS
  }
})
