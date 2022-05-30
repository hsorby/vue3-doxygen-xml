<template>
  <h3>Missing: '{{ componentName }}' from Doxygen XML output</h3>
  <span>It seems the component was not found.</span>
</template>

<script setup>
import { computed, toRefs } from 'vue'

const props = defineProps({
  properties: Object,
  name: String,
})

const { properties, name } = toRefs(props)

const componentName = computed(() => {
  return name.value ? name.value : properties.value.name
})
</script>
