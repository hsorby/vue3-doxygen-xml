<template>
  <span>
    <template v-if="derivedItem.reference === null && derivedItem.text">
      {{ decodedText }}
    </template>
    <template v-else-if="derivedItem.reference !== null">
      {{ preDecodedText }}
      <router-link
        :to="{
          path: derivedLink.path,
          hash: derivedLink.hash,
          // params: derivedItem.link.params,
        }"
        >{{ decodedText }}</router-link
      >
      {{ postDecodedText }}
    </template>
  </span>
</template>

<script setup>
import { computed, onMounted, toRefs, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

import { getPageStem } from '../router/modules/doxygen'
import { parseLinkedTextType } from '../js/doxygenparser'
import { decodeHTML } from '../js/utilities'

const props = defineProps({
  properties: Object,
  item: Object,
  link: Object,
})

const { properties, item, link } = toRefs(props)
const derivedLink = ref({ path: '', hash: '' })
const derivedItem = ref(null)
const store = useStore()
const route = useRoute()

if (properties.value) {
  derivedItem.value = parseLinkedTextType(properties.value.element)
} else {
  derivedItem.value = item.value
}

onMounted(() => {
  if (link.value) {
    derivedLink.value = link.value
  }

  if (derivedItem.value.reference === null) {
    // C++ library defined types end up here, which we will ignore as they do not have
    // any reference information associated with them.
    return
  }
  if (derivedItem.value.reference.refKind === 'member') {
    derivedLink.value.path = store.getters['doxygen/getPageIdForReferenceId'](
      pageStem.value,
      derivedItem.value.reference.refId
    )
    let hashRef = derivedItem.value.reference.refId
    if (!hashRef.startsWith('#')) {
      hashRef = '#' + hashRef
    }
    derivedLink.value.hash = hashRef

    if (derivedLink.value.path === undefined) {
      derivedLink.value.path = ''
      fetchPageBasedOnReferenceId(derivedItem.value.reference.refId, 1)
    }
  } else if (derivedItem.value.reference.refKind === 'compound') {
    derivedLink.value.path = derivedItem.value.reference.refId
    derivedLink.value.hash = ''
  } else {
    throw 'Found a doxygen ref that is not being handled! Eeek.'
  }
})
function fetchPageBasedOnReferenceId(referenceId, attempt) {
  // We will replace '_1_1' which we will interpret as '::' before we split
  // and then replace it after the fact.
  const doubleColonText = '<tmp-double-colon>'
  const encodedDoubleColon = '_1_1'
  const modifiedReferenceId = referenceId.replace(encodedDoubleColon, doubleColonText)
  const splitModifiedReferenceId = modifiedReferenceId.split('_')
  let splitReferenceId = []
  for (const entry of splitModifiedReferenceId) {
    splitReferenceId.push(entry.replace(doubleColonText, encodedDoubleColon))
  }
  if (attempt < splitReferenceId.length) {
    // We are given a reference id so this won't match a page name which we need.
    // So we will split on '_' and then start to stitch a page name together.
    let potentialPageName = splitReferenceId.splice(0, attempt).join('_')
    const baseURL = store.getters['doxygen/getBaseUrl'](pageStem.value)
    store
      .dispatch('doxygen/fetchPage', {
        page_name: potentialPageName,
        page_stem: pageStem.value,
        page_url: baseURL,
      })
      .then((response) => {
        derivedLink.value.path = response.id
      })
      .catch(() => {
        fetchPageBasedOnReferenceId(referenceId, attempt + 1)
      })
  } else {
    throw `Could not determine the page that reference '${referenceId}' came from.`
  }
}

const pageStem = computed(() => {
  return getPageStem(route)
})
const decodedText = computed(() => {
  if (derivedItem.value.reference !== null) {
    return derivedItem.value.linkedText
  }
  // Add a cheeky space here after linked text
  // that can't be linked. Shows up in return values
  // for PublicFunctin function declarations.
  return `${derivedItem.value.text} `
})
const preDecodedText = computed(() => {
  const preText = derivedItem.value.text.split(derivedItem.value.linkedText)[0]
  return decodeHTML(preText)
})
const postDecodedText = computed(() => {
  const postText = derivedItem.value.text.split(derivedItem.value.linkedText)[1]
  return decodeHTML(postText)
})
</script>
