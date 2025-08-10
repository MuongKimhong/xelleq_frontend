<script setup>
import { NModal, NCard, NButton, NIcon } from 'naive-ui'
import { Close } from '@vicons/ionicons5'
import { useBaseStore } from '../../stores/base.js'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import PostCarousel from '../server/forum/PostCarousel.vue'

const baseStore = useBaseStore()
const { viewingImages, showViewingModal } = storeToRefs(baseStore)

const title = computed(() => `Total ${viewingImages.value.length}`)

function closeModal() {
  showViewingModal.value = false
}
</script>

<template>
  <n-modal v-model:show="showViewingModal" :auto-focus="false" :mask-closable="false">
    <n-card :title="title">
      <template #header-extra>
        <n-button size="tiny" @click="closeModal()">
          <template #icon>
            <n-icon><Close /></n-icon>
          </template>
        </n-button>
      </template>
      <PostCarousel :medias="viewingImages" :full-screen="true" />
    </n-card>
  </n-modal>
</template>
