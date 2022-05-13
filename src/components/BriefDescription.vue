<template>
  <simple-tag :properties="{ element: element, tag: 'span' }"></simple-tag>
</template>

<script setup>
import SimpleTag from './SimpleTag.vue'

const props = defineProps({
  element: undefined,
})
</script>
