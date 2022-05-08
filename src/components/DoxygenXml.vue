<template>
  <doxygen-page :baseURL="baseURL" :scrollDelay="scrollDelay"></doxygen-page>
</template>

<script setup>
import { defineProps } from 'vue'

import DoxygenPage from './DoxygenPage.vue'

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
