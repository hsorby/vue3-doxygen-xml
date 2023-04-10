![logo](https://raw.githubusercontent.com/hsorby/vue3-doxygen-xml/main/docs/assetts/vue-doxygen-xml-logo.png)

# vue3-doxygen-xml

[![npm](https://img.shields.io/npm/v/vue3-doxygen-xml.svg) ![npm](https://img.shields.io/npm/dm/vue3-doxygen-xml.svg)](https://www.npmjs.com/package/vue3-doxygen-xml)
[![vue3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)

Vue component for displaying Doxygen XML content.

## Project setup

```
npm install --save vue3-doxygen-xml
```

### Module import

Install the module like so:

```javascript
import { createApp } from 'vue'
import App from './App.vue'

import { installVue3DoxygenXml } from 'vue3-doxygen-xml'
import 'vue3-doxygen-xml/dist/style.css'

createApp(App)
  .use(installVue3DoxygenXml)
  .mount('#app')
```

Add the above to your `main.js` application file (this assumes that a standard layout is followed when creating your application).
Importing the default `style.css` is optional, delete the `import 'vue3-doxygen-xml/dist/style.css'` line from the above code sample to apply your own style.

### Module component

To use the vue3-doxygen-xml component import it in a view and set the `baseURL` for the source XML.
Example view `Help.vue`:

```javascript
<template>
  <div class="help">
    <doxygen-xml baseURL="/doxygen-xml-files" />
  </div>
</template>

<script setup>
import { DoxygenXml } from 'vue3-doxygen-xml'
</script>
```

### Module routing

vue3-doxygen-xml requires that you use vue-router. To add a vue3-doxygen-xml route under `help` add the following to `routes` object for vue-router:

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

For a complete example of a Vue application using vue3-doxygen-xml look at https://github.com/hsorby/example-vue3-doxygen-xml.
The **main** branch has a basic example of how vue3-doxygen-xml may be used and the **multi_version** branch has an example of how vue3-doxygen-xml may be used for different versions of Doxygen XML output.

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
