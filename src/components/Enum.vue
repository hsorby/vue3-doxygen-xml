<template>
  <div :id="data.id" class="enum">
    <h3>enum {{ data.name }}</h3>
    <brief-description :element="briefDescriptionElement" />
    <table>
      <tr>
        <th>Constant</th>
        <th>Description</th>
      </tr>
      <tr
        v-for="(enumValue, index) in data.enumValues"
        :key="`enum_${data.name}_${index}`"
        :id="enumValue.id"
      >
        <td>{{ enumValue.name }}</td>
        <td><brief-description :element="enumValue.brief" /></td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue'

import BriefDescription from './BriefDescription.vue'

import { defaultBriefDescription } from '../js/utilities'

const props = defineProps({
  data: Object,
})

const { data } = toRefs(props)

const briefDescriptionElement = computed(() => {
  return defaultBriefDescription(data.value.brief)
})
</script>
