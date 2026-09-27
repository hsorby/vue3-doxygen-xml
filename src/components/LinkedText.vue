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
import {
  baseURLKey,
  compoundIdForMemberId,
  useDoxygenCache,
} from '../js/doxygencache'
import { DoxygenErrorKind } from '../js/errors'

import { parseLinkedTextType } from '../js/doxygenparser'

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
  const { refId, refKind } = derivedItem.value.reference
  if (refKind === 'member') {
    derivedLink.value.hash = refId.startsWith('#') ? refId : '#' + refId
    const pageId = doxygenCache.getPageIdForReferenceId(baseURL.value, refId)
    if (pageId !== undefined) {
      derivedLink.value.path = pageId
    } else {
      resolveMemberPage(refId)
    }
  } else if (refKind === 'compound') {
    derivedLink.value.path = refId
    derivedLink.value.hash = ''
  } else {
    console.warn(`Doxygen reference kind '${refKind}' is not handled:`, refId)
  }
})

function warnUnresolved(referenceId, error) {
  console.warn(`Could not resolve link for reference '${referenceId}':`, error)
}

// Find (and load) the page a member reference belongs to.
function resolveMemberPage(referenceId) {
  const pageId = compoundIdForMemberId(referenceId)
  if (pageId === undefined) {
    // Not in Doxygen's usual '<compound id>_1<anchor>' form: guess.
    guessPageForReferenceId(referenceId, 1)
    return
  }
  doxygenCache
    .fetchPage({ baseURL: baseURL.value, pageName: pageId })
    .then((page) => {
      derivedLink.value.path = page.id
    })
    .catch((error) => warnUnresolved(referenceId, error))
}

// Fallback for unrecognised reference ids: split the id on '_' and try
// longer and longer prefixes as page names.
function guessPageForReferenceId(referenceId, attempt) {
  const parts = referenceId
    .replace(/_1_1/g, '\u0000')
    .split('_')
    .map((part) => part.replace(/\u0000/g, '_1_1'))
  if (attempt >= parts.length) {
    warnUnresolved(referenceId, 'no page name matched')
    return
  }
  const potentialPageName = parts.slice(0, attempt).join('_')
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
        guessPageForReferenceId(referenceId, attempt + 1)
      } else {
        warnUnresolved(referenceId, error)
      }
    })
}

// The text before and after the linked part, e.g. 'const ' and ' &' for
// 'const A &'. Parsed text is plain (not HTML), so no decoding is needed.
const linkedTextIndex = computed(() =>
  derivedItem.value.text.indexOf(derivedItem.value.linkedText)
)
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
  const index = linkedTextIndex.value
  return index < 0 ? derivedItem.value.text : derivedItem.value.text.slice(0, index)
})
const postDecodedText = computed(() => {
  const index = linkedTextIndex.value
  return index < 0
    ? ''
    : derivedItem.value.text.slice(index + derivedItem.value.linkedText.length)
})
</script>
