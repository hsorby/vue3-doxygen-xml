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
import { computed, inject, onMounted, toRefs, ref } from 'vue'
import { baseURLKey, useDoxygenCache } from '../js/doxygencache'
import { DoxygenErrorKind } from '../js/errors'

import { parseLinkedTextType } from '../js/doxygenparser'
import { decodeHTML } from '../js/utilities'

const props = defineProps({
  properties: Object,
  item: Object,
})

const { properties, item } = toRefs(props)
const derivedLink = ref({ path: '', hash: '' })
const derivedItem = ref(null)
const doxygenCache = useDoxygenCache()
const baseURL = inject(baseURLKey)

if (properties.value) {
  derivedItem.value = parseLinkedTextType(properties.value.element)
} else {
  derivedItem.value = item.value
}

onMounted(() => {
  if (derivedItem.value.reference === null) {
    // C++ library defined types end up here, which we will ignore as they do not have
    // any reference information associated with them.
    return
  }
  if (derivedItem.value.reference.refKind === 'member') {
    derivedLink.value.path = doxygenCache.getPageIdForReferenceId(
      baseURL.value,
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
  const modifiedReferenceId = referenceId.replace(
    encodedDoubleColon,
    doubleColonText
  )
  const splitModifiedReferenceId = modifiedReferenceId.split('_')
  let splitReferenceId = []
  for (const entry of splitModifiedReferenceId) {
    splitReferenceId.push(entry.replace(doubleColonText, encodedDoubleColon))
  }
  if (attempt < splitReferenceId.length) {
    // We are given a reference id so this won't match a page name which we need.
    // So we will split on '_' and then start to stitch a page name together.
    let potentialPageName = splitReferenceId.splice(0, attempt).join('_')
    doxygenCache
      .fetchPage({
        baseURL: baseURL.value,
        pageName: potentialPageName,
      })
      .then((response) => {
        derivedLink.value.path = response.id
      })
      .catch((error) => {
        // A missing file just means this guess was wrong: try a longer name.
        // Anything else (network, server, parse) won't be fixed by guessing.
        if (error?.kind === DoxygenErrorKind.NOT_FOUND) {
          fetchPageBasedOnReferenceId(referenceId, attempt + 1)
        } else {
          console.warn(
            `Could not resolve link for reference '${referenceId}':`,
            error
          )
        }
      })
  } else {
    throw `Could not determine the page that reference '${referenceId}' came from.`
  }
}

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
