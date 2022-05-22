import DoxygenXml from './components/DoxygenXml.vue'
import * as DoxygenStore from './store/modules/doxygen'

function install(app, options = {}) {
  if (!options.store) {
    throw 'Please provide a store!!'
  }

  options.store.registerModule('doxygen', DoxygenStore)
}

export { DoxygenXml }
export default { install }
