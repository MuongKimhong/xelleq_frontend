<script setup>
import { NGrid, NGridItem, NImage } from 'naive-ui'
import '@/assets/base.css'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

function getGridCols(count) {
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 2
  if (count === 4) return 2
  if (count <= 6) return 3
  return 3
}
</script>

<template>
  <div v-if="message.file_data.length > 0">
    <div v-if="message.file_data[0].file_type === 'video'">
      <video
        :src="message.file_data[0].url"
        controls
        disablePictureInPicture
        style="max-width: 450px; max-height: 400px"
      ></video>
    </div>
    <div v-else-if="message.file_data[0].file_type === 'audio'">
      <audio
        :src="message.file_data[0].url"
        controls
        controlsList="nodownload noplaybackrate"
        style="height: 30px"
        @contextmenu.prevent
      ></audio>
    </div>
    <div v-else-if="message.file_data[0].file_type === 'image'">
      <n-grid
        :x-gap="4"
        :cols="getGridCols(message.file_data.length)"
        responsive="self"
        style="max-width: 450px; width: 100%"
      >
        <n-grid-item
          v-for="(img, idx) in message.file_data"
          :key="idx"
          style="width: 100%; max-width: 100%"
        >
          <n-image
            :src="img.url"
            width="100%"
            preview-disabled
            style="max-width: 100%; height: 150px; object-fit: cover; border-radius: 5px"
          />
        </n-grid-item>
      </n-grid>
    </div>
  </div>
</template>
