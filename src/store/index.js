import Vue from 'vue'
import Vuex from 'vuex'

import * as doxygen from './modules/doxygen.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: { doxygen }
})
