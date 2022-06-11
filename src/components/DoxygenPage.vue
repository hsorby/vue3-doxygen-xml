<template>
  <component :is="asyncComponent" :data="pageData" :name="basePageName" />
</template>

<script setup>
import { defineAsyncComponent, ref, shallowRef, toRefs, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import LoadingComponent from './LoadingComponent.vue'
import ErrorComponent from './ErrorComponent.vue'

import { getPageStem } from '../router/modules/doxygen'

const props = defineProps({
  baseURL: String,
  scrollDelay: Number,
  pageNotFoundName: {
    type: String,
    default: '404',
  },
})

const { baseURL, pageNotFoundName, scrollDelay } = toRefs(props)
const store = useStore()
const router = useRouter()
const route = useRoute()

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
function loadPage(pageStem, pageName, templateName) {
  asyncComponent.value = defineAsyncComponent({
    loader: () => {
      pageName = pageName ? pageName : 'index'
      basePageName.value = pageName
      return store
        .dispatch('doxygen/fetchPage', {
          page_name: pageName,
          page_stem: pageStem,
          page_url: baseURL.value,
        })
        .then((response) => {
          pageData.value = response
          if (pageName === 'index') {
            return importComponent(templateName)
          } else {
            return store
              .dispatch('doxygen/fetchDependeePages', {
                page_name: pageName,
                page_stem: pageStem,
                page_url: baseURL.value,
              })
              .then(() => {
                return importComponent(templateName)
              })
          }
        })
        .catch(() => {
          router.push({
            name: pageNotFoundName.value,
            query: {
              path: route.path,
            },
          })
          return LoadingComponent
        })
    },
    // A component to use while the async component is loading
    loadingComponent: LoadingComponent,
    // A component to use if the load fails
    errorComponent: ErrorComponent,
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
      throw `Have not yet learnt how to deal with ${pageName} files.`
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
      const pageStem = getPageStem(to)
      let pageName = to.params.pageName

      const templateName = determineTemplateName(pageName)
      loadPage(pageStem, pageName, templateName)
    }
  },
  { immediate: true }
)
</script>
