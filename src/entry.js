import { createPinia } from 'pinia'

import DoxygenXml from './components/DoxygenXml.vue'

function installVue3DoxygenXml(app, options = {}) {
  // Create a local pinia instance???
  app.use(createPinia())
}

export { DoxygenXml, installVue3DoxygenXml }
