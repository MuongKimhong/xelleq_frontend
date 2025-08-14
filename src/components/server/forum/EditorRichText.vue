<script setup>
import { NInput, NCard, NButton, NIcon } from 'naive-ui'
import { Editor, EditorContent } from '@tiptap/vue-3'
import {
  Bold,
  Heading,
  Italic,
  ListUl,
  ListOl,
  Code,
  Underline,
  Strikethrough,
  Highlighter,
} from '@vicons/fa'
import { ArrowEnterLeft20Filled } from '@vicons/fluent'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Placeholder } from '@tiptap/extensions'
import Highlight from '@tiptap/extension-highlight'
import { all, createLowlight } from 'lowlight'
import StarterKit from '@tiptap/starter-kit'
import { useI18n } from 'vue-i18n'
import { ref, computed, onDeactivated, onMounted, onBeforeUnmount } from 'vue'

import 'highlight.js/styles/github-dark.css'
import '../../../assets/base.css'

const { t } = useI18n()

const props = defineProps({
  richtextoutput: {
    type: String,
    default: '<p></p>',
  },
  forPostDetail: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:richtextoutput'])

const editor = ref(null)
const placeholder = computed(() => {
  if (props.forPostDetail) {
    return 'Write comment'
  }
  return 'Description'
})
onMounted(() => {
  const lowlight = createLowlight(all)

  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Highlight,
      Placeholder.configure({
        placeholder: placeholder.value,
      }),
    ],
    autofocus: true,
    content: props.richtextoutput,
    onUpdate({ editor }) {
      emit('update:richtextoutput', editor.getHTML())
    },
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

onDeactivated(() => {
  editor.value?.commands.clearContent()
})

const title = computed(() => {
  if (props.forPostDetail) {
    return 'Comment'
  }
  return 'Richtext'
})
</script>

<template>
  <n-card v-if="editor" :title="title" size="small" class="editor-card">
    <template v-if="!forPostDetail" #header-extra>
      <n-button size="tiny" @click="editor.chain().focus().clearContent().run()">Clear</n-button>
    </template>

    <div class="toolbar">
      <n-button
        size="small"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :type="editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'"
      >
        <n-icon><Heading /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleBold().run()"
        :type="editor.isActive('bold') ? 'primary' : 'default'"
      >
        <n-icon><Bold /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleItalic().run()"
        :type="editor.isActive('italic') ? 'primary' : 'default'"
      >
        <n-icon><Italic /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleUnderline().run()"
        :type="editor.isActive('underline') ? 'primary' : 'default'"
      >
        <n-icon><Underline /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleStrike().run()"
        :type="editor.isActive('strike') ? 'primary' : 'default'"
      >
        <n-icon><Strikethrough /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleBulletList().run()"
        :type="editor.isActive('bulletList') ? 'primary' : 'default'"
      >
        <n-icon><ListUl /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :type="editor.isActive('orderedList') ? 'primary' : 'default'"
      >
        <n-icon><ListOl /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :type="editor.isActive('codeBlock') ? 'primary' : 'default'"
      >
        <n-icon><Code /></n-icon>
      </n-button>
      <n-button
        size="small"
        @click="editor.chain().focus().toggleHighlight().run()"
        :type="editor.isActive('highlight') ? 'primary' : 'default'"
      >
        <n-icon><Highlighter /></n-icon>
      </n-button>
      <n-button size="small" @click="editor.chain().focus().setHardBreak().run()">
        <n-icon><ArrowEnterLeft20Filled /></n-icon>
      </n-button>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
  </n-card>
</template>

<style>
.ProseMirror {
  border: none !important;
  outline: none;
  max-width: 100%;
  min-height: 100px;
  max-height: 660px;
  overflow-y: auto;
  margin-top: 15px;
  font-size: 16px;
}
.editor-card {
  max-width: 100%;
}
.editor-content pre {
  background-color: #1e1e1e;
  padding: 10px;
  border-radius: 6px;
}
.editor-content code {
  font-family: 'Monaco', monospace;
  font-size: 0.95em;
  overflow-x: auto;
  white-space: pre;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #1e1e1e;
  padding: 4px;
  color: white;
  border-radius: 6px;
}
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.tiptap p {
  margin: 0;
  line-height: 1.5;
  padding: 4px 0;
}
</style>
