import { ref, markRaw } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import AgoraRTC from 'agora-rtc-sdk-ng'

export const useChatStore = defineStore('chatStore', () => {
  const openingRoom = ref(null)
  const rooms = ref([])
  const messages = ref([])
  const pinnedMessage = ref(null)

  return {
    openingRoom,
    rooms,
    messages,
    pinnedMessage
  }
})

export const useAudioDeviceStore = defineStore("audioDeviceStore", () => {
  const selectedMicrophone = ref(null) // deviceId

  return {
    selectedMicrophone,
  }
},{
  persist: true
})

export const useVoiceCallStore = defineStore('voiceCallStore', () => {
  const appId = import.meta.env.VITE_AGORA_APP_ID
  const agoraClient = ref(null)
  const localAudioTrack = ref(null)
  const userUserUIDS = ref([])
  const ownMicrophoneMuted = ref(false)
  const remoteAudioTracks = ref(new Map())
  const remoteMutedAudioTracks = ref(new Map())

  const audioDeviceStore = useAudioDeviceStore()
  const { selectedMicrophone } = storeToRefs(audioDeviceStore)

  function setClient() {
    // vue reactivity interfer with agora object,
    // has to use markRaw to store raw object without reactivity
    agoraClient.value = markRaw(AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))
  }

  async function setLocalAudio() {
    try {
      localAudioTrack.value = markRaw(await AgoraRTC.createMicrophoneAudioTrack())

      if (selectedMicrophone.value) {
        localAudioTrack.value.setDevice(selectedMicrophone.value)
      }

      localAudioTrack.value.setEnabled(!ownMicrophoneMuted.value)
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
    remoteAudioTracks.value.clear()
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
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;

          if (remoteAudioTrack) {
            remoteAudioTrack.play();
            remoteAudioTracks.value.set(user.uid, remoteAudioTrack);
          }
        }
      })

      agoraClient.value.on('user-unpublished', (user, mediaType) => {
        remoteAudioTracks.value.delete(user.uid);
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;

          if (remoteAudioTrack) {
            remoteAudioTrack.stop();
          }
        }
      })

      agoraClient.value.on('user-left', (user) => {
        remoteAudioTracks.value.delete(user.uid);
        const remoteAudioTrack = user.audioTrack;

        if (remoteAudioTrack) {
          remoteAudioTrack.stop();
        }
      })

      await setLocalAudio()
      await publishLocalAudio()
    } catch (e) {
      throw e
    }
  }

  // true is mute
  async function muteOrUnmuteOwnMicrophone(flag) {
    if (localAudioTrack.value) {
      localAudioTrack.value.setEnabled(!flag)

      try {
        if (flag) {
          await agoraClient.unpublish(localAudioTrack.value);
        } else {
          await agoraClient.publish(localAudioTrack.value);
        }
      }
      catch (_) {}

      ownMicrophoneMuted.value = flag
    }
  }

  function muteOrUnmuteRemoteMicrophone(flag, userUID) {
    if (flag) {
      let userAudioTrack = remoteAudioTracks.value.get(userUID)

      if (userAudioTrack) {
        userAudioTrack.stop()
        remoteMutedAudioTracks.value.set(userUID, userAudioTrack)
        remoteAudioTracks.value.delete(userUID)
      }
    }
    else {
      let userMutedAudioTrack = remoteMutedAudioTracks.value.get(userUID)

      if (userMutedAudioTrack) {
        userMutedAudioTrack.play()
        remoteAudioTracks.value.set(userUID, userMutedAudioTrack)
        remoteMutedAudioTracks.value.delete(userUID)
      }
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
    userUserUIDS,
    localAudioTrack,
    ownMicrophoneMuted,
    muteOrUnmuteOwnMicrophone,
    muteOrUnmuteRemoteMicrophone,
    remoteAudioTracks,
    remoteMutedAudioTracks
  }
})
