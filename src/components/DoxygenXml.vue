<template>
  <doxygen-page
    :baseURL="baseURL"
    :scrollDelay="scrollDelay"
    @error="(error) => emit('error', error)"
  ></doxygen-page>
</template>

<script setup>
import DoxygenPage from './DoxygenPage.vue'

// Re-emits DoxygenPageError (see js/errors.js) when a page fails to load.
const emit = defineEmits(['error'])

const props = defineProps({
    baseURL: {
      type: String,
      default: '',
    },
    scrollDelay: {
      type: Number,
      default: 200,
    },
})
</script>
