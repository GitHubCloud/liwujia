import * as moment from 'moment';
import { createStore } from 'vuex'
import persistedState from 'vuex-persistedstate'

export default createStore({
  state: {
    token: '',
    tokenExpire: null,
    apiEndPoint: process.env.VUE_APP_ENDPOINT
  },
  mutations: {
    setToken(state, token) {
      state.token = token;
      state.tokenExpire = moment().add(1, 'hour').toDate();

      console.log({
        token,
        tokenExpire: state.tokenExpire
      });
    }
  },
  actions: {
    setToken({ commit }, token) {
      commit('setToken', token);
    }
  },
  modules: {
  },
  plugins: [persistedState()]
})
