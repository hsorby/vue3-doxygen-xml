import DoxygenXml from './components/DoxygenXml.vue'
import { DoxygenErrorKind, DoxygenPageError } from './js/errors'

function installVue3DoxygenXml(app, options = {}) {
  // Nothing to install: page data is held in a module-level cache
  // (see js/doxygencache.js). Kept so existing app.use() calls still work.
}

export { DoxygenXml, DoxygenErrorKind, DoxygenPageError, installVue3DoxygenXml }
