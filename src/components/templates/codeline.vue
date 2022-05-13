<template>
  <simple-tag tag="span" :element="element"></simple-tag>
</template>

<script setup>
import SimpleTag from '../SimpleTag.vue'

const props = defineProps({
  element: undefined,
})
</script>
