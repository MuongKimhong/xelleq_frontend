<script setup>
import { NCarousel, NIcon } from 'naive-ui'
import { ArrowLeft, ArrowRight } from '@vicons/fa'
import { useBreakpoint } from '@/breakpoint.js'
import { useBaseStore } from '@/stores/base.js'
import { storeToRefs } from 'pinia'

const { isBreakPointSmOrXs, isBreakPointMdAndUp } = useBreakpoint()

const baseStore = useBaseStore()
const { showViewingModal, viewingImages } = storeToRefs(baseStore)

const props = defineProps({
  medias: {
    type: Array,
    default: () => [],
  },
  fullScreen: Boolean,
})

function viewMedia() {
  if (props.medias.length >= 1) {
    if (props.medias[0].media_type == 'image') {
      viewingImages.value = props.medias
      showViewingModal.value = true
    }
  }
}
</script>

<template>
  <div>
    <n-carousel
      :show-arrow="medias.length > 1"
      class="pb-2 pt-2"
      :loop="false"
      @click="viewMedia()"
    >
      <div
        v-for="(media, mediaIndex) in medias"
        :key="media.id"
        v-memo="[media.url]"
        :class="{
          'media-wrapper-sm-and-xs': isBreakPointSmOrXs,
          'media-wrapper': isBreakPointMdAndUp && !fullScreen,
          'media-wrapper-fullscreen': fullScreen,
        }"
      >
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
  </div>
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

.media-wrapper-sm-and-xs {
  position: relative;
  width: 100%;
  height: 350px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  border-radius: 5px;
  margin-bottom: 20px;
}

.media-wrapper {
  position: relative;
  width: 100%;
  height: 550px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  border-radius: 5px;
  margin-bottom: 20px;
}

.media-wrapper-fullscreen {
  position: relative;
  width: 100%;
  height: 85vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  border-radius: 5px;
  margin-bottom: 20px;
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
