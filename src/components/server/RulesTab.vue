<script setup>
import { useServerStore } from '@/stores/server.js'
import { storeToRefs } from 'pinia'

import '@/assets/styles/server.css'
import '@/assets/base.css'

const serverStore = useServerStore()
const { serverData } = storeToRefs(serverStore)
</script>

<template>
  <div class="mt-2 tab-content" style="padding: 0px 5px">
    <span style="font-size: 22px; padding: 2px 0px">Rules</span>

    <h3 style="white-space: pre-line">{{ serverData.rules }}</h3>
  </div>
</template>
