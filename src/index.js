import DoxygenXml from './components/DoxygenXml'
import * as DoxygenStore from './store/modules/doxygen'

console.log('===== this is a local vue-doxygen-xml =====')
// Import template components so they are part of the bundle and don't
// require retrieving separately.
import class_ from './components/templates/class'
import codeline from './components/templates/codeline'
import computeroutput from './components/templates/computeroutput'
import emphasis from './components/templates/emphasis'
import highlight from './components/templates/highlight'
import index from './components/templates/index'
import itemizedlist from './components/templates/itemizedlist'
import listitem from './components/templates/listitem'
import loading from './components/templates/loading'
import namespace from './components/templates/namespace'
import para from './components/templates/para'
import parameterdescription from './components/templates/parameterdescription'
import parameteritem from './components/templates/parameteritem'
import parameterlist from './components/templates/parameterlist'
import parametername from './components/templates/parametername'
import parameternamelist from './components/templates/parameternamelist'
import programlisting from './components/templates/programlisting'
import simplesect from './components/templates/simplesect'
import sp from './components/templates/sp'

import Default from './components/Default'

function install(Vue, options = {}) {
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
  loading ||
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
  Default
) {
  // Are these things hidden?
}

export { DoxygenXml }
export default { install }
