<template>
  <component :is="state.component" :data="state.data" :name="state.name" />
</template>

<script setup>
import {
  defineAsyncComponent,
  defineProps,
  onUpdated,
  shallowReactive,
  toRefs,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

import LoadingComponent from './Loading.vue'
import ErrorComponent from './Default.vue'

import { getPageStem } from '../router/modules/doxygen'

const props = defineProps({
  baseURL: String,
  scrollDelay: Number
})

const { baseURL, scrollDelay } = toRefs(props)
const store = useStore()
const router = useRouter()

let previousRoute = {
  path: undefined,
  hash: undefined,
}

const state = shallowReactive({
  component: undefined,
  name: '<not-set>',
  data: {},
})

onUpdated(() => {
  const to = router.currentRoute.value
  setTimeout(() => {
    const hash = to.hash.slice(1)
    const elem = document.getElementById(hash)
    if (elem) {
      previousRoute.hash = hash
      window.scrollTo({
        top: elem.offsetTop,
        behavior: 'smooth',
      })
    }
  }, scrollDelay.value)
})
watchEffect(() => {
  const to = router.currentRoute.value
  const pageURL = baseURL.value
  const currentHash = to.hash ? to.hash.slice(1) : ''
  const currentPath = to.path.replace(to.hash, '')

  if (
    currentPath === previousRoute.path &&
    currentHash &&
    previousRoute.hash !== undefined &&
    previousRoute.hash !== currentHash
  ) {
    const elem = document.getElementById(currentHash)
    window.scrollTo({
      top: elem.offsetTop,
      behavior: 'smooth',
    })
    previousRoute.hash = currentHash
    return
  }
  previousRoute.hash = currentHash
  previousRoute.path = currentPath

  let pageName = to.params.pageName
  if (pageName) {
    if (pageName.startsWith('class')) {
      state.name = 'class'
    } else if (pageName.startsWith('namespace')) {
      state.name = 'namespace'
    } else {
      throw `Have not yet learnt how to deal with ${pageName} files.`
    }
  } else {
    state.name = 'index'
    pageName = 'index'
  }

  const pageStem = getPageStem(to)
  state.component = defineAsyncComponent({
    loader: () => {
      return store
        .dispatch('doxygen/fetchPage', {
          page_name: pageName,
          page_stem: pageStem,
          page_url: pageURL,
        })
        .then((pageData) => {
          state.data = pageData
          if (pageName === 'index') {
            return import(`./templates/${state.name}.vue`)
          } else {
            return store
              .dispatch('doxygen/fetchDependeePages', {
                page_name: pageName,
                page_stem: pageStem,
                page_url: pageURL,
              })
              .then(() => {
                return import(`./templates/${state.name}.vue`)
              })
          }
        })
    },
    // A component to use while the async component is loading
    loadingComponent: LoadingComponent,
    // A component to use if the load fails
    errorComponent: ErrorComponent,
  })
})
</script>
