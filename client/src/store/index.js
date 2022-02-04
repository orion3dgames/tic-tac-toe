import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

export default new Vuex.Store({

  state: {
    appTitle: process.env.VUE_APP_TITLE || 'NO TITLE FOUND IN MANIFEST.JSON',
    appDescription: process.env.VUE_APP_DESCRIPTION || 'NO DESCRIPTION FOUND IN MANIFEST.JSON',
    appVersion: process.env.VUE_APP_VERSION || 'NO VERSION FOUND IN MANIFEST.JSON',
    currentUser: {
      username: 'username',
      socket_id: 'socket_id'
    },
  },

  getters: {
    appVersion: (state) => {
      return state.appVersion
    },
    appTitle: (state) => {
      return state.appTitle
    },
    appDescription: (state) => {
      return state.appDescription
    },
    currentUser(state) {
      return state.currentUser;
    },
  },

  mutations: {
    SET_USER(state, newstate) {
      if (newstate) {
        state.currentUser = newstate;
      }
    },
  },

  actions: {
    setUser({commit}, user) {
      commit('SET_USER', user);
    },
  }
})
