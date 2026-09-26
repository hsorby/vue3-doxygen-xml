import DoxygenXml from './components/DoxygenXml.vue'

function installVue3DoxygenXml(app, options = {}) {
  // Nothing to install: page data is held in a module-level cache
  // (see js/doxygencache.js). Kept so existing app.use() calls still work.
}

export { DoxygenXml, installVue3DoxygenXml }
