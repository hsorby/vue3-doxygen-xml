import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { createPinia } from 'pinia'

Vue.config.productionTip = false

const pinia = createPinia()

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
