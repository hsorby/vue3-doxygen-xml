import DoxygenXml from './components/DoxygenXml.vue'
import * as DoxygenStore from './store/modules/doxygen'

console.log('===== this is a local vue3-doxygen-xml =====')
// Import template components so they are part of the bundle and don't
// require retrieving separately.
import class_ from './components/Class.vue'
import codeline from './components/templates/codeline.vue'
import computeroutput from './components/templates/computeroutput.vue'
import emphasis from './components/templates/emphasis.vue'
import highlight from './components/templates/highlight.vue'
import index from './components/Index.vue'
import itemizedlist from './components/templates/itemizedlist.vue'
import listitem from './components/templates/listitem.vue'
import namespace from './components/Namespace.vue'
import para from './components/templates/para.vue'
import parameterdescription from './components/templates/parameterdescription.vue'
import parameteritem from './components/templates/parameteritem.vue'
import parameterlist from './components/templates/parameterlist.vue'
import parametername from './components/templates/parametername.vue'
import parameternamelist from './components/templates/parameternamelist.vue'
import programlisting from './components/templates/programlisting.vue'
import simplesect from './components/templates/simplesect.vue'
import sp from './components/templates/sp.vue'

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
  codeline ||
  computeroutput ||
  emphasis ||
  highlight ||
  index ||
  itemizedlist ||
  listitem ||
  namespace ||
  para ||
  parameterdescription ||
  parameteritem ||
  parameterlist ||
  parametername ||
  parameternamelist ||
  programlisting ||
  simplesect ||
  sp ||
  Error
) {
  // Are these things hidden?
}

export { DoxygenXml }
export default { install }
