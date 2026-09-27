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
// DoxygenPage passes data/name to every page component; don't render them as attributes.
defineOptions({ inheritAttrs: false })

const props = defineProps({
  error: [Error, String],
})

const headings = {
  [DoxygenErrorKind.HTTP]: 'The documentation server returned an error',
  [DoxygenErrorKind.NETWORK]: 'Could not reach the documentation server',
  [DoxygenErrorKind.PARSE]: 'Could not read this documentation page',
  [DoxygenErrorKind.UNSUPPORTED]:
    'This kind of documentation page is not supported yet',
}

const heading = computed(
  () => headings[props.error?.kind] ?? 'Could not load this documentation page'
)
const message = computed(() => props.error?.message ?? String(props.error))
</script>
