<template>
  <component :is="asyncComponent" :data="pageData" :name="basePageName" />
</template>

<script setup>
import { defineAsyncComponent, provide, ref, shallowRef, toRefs, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { baseURLKey, useDoxygenCache } from '../js/doxygencache'
import { DoxygenErrorKind, unsupportedPageError } from '../js/errors'

import LoadingComponent from './LoadingComponent.vue'
import PageLoadError from './PageLoadError.vue'

const props = defineProps({
  baseURL: String,
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
const basePageName = ref('-undefined-')
const pageData = ref({})

const from = {
  hash: undefined,
  path: undefined,
}

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
  asyncComponent.value = defineAsyncComponent({
    loader: () => {
      const pageName = routePageName ? routePageName : 'index'
      let templateName
      // Wrapped in a promise so an unsupported page type is handled by the
      // same .catch() below as fetch and parse failures.
      return new Promise((resolve) => {
        templateName = determineTemplateName(routePageName)
        basePageName.value = pageName
        resolve()
      })
        .then(() =>
          doxygenCache.fetchPage({
            baseURL: baseURL.value,
            pageName,
          })
        )
        .then((response) => {
          pageData.value = response
          if (pageName === 'index') {
            return importComponent(templateName)
          } else {
            return doxygenCache
              .fetchDependeePages({
                baseURL: baseURL.value,
                pageName,
              })
              .then(() => {
                return importComponent(templateName)
              })
          }
        })
        .catch((error) => {
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
      top: elem.offsetTop,
      behavior: 'smooth',
    })
  }
}
function showPage(to) {
  loadPage(to.params.pageName)
}
function handleRouteChange(to) {
  const toHash = to.hash ? to.hash.slice(1) : ''
  const toPath = to.path.replace(to.hash, '')
  if (toPath !== from.path && toHash) {
    setTimeout(() => {
      scrollTo(toHash)
    }, scrollDelay.value)
  } else if (toPath === from.path && toHash !== from.hash) {
    scrollTo(toHash)
  }

  const samePage = toPath === from.path
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
