<template>
  <div class="page-load-error">
    <h3>{{ heading }}</h3>
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DoxygenErrorKind } from '../js/errors'

// Shown by DoxygenPage when a page fails to load for a reason other than
// not-found (which redirects to the not-found route instead).
const props = defineProps({
  error: [Error, String],
})

const headings = {
  [DoxygenErrorKind.HTTP]: 'The documentation server returned an error',
  [DoxygenErrorKind.NETWORK]: 'Could not reach the documentation server',
  [DoxygenErrorKind.PARSE]: 'Could not read this documentation page',
}

const heading = computed(
  () => headings[props.error?.kind] ?? 'Could not load this documentation page'
)
const message = computed(() => props.error?.message ?? String(props.error))
</script>
