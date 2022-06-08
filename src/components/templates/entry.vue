<template>
  <component :is="entryType" :="attrs">
      <component
        v-for="(c, index) in children"
        :key="'child_' + index"
        :is="c.component"
        :properties="c.properties"
      />
  </component>
</template>

<script setup>
import { toRefs, ref } from 'vue'
import { useChildren } from '../../composables/doxygenchildren'

const props = defineProps({
  properties: Object,
})

const { properties } = toRefs(props)
const attrs = ref({})
const entryType = ref("")

const { children } = useChildren(properties.value.element)

for (const a of properties.value.element.attributes) {
  if (a.name === "thead") {
    entryType.value = a.value === "yes" ? "th" : "td"
  } else {
    attrs.value[a.name] = a.value
  }
}

</script>
