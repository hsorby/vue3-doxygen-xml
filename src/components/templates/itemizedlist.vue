<template>
  <simple-tag tag="ul" :element="element"></simple-tag>
</template>

<script setup>
import SimpleTag from '../SimpleTag.vue'

const props = defineProps({
  element: undefined,
})
</script>

