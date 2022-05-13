<template>
  <code>
    <span class="pre">
      <component
        v-for="(c, index) in children"
        :key="'child_' + index"
        :is="c.component"
        :properties="c.properties"
      />
    </span>
  </code>
</template>

<script setup>
import { toRefs } from 'vue'
import { useChildren } from '../../composables/doxygenchildren'

const props = defineProps({
  properties: Object,
})

const { properties } = toRefs(props)

const { children } = useChildren(properties.value.element)

</script>

<style scoped></style>
