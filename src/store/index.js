import { createStore } from 'vuex'

import * as doxygen from './modules/doxygen.js'

const store = createStore({
  modules: { doxygen },
})

export default store
