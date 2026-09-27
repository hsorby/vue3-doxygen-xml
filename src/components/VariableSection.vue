<template>
  <dl :id="data.id" class="variable">
    <dt class="variable-definition">
      <code>{{ data.definition }}</code>
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

const briefDescriptionElement = computed(() => {
  return defaultBriefDescription(data.value.brief)
})
</script>
