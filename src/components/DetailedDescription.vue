<template>
  <simple-tag :properties="{ element: element, tag: 'dd' }"></simple-tag>
</template>

<script setup>
import SimpleTag from './SimpleTag.vue'

const props = defineProps({
  element: undefined,
})
</script>
