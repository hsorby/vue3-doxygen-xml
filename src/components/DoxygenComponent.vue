<template>
   <component
      v-for="(c, index) in children"
      :key="'child_' + index"
      :is="c.component"
      :properties="c.properties"
    />

</template>

<script setup>
import { useChildren } from '../composables/doxygenchildren';

const props = defineProps({
  data: Object,
  name: String,
})

const { children } = useChildren(data)

</script>
