<template>
  <div>
    <template v-for="link in links.slice(0, lastIndex)" :key="link.refId">
      <router-link :to="link.refId">{{
        link.name
      }}</router-link>
      <span v-if="linkCount > 2" :key="'span_' + link.refId">, </span>
    </template>
    <template v-if="linkCount > 1">
      <span>and </span>
    </template>
    <router-link :to="links[lastIndex].refId">{{
      links[lastIndex].name
    }}</router-link>
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue'

const props = defineProps({
  links: Array,
})

const { links } = toRefs(props)

const linkCount = computed(() => {
  return links.value.length
})
const lastIndex = computed(() => {
  return links.value.length - 1
})
</script>
