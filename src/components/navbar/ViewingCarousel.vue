<script setup>
import { NModal, NCard, NCarousel, NButton, NIcon } from 'naive-ui'
import { ArrowLeft, ArrowRight } from '@vicons/fa'
import { Close } from '@vicons/ionicons5'
import { useBaseStore } from '../../stores/base.js'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

// import PostCarousel from '../server/forum/PostCarousel.vue'

const baseStore = useBaseStore()
const { viewingImages, showViewingModal } = storeToRefs(baseStore)

const title = computed(() => `Total ${viewingImages.value.length}`)

function closeModal() {
  showViewingModal.value = false
}
</script>

<template>
  <n-modal v-model:show="showViewingModal" :auto-focus="false" :mask-closable="false">
    <n-card
      :content-style="{ padding: '0' }"
      style="height: 100dvh; background-color: rgba(128, 128, 128, 0.8); position: relative"
    >
      <n-button
        style="position: absolute; z-index: 5; right: 5px; top: 5px"
        round
        type="primary"
        size="tiny"
        @click="closeModal()"
      >
        <template #icon>
          <n-icon><Close /></n-icon>
        </template>
      </n-button>

      <n-carousel
        :show-arrow="viewingImages.length > 1"
        :touchable="viewingImages.length > 1"
        :loop="false"
      >
        <div v-for="(media, mediaIndex) in viewingImages" :key="media.id" class="media">
          <div class="media-blur-bg">
            <img :src="media.url" loading="lazy" alt="" class="blur-img" />
          </div>
          <img
            v-if="media.media_type == 'image'"
            class="media-foreground"
            :src="media.url"
            alt="Post Image"
            loading="lazy"
          />
          <video
            v-else-if="media.media_type == 'video'"
            class="media-foreground"
            controls
            preload="metadata"
            :src="media.url"
          ></video>
        </div>
        <template #arrow="{ prev, next }">
          <div class="custom-arrow">
            <button type="button" class="custom-arrow--left" @click.stop="prev">
              <n-icon><ArrowLeft /></n-icon>
            </button>
            <button type="button" class="custom-arrow--right" @click.stop="next">
              <n-icon><ArrowRight /></n-icon>
            </button>
          </div>
        </template>
        <template #dots="{ total, currentIndex, to }">
          <ul class="custom-dots">
            <li
              v-for="index of total"
              :key="index"
              :class="{ ['is-active']: currentIndex === index - 1 }"
            />
          </ul>
        </template>
      </n-carousel>
    </n-card>
  </n-modal>
</template>

<style scoped>
.custom-arrow {
  display: flex;
  position: absolute;
  bottom: 25px;
  right: 10px;
}

.custom-arrow button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 12px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  border-width: 0;
  border-radius: 8px;
  cursor: pointer;
}

.custom-dots {
  display: flex;
  margin: 0;
  padding: 0;
  position: absolute;
  bottom: 39px;
  left: 10px;
}

.custom-dots li {
  display: inline-block;
  width: 12px;
  height: 4px;
  margin: 0 3px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
}

.custom-dots li.is-active {
  width: 25px;
  background: #fff;
}

.media {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  border-radius: 5px;
}

.media-blur-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
}

.blur-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(30px) brightness(0.5);
  transform: scale(1.1);
  opacity: 1;
  pointer-events: none;
}

.media-foreground {
  position: relative;
  z-index: 2;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 2px;
}
</style>
