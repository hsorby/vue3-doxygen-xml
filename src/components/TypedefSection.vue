<template>
  <dl :id="data.id" class="typedef">
    <dt class="typedef-name">
      {{ data.name }}
    </dt>
    <dt>
      <brief-description :element="briefDescriptionElement" />
      (<linked-text :item="data.typedefType" :class="'typedef-linked-text'" />)
    </dt>
    <dt class="typedef-definition">
      {{ processedDefinition }}
    </dt>
  </dl>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { decodeHTML, defaultBriefDescription } from '../js/utilities'

import BriefDescription from './BriefDescription.vue'
import LinkedText from './LinkedText.vue'

const props = defineProps({
  data: Object,
})

const { data } = toRefs(props)

const processedDefinition = computed(() => {
  return decodeHTML(data.value.definition)
})
const briefDescriptionElement = computed(() => {
  return defaultBriefDescription(data.value.brief)
})
</script>
