<template>
  <dl>
    <dt><strong>{{ heading }}</strong></dt>
    <dd>
      <ul>
        <component
          v-for="(c, index) in children"
          :key="'child_' + index"
          :is="c.component"
          :properties="c.properties"
        />
      </ul>
    </dd>
  </dl>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useChildren } from '../../composables/doxygenchildren'

const props = defineProps({
  properties: Object,
})

const { properties } = toRefs(props)

const { children } = useChildren(properties.value.element)

const heading = computed(() => {
  const kind = properties.value.element.getAttribute('kind')
  return kind === 'see' ? 'See also' : kind.charAt(0).toUpperCase() + kind.slice(1)
})
</script>

<style scoped></style>
