<template>
  <dl :id="data.id" class="variable">
    <dt class="variable-definition">
      <code>{{ declaration }}</code>
    </dt>
    <dd>
      <brief-description :element="briefDescriptionElement" />
    </dd>
  </dl>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { defaultBriefDescription } from '../js/utilities'

import BriefDescription from './BriefDescription.vue'

const props = defineProps({
  data: Object,
})

const { data } = toRefs(props)

// Array bounds are in argsString ('[4]'); add them if the definition lacks them.
const declaration = computed(() => {
  const { definition, argsString = '' } = data.value
  return definition.endsWith(argsString) ? definition : definition + argsString
})
const briefDescriptionElement = computed(() => {
  return defaultBriefDescription(data.value.brief)
})
</script>
