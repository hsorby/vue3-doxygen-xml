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
import 'vue3-doxygen-xml/dist/vue3-doxygen-xml.css'

createApp(App)
  .use(installVue3DoxygenXml)
  .mount('#app')
```

Add the above to your `main.js` application file (this assumes that a standard layout is followed when creating your application).
Importing the default `vue3-doxygen-xml.css` is optional, delete the `import 'vue3-doxygen-xml/dist/vue3-doxygen-xml.css'` line from the above code sample to apply your own style.

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

### Error handling

When a page fails to load, `<doxygen-xml>` emits an `error` event with a `DoxygenPageError`.
Its `kind` says what went wrong:

| `kind` | Meaning | Extra fields |
| --- | --- | --- |
| `'not-found'` | The server returned 404/410 for the XML file. | `status` |
| `'http'` | The server returned another error status. | `status` |
| `'network'` | No response (offline, CORS, timeout, ...). | `code` |
| `'parse'` | A response arrived but is not Doxygen XML that can be read. | |
| `'unsupported'` | Valid Doxygen output this library cannot display yet, e.g. a file or group page. (Members it cannot show yet, such as macros, are skipped rather than failing the page.) | |

Every error also has `pageName`, `baseURL`, `url` and the original error as `cause`.
A `'not-found'` error redirects to the route named `404` (as before); other kinds show an error message in place of the page.

```javascript
<template>
  <doxygen-xml baseURL="/doxygen-xml-files" @error="onError" />
</template>

<script setup>
import { DoxygenXml, DoxygenErrorKind } from 'vue3-doxygen-xml'

function onError(error) {
  if (error.kind === DoxygenErrorKind.NETWORK) {
    // e.g. show an "offline" banner
  }
  console.error(error.message, error.cause)
}
</script>
```

## Examples

For a complete example of a Vue application using vue3-doxygen-xml look at https://github.com/hsorby/example-vue3-doxygen-xml.
The **main** branch has a basic example of how vue3-doxygen-xml may be used and the **multi_version** branch has an example of how vue3-doxygen-xml may be used for different versions of Doxygen XML output.

---

## License

[Apache-2.0](https://opensource.org/licenses/Apache-2.0)

---

## Development setup

```
yarn install
```

### Build the library into `dist/`

```
yarn build-package
```

### Run the tests

The tests use [Vitest](https://vitest.dev/) with [jsdom](https://github.com/jsdom/jsdom).
`tests/unit` covers the XML parser and page cache; `tests/components` mounts `<doxygen-xml>` with a router against a fake server (see `tests/helpers/doxygen.js`).

```
yarn test          # run once
yarn test:watch    # re-run on changes
```
