import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import api from '../axios.js'

export const useServerStore = defineStore('server', () => {
  const joinedServers = ref([])
  const serverData = ref(null)
  const onCallServerId = ref(null)

  // init call in Navbar onMounted
  async function getJoinedServers() {
    try {
      let res = await api.get('/servers/get-all-joined-servers')

      if (res.status === 200) {
        joinedServers.value = res.data['joined_servers']
      }
    } catch (_) {}
  }

  function addJoinedServer(server) {
    joinedServers.value.push(server)
  }

  // insert at 0
  function unshiftJoinedServers(server) {
    joinedServers.value.unshift(server)
  }

  function removeFromJoinedServers(serverId) {
    const index = joinedServers.value.findIndex((server) => server.id === serverId)
    if (index !== -1) {
      joinedServers.value.splice(index, 1)
    }
  }

  function updateJoinedServerProfile(id, profileUrl) {
    for (let i = 0; i < joinedServers.value.length; i++) {
      if (joinedServers.value[i].id === id) {
        joinedServers.value[i].profile_url = profileUrl
        break
      }
    }
  }

  function updateJoinedServerName(id, name) {
    for (let i = 0; i < joinedServers.value.length; i++) {
      if (joinedServers.value[i].id === id) {
        joinedServers.value[i].name = name
        break
      }
    }
  }

  function updateJoinedServerType(id, publicStatus) {
    for (let i = 0; i < joinedServers.value.length; i++) {
      if (joinedServers.value[i].id === id) {
        joinedServers.value[i].public = publicStatus
        break
      }
    }
  }

  function setServerData(data) {
    serverData.value = {
      id: data.id,
      name: data.name,
      description: data.description,
      rules: data.rules,
      moderators: data.moderators,
      profileUrl: data.profile_url,
      totalRooms: data.total_rooms,
      totalMembers: data.total_members,
      public: data.public,
      restrict: data.restrict,
      postsNeedApproval: data.posts_need_approval,
      isAdmin: data.is_admin,
      isMember: data.is_member,
      isModerator: data.is_moderator,
      canPostInRestrict: data.can_post_in_restrict,
      createdAt: data.created_at,
    }
  }

  function clearServerData() {
    serverData.value = null
  }

  return {
    joinedServers,
    onCallServerId,
    getJoinedServers,
    addJoinedServer,
    serverData,
    setServerData,
    clearServerData,
    updateJoinedServerProfile,
    updateJoinedServerName,
    updateJoinedServerType,
    removeFromJoinedServers,
    unshiftJoinedServers,
  }
})

export const useViewingServerStore = defineStore(
  'viewingServer',
  () => {
    const viewingServer = ref({
      id: '',
      public: false,
      slug: ""
    })

    function setViewingServer(server) {
      viewingServer.value = {
        id: server.id,
        public: server.public,
        slug: server.slug
      }
    }

    function clearViewingServer() {
      viewingServer.value = {
        id: '',
        public: false,
        slug: ""
      }
    }
    return { viewingServer, setViewingServer, clearViewingServer }
  },
  {
    persist: true,
  },
)

// use to store public server id that user want to join but
// user is not authenticated.
// redirect user to login page, when user return call the join server api
export const useNeedJoinServerStore = defineStore(
  'needJoinServer',
  () => {
    const needToJoinServerId = ref(null)

    return { needToJoinServerId }
  },
  {
    persist: true,
  },
)

export const useServerMemberStore = defineStore('serverMember', () => {
  const members = ref([])

  function setMembers(allMembers) {
    members.value = allMembers
  }

  function addMember(newMember) {
    members.value.push(newMember)
  }

  function removeMember(memberId) {
    const index = members.value.findIndex((member) => member.member_id === memberId)
    if (index !== -1) {
      members.value.splice(index, 1)
    }
  }

  function clearMembers() {
    members.value.length = 0
  }

  return { members, setMembers, clearMembers, addMember, removeMember }
})
