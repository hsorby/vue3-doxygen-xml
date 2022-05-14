import DoxygenXml from './components/DoxygenXml.vue'
import * as DoxygenStore from './store/modules/doxygen'

console.log('===== this is a local vue3-doxygen-xml =====')
// Import template components so they are part of the bundle and don't
// require retrieving separately.
import class_ from './components/Class.vue'
import computeroutput from './components/templates/computeroutput.vue'
import index from './components/Index.vue'
import namespace from './components/Namespace.vue'
import parameterlist from './components/templates/parameterlist.vue'
import simplesect from './components/templates/simplesect.vue'
import sp from './components/templates/sp.vue'
import text from './components/templates/text.vue'

import Error from './components/Error.vue'

function install(app, options = {}) {
  if (!options.store) {
    throw 'Please provide a store!!'
  }

  // Vue.component('your-component', yourComponent)

  options.store.registerModule('doxygen', DoxygenStore)
}

if (
  class_ ||
  computeroutput ||
  index ||
  namespace ||
  parameterlist ||
  simplesect ||
  sp ||
  text ||
  Error
) {
  // Are these things hidden?
}

export { DoxygenXml }
export default { install }
