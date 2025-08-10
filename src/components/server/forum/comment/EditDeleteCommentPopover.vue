<script setup>
import { NButton, NIcon, NPopover } from 'naive-ui'
import { DeleteOutlineOutlined } from '@vicons/material'
import { Dots, Edit } from '@vicons/tabler'

const emit = defineEmits(['edit-btn-press', 'delete-btn-press'])
const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  commentIndex: {
    type: Number,
    required: true,
  },
})

function onEditCommentBtnPress() {
  emit('edit-btn-press', props.commentIndex, props.comment)
}

function onDeleteCommentBtnPress() {
  emit('delete-btn-press', props.commentIndex, props.comment)
}
</script>

<template>
  <n-popover trigger="click" :show-arrow="false" placement="left-end" style="width: 100px">
    <template #trigger>
      <n-button tertiary size="tiny" round>
        <template #icon>
          <n-icon><Dots /></n-icon>
        </template>
      </n-button>
    </template>
    <div style="text-align: center">
      <n-button
        quaternary
        size="small"
        type="primary"
        style="width: 100%"
        @click="onEditCommentBtnPress()"
      >
        <template #icon>
          <n-icon><Edit /></n-icon>
        </template>
        Edit
      </n-button>
    </div>
    <div style="text-align: center" class="mt-2">
      <n-button
        quaternary
        size="small"
        type="error"
        style="width: 100%"
        @click="onDeleteCommentBtnPress()"
      >
        <template #icon>
          <n-icon><DeleteOutlineOutlined /></n-icon>
        </template>
        Delete
      </n-button>
    </div>
  </n-popover>
</template>
