<template>
  <component :is="asyncComponent" :data="pageData" :name="pageName" />
</template>

<script setup>
import { defineAsyncComponent, defineProps, ref, toRefs, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import LoadingComponent from './Loading.vue'
import ErrorComponent from './Error.vue'

import { getPageStem } from '../router/modules/doxygen'

const props = defineProps({
  baseURL: String,
  scrollDelay: Number,
})

const { baseURL, scrollDelay } = toRefs(props)
const store = useStore()
const route = useRoute()

const asyncComponent = ref(null)
const pageName = ref('')
const pageData = ref({})

const from = {
  hash: undefined,
  path: undefined,
}

function loadPage(pageStem, pageName, templateName) {
  asyncComponent.value = defineAsyncComponent({
    loader: () => {
      pageName = pageName ? pageName : 'index'
      return store
        .dispatch('doxygen/fetchPage', {
          page_name: pageName,
          page_stem: pageStem,
          page_url: baseURL.value,
        })
        .then((response) => {
          pageData.value = response
          if (pageName === 'index') {
            return import(`./${templateName}.vue`)
          } else {
            return store
              .dispatch('doxygen/fetchDependeePages', {
                page_name: pageName,
                page_stem: pageStem,
                page_url: baseURL.value,
              })
              .then(() => {
                return import(`./${templateName}.vue`)
              })
          }
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
