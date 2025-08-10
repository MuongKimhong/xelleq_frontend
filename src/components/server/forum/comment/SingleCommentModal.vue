<script setup>
import { NInput, NImage, NButton, NIcon, NModal } from 'naive-ui'
import { UserCircleRegular } from '@vicons/fa'
import { usePostDetailStore } from '@/stores/postdetail.js'
import { useUserStore } from '@/stores/user.js'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import '@/assets/styles/postDetail.css'
import '@/assets/base.css'

const router = useRouter()

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const postDetailStore = usePostDetailStore()
const { postData, singleComment } = storeToRefs(postDetailStore)
</script>

<template></template>
