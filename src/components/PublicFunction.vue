<template>
  <dl :id="data.id" class="function">
    <dt>
      <linked-text :item="data.returnType" />
      <code class="sig-name"> {{ data.name }}</code
      >(
      <template v-for="(param, index) in data.params" :key="data.name + '_' + index">
        <span>
          <linked-text :item="param.paramType" /> <em>{{ param.name }}</em>
          <template v-if="index < data.params.length - 1">, </template>
        </span> </template
      >) {{ postArgs }}
    </dt>
    <detailed-description :element="data.detailed" />
  </dl>
</template>

<script setup>
import { computed, toRefs } from 'vue'

import DetailedDescription from './DetailedDescription.vue'
import LinkedText from './LinkedText.vue'

const props = defineProps({
  data: Object,
})

const { data } = toRefs(props)

const postArgs = computed(() => {
      let args = ''
      if (data.value.argsString.includes(')')) {
        const splitArgsString = data.value.argsString.split(')')
        args = splitArgsString[splitArgsString.length - 1]
      }
      return args
})

</script>

