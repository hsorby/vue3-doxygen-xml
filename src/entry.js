import DoxygenXml from './components/DoxygenXml.vue'
import * as DoxygenStore from './store/modules/doxygen'

function installVue3DoxygenXml(app, options = {}) {
  if (!options.store) {
    throw 'Please provide a store!!'
  }

  options.store.registerModule('doxygen', DoxygenStore)
}

export { DoxygenXml, installVue3DoxygenXml }
