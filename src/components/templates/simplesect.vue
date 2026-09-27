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

// A \par section carries its heading in a <title> child.
const { children } = useChildren(properties.value.element, { skip: ['title'] })

const headings = {
  return: 'Returns',
  see: 'See also',
}
const heading = computed(() => {
  const element = properties.value.element
  const kind = element.getAttribute('kind')
  if (kind === 'par') {
    return element.querySelector(':scope > title')?.textContent ?? ''
  }
  return headings[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1)
})
</script>

<style scoped></style>
