<script setup>
import { NImage } from 'naive-ui'
import '../assets/styles/loginRegister.css'
import { useUserStore } from '../stores/user.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

const router = useRouter()
const { t } = useI18n()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
</script>

<template>
  <div style="margin-top: 20px">
    <div style="text-align: center">
      <n-image src="/celliq_logo.png" width="120" preview-disabled id="logo" />
    </div>

    <h1 style="text-align: center">404 Not Found</h1>
    <h2 style="text-align: center">{{ t('pageNotFound') }}</h2>
    <h3 v-if="user.authenticated" style="text-align: center">
      <span class="link-span" @click="router.push({ name: 'home' })">
        {{ t('home') }}
      </span>
    </h3>
    <h3 v-else style="text-align: center">
      <span class="link-span" @click="router.push({ name: 'home' })">
        {{ t('home') }}
      </span>
      |
      <span class="link-span" @click="router.push({ name: 'login' })">
        {{ t('login') }}
      </span>
      |
      <span class="link-span" @click="router.push({ name: 'register' })">
        {{ t('register') }}
      </span>
    </h3>
  </div>
</template>

<style scoped>
#logo {
  transform: scaleX(-1);
}
</style>
