![logo](https://github.com/hsorby/vue-doxygen-xml/raw/main/docs/assetts/vue-doxygen-xml-logo.png)

# vue-doxygen-xml

[![npm](https://img.shields.io/npm/v/vue-doxygen-xml.svg) ![npm](https://img.shields.io/npm/dm/vue-doxygen-xml.svg)](https://www.npmjs.com/package/vue-doxygen-xml)
[![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)

Vue component for displaying Doxygen XML content.

## Project setup

```
npm install --save vue-doxygen-xml
```

### Module import

vue-doxygen-xml makes use of the vuex store to track data. You must use a vuex store for the component to work.
**⚠️ You need to install the module with the application like so:**

```javascript
import Vue from 'vue'
import store from './store'
import DoxygenXml from 'vue-doxygen-xml'

Vue.use(DoxygenXml, { store })
```

Add the above to your `main.js` application file (this assumes that a standard layout is followed when creating your application).

### Module component

To use the vue-doxygen-xml component import it in a view and set the `baseURL` for the source XML.
Example view `Help.vue`:

```javascript
<template>
  <div class="help">
    <doxygen-xml baseURL="/doxygen-xml-files" />
  </div>
</template>

<script>
import { DoxygenXml } from 'vue-doxygen-xml'

export default {
  name: 'Help',
  components: {
    DoxygenXml
  }
}
</script>
```

### Module routing

vue-doxygen-xml requires that you use vue-router. To add a vue-doxygen-xml route under `help` add the following to `routes` object for vue-router:

```javascript
  {
    path: '/help/:pageName?',
    name: 'Help',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "help" */ '../views/Help.vue')
  }
```

Again assuming standard layout.

## Examples

For a complete example of a Vue application using vue-doxygen-xml look at https://github.com/hsorby/example-vue-doxygen-xml.
The **main** branch has a basic example of how vue-doxygen-xml may be used and the **multi_version** branch has an example of how vue-doxygen-xml may be used for different versions of Doxygen XML output.

---

## License

[Apache-2.0](https://opensource.org/licenses/Apache-2.0)

---

## Development setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Run your unit tests

```
npm run test:unit
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
