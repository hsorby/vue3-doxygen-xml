<template>
  <component :is="asyncComponent" />
</template>

<script setup>
import { defineAsyncComponent, h, provide, shallowRef, toRefs, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { baseURLKey, useDoxygenCache } from '../js/doxygencache'
import { DoxygenErrorKind, unsupportedPageError } from '../js/errors'

import LoadingComponent from './LoadingComponent.vue'
import PageLoadError from './PageLoadError.vue'

const props = defineProps({
  baseURL: String,
  // Milliseconds to wait, after a page has loaded, before scrolling to the
  // URL's hash (lets the page lay out first).
  scrollDelay: Number,
  pageNotFoundName: {
    type: String,
    default: '404',
  },
})

const emit = defineEmits(['error'])

const { baseURL, pageNotFoundName, scrollDelay } = toRefs(props)
const doxygenCache = useDoxygenCache()
const router = useRouter()
const route = useRoute()

provide(baseURLKey, baseURL)

const asyncComponent = shallowRef(null)

const from = {
  hash: undefined,
  path: undefined,
}
// Hash to scroll to once the page being loaded has rendered.
let pendingHash = ''
// Each load gets a number; only the latest may update the page, emit errors
// or redirect, so a slow page the user has already left cannot take over.
let latestLoad = 0

function importComponent(templateName) {
  switch (templateName) {
    case 'Index':
      return import('./IndexPage.vue')
    case 'Class':
      return import('./ClassPage.vue')
    case 'Namespace':
      return import('./NamespacePage.vue')
  }
}
function loadPage(routePageName) {
  const load = ++latestLoad
  const isLatest = () => load === latestLoad
  const source = baseURL.value
  asyncComponent.value = defineAsyncComponent({
    loader: () => {
      const pageName = routePageName ? routePageName : 'index'
      let templateName
      // Wrapped in a promise so an unsupported page type is handled by the
      // same .catch() below as fetch and parse failures.
      return new Promise((resolve) => {
        templateName = determineTemplateName(routePageName)
        resolve()
      })
        .then(() => doxygenCache.fetchPage({ baseURL: source, pageName }))
        .then((page) =>
          Promise.all([
            importComponent(templateName),
            pageName === 'index'
              ? null
              : doxygenCache.fetchDependeePages({ baseURL: source, pageName }),
          ]).then(([module]) => {
            if (isLatest()) {
              scrollAfterRender()
            }
            // Bind this load's data to the component it renders, so pages
            // never share (and overwrite) each other's data.
            const PageComponent = module.default
            return {
              name: 'DoxygenPageContent',
              render: () => h(PageComponent, { data: page, name: pageName }),
            }
          })
        )
        .catch((error) => {
          if (!isLatest()) {
            // The user has already moved on to another page.
            return LoadingComponent
          }
          emit('error', error)
          if (error?.kind === DoxygenErrorKind.NOT_FOUND) {
            router.push({
              name: pageNotFoundName.value,
              query: {
                path: route.path,
              },
            })
            return LoadingComponent
          }
          // Any other failure is shown in place by the errorComponent.
          throw error
        })
    },
    // A component to use while the async component is loading
    loadingComponent: LoadingComponent,
    // A component to use if the load fails
    errorComponent: PageLoadError,
  })
}
function determineTemplateName(pageName) {
  let templateName = 'Index'
  if (pageName) {
    if (pageName.startsWith('class')) {
      templateName = 'Class'
    } else if (pageName.startsWith('namespace')) {
      templateName = 'Namespace'
    } else {
      throw unsupportedPageError(pageName, baseURL.value)
    }
  }

  return templateName
}
function scrollTo(hash) {
  const elem = document.getElementById(hash)
  if (elem) {
    window.scrollTo({
      top: elem.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth',
    })
  }
}
// Called when a page has loaded: it renders in the next update, so a timer
// (of at least scrollDelay) runs after the target element exists.
function scrollAfterRender() {
  const hash = pendingHash
  pendingHash = ''
  if (hash) {
    const load = latestLoad
    setTimeout(() => {
      if (load === latestLoad) {
        scrollTo(hash)
      }
    }, scrollDelay.value ?? 0)
  }
}
function showPage(to) {
  pendingHash = to.hash ? to.hash.slice(1) : ''
  loadPage(to.params.pageName)
}
function handleRouteChange(to) {
  const toHash = to.hash ? to.hash.slice(1) : ''
  const toPath = to.path
  const samePage = toPath === from.path
  if (samePage && toHash !== from.hash) {
    scrollTo(toHash)
  }
  // Store this route as the previous route.
  from.hash = toHash
  from.path = toPath
  return samePage
}
watch(
  route,
  (to) => {
    const current = handleRouteChange(to)

    if (!current) {
      showPage(to)
    }
  },
  { immediate: true }
)
// A different source shown under the same route: reload the current page.
watch(baseURL, () => {
  showPage(route)
})
</script>
