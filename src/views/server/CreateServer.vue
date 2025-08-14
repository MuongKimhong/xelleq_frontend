<script setup>
import { NInput, NSelect, NSwitch, NButton, NTag } from 'naive-ui'
import { useServerStore } from '../../stores/server.js'
import { useBreakpoint } from '../../breakpoint.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import api from '../../axios.js'

import '../../assets/base.css'

const { isBreakPointSmOrXs, isBreakPointMdAndUp } = useBreakpoint()
const { t } = useI18n()
const router = useRouter()
const serverStore = useServerStore()

const serverOptions = [
  {
    label: t('typePublic'),
    value: 'Public',
  },
  {
    label: t('typePublicRestrict'),
    value: 'Public & Restrict',
  },
  {
    label: t('typePrivate'),
    value: 'Private',
  },
]
const selectedServerOption = ref(null)
const topics = ref([])
const selectedTopics = ref([])
const selectedTopicIds = ref([])
const searchTopicResults = ref([])
const searchText = ref('')
const isSubmitting = ref(false)
const name = ref('')
const description = ref('')
const ruleDescription = ref('')
const postsNeedApproval = ref(false)
const errText = ref('')
const showErrText = ref(false)

async function getAllTopics() {
  try {
    let res = await api.get('/servers/get-all-topics')

    if (res.status === 200) {
      topics.value = res.data.topics
      searchTopicResults.value = res.data.topics
      return
    }
  } catch (_) {}
}

function onTopicSearch() {
  if (searchText.value.trim() === '') {
    searchTopicResults.value = topics.value
    return
  }

  searchTopicResults.value = topics.value
    .map((group) => {
      const matchedTopics = group.related_topics.filter((topic) =>
        topic.name.toLowerCase().includes(searchText.value.toLowerCase()),
      )
      return {
        alphabet_char: group.alphabet_char,
        related_topics: matchedTopics,
      }
    })
    .filter((group) => group.related_topics.length > 0)
}

function selectTopic(topicId) {
  if (!selectedTopicIds.value.includes(topicId) && selectedTopicIds.value.length < 2) {
    selectedTopicIds.value.push(topicId)

    let topic = searchTopicResults.value
      .flatMap((group) => group.related_topics)
      .find((topic) => topic.id === topicId)

    selectedTopics.value.push(topic)
  }
}

function removeTopic(topicId) {
  selectedTopicIds.value = selectedTopicIds.value.filter((id) => id !== topicId)
  selectedTopics.value = selectedTopics.value.filter((topic) => topic.id !== topicId)
}

async function createServer() {
  isSubmitting.value = true
  showErrText.value = false

  if (name.value.trim() === '' || selectedServerOption.value === null) {
    errText.value = t('serverNameAndTypeRequired')
    showErrText.value = true
    isSubmitting.value = false
    return
  }

  let payload = {
    name: name.value,
    posts_need_approval: postsNeedApproval.value,
    rules_description: ruleDescription.value,
    description: description.value,
    selected_topics: selectedTopics.value,
  }
  switch (selectedServerOption.value.trim()) {
    case 'Private':
      payload['public'] = false
      payload['restrict'] = false
      break
    case 'Public & Restrict':
      payload['public'] = true
      payload['restrict'] = true
      break
    case 'Public':
      payload['public'] = true
      payload['restrict'] = false
      break
  }
  try {
    let res = await api.post('/servers/create-server', payload)

    if (res.status === 200) {
      serverStore.addJoinedServer(res.data)

      router.push({
        name: 'server-detail',
        params: {
          id: res.data.id,
          slug: res.data.slug,
        },
      })
    }
  } catch (err) {
    let errRes = err.response.data.error

    switch (errRes) {
      case 'Server name exists':
        errText.value = t('serverNameTaken')
        break
      case 'Server name length':
        errText.value = t('serverNameLength')
        break
      case 'Exceed server limit':
        errText.value = t('serverExceedLimit')
        break
      default:
        errText.value = t('failCreateServer')
        break
    }
    showErrText.value = true
    isSubmitting.value = false
    return
  }
}

onMounted(() => getAllTopics())
</script>

<template>
  <div
    style="
      height: calc(100dvh - 60px);
      overflow-y: auto;
      scroll-behavior: smooth;
      will-change: transform;
    "
  >
    <div id="create-server-card">
      <h2 style="text-align: center">{{ t('createServer') }}</h2>

      <div v-if="showErrText" style="text-align: center; margin-bottom: 15px">
        <n-tag type="error">{{ errText }}</n-tag>
      </div>

      <div :class="{ container: isBreakPointMdAndUp, 'container-sm-xs': isBreakPointSmOrXs }">
        <div>
          <n-input :placeholder="t('serverName')" show-count maxlength="35" v-model:value="name">
          </n-input>
          <n-input
            v-model:value="description"
            :placeholder="t('serverDescription')"
            size="large"
            type="textarea"
            maxlength="200"
            show-count
            class="mt-4"
          />

          <n-input
            v-model:value="ruleDescription"
            :placeholder="t('serverRules')"
            size="large"
            type="textarea"
            maxlength="600"
            show-count
            class="mt-4"
            :autosize="{
              minRows: 5,
              maxRows: 15,
            }"
          />

          <div class="mt-4">
            <n-select
              :placeholder="t('serverType')"
              v-model:value="selectedServerOption"
              :options="serverOptions"
            />
          </div>

          <div class="mt-4">
            <div class="info-row">
              <span>{{ t('postsNeedApproval') }}</span>
              <n-switch v-model:value="postsNeedApproval" :rubber-band="false"></n-switch>
            </div>
          </div>

          <div class="mt-4">
            <h3>{{ t('topics') }}</h3>
            <span>{{ t('chooseTopicDescription') }}</span>

            <n-input
              class="mt-4"
              :placeholder="t('searchTopic')"
              @input="onTopicSearch()"
              v-model:value="searchText"
            ></n-input>

            <n-tag
              v-for="topic in selectedTopics"
              closable
              type="primary"
              class="mx-1 mt-2"
              @close="removeTopic(topic.id)"
            >
              {{ topic.name }}
            </n-tag>
          </div>

          <div class="mt-4 topic-list">
            <div v-for="topic in searchTopicResults" :key="topic.id" class="mt-4">
              <span class="topic-letter">{{ topic.alphabet_char }}</span>
              <hr class="underline" />

              <n-button
                v-for="related in topic.related_topics"
                size="small"
                class="mx-1 mt-1"
                round
                @click="selectTopic(related.id)"
              >
                {{ related.name }}
              </n-button>
            </div>
          </div>

          <div style="text-align: right; margin-top: 50px">
            <n-button
              tertiary
              type="primary"
              @click="createServer()"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ t('create') }}
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#create-server-card {
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 20px;
  padding-left: 10px;
  padding-right: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.container-sm-xs {
  max-width: 400px;
  justify-content: center;
  align-content: center;
}
.container {
  width: 500px;
  justify-content: center;
  align-content: center;
}
.container-sm-xs,
.container {
  margin: 0 auto; /* centers the block */
  display: flex;
  flex-direction: column;
  align-items: center;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px;
}
.topic-list {
  overflow-y: scroll;
  max-height: 320px;
  height: 320px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 5px;
  padding: 5px;
}
.underline {
  border: none;
  height: 1px;
  background: grey;
  margin-top: 2px;
  margin-bottom: 15px;
}
.topic-letter {
  font-size: 18px;
}
</style>
