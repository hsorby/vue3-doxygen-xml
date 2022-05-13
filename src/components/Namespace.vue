<template>
  <section id="data.id">
    <h1>Namespace {{ data.name }} reference</h1>
    <brief-description :element="briefDescriptionElement" />
    <ul class="namespace-group">
      <section :id="data.id + '_classes'">
        <li class="namespace-group-item"><h2>Classes</h2></li>
        <ul class="class-list">
          <li
            v-for="(namespaceClass, namespaceClassIndex) in data.classes"
            :key="data.name + '_' + namespaceClassIndex"
            class="class-list-item"
          >
            <router-link :to="namespaceClass.refId">{{
              namespaceClass.name
            }}</router-link>
          </li>
        </ul>
      </section>
      <section :id="data.id + '_typedefs'" v-if="haveTypeDefs">
        <li class="namespace-group-item"><h2>Type Definitions</h2></li>
        <ul class="typedef-list">
          <li
            v-for="(namespaceTypeDef, namespaceTypeDefIndex) in typeDefs"
            :key="data.name + '_' + namespaceTypeDefIndex"
            class="typedef-list-item"
          >
            <typedef :data="namespaceTypeDef" />
          </li>
        </ul>
      </section>
      <section :id="data.id + '_functions'" v-if="haveFunctions">
        <li class="namespace-group-item"><h2>Functions</h2></li>
        <ul class="namespace-function-list">
          <li
            v-for="(namespaceFunction, namespaceFunctionsIndex) in functions"
            :key="data.name + '_' + namespaceFunctionsIndex"
            class="namespace-function-list-item"
          >
            <public-function :data="namespaceFunction" />
          </li>
        </ul>
      </section>
      <section :id="data.id + '_enums'" v-if="haveEnums">
        <li class="namespace-group-item"><h2>Enumerations</h2></li>
        <ul class="namespace-enumeration-list">
          <li
            v-for="(namespaceEnum, namespaceEnumsIndex) in enums"
            :key="data.name + '_' + namespaceEnumsIndex"
            class="namespace-enumeration-list-item"
          >
            <enum :data="namespaceEnum" />
          </li>
        </ul>
      </section>
    </ul>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'

import BriefDescription from './BriefDescription.vue'
import PublicFunction from './PublicFunction.vue'
import Typedef from './Typedef.vue'
import Enum from './Enum.vue'

import { defaultBriefDescription } from '../js/utilities'

const props = defineProps({
  data: Object,
  name: String,
})

const { data } = toRefs(props)

function getSection(variant) {
  let members = undefined
  for (
    let i = 0;
    members === undefined && i < data.value.sections.length;
    i++
  ) {
    let section = data.value.sections[i]
    if (section.kind === variant) {
      members = section.members
    }
  }
  return members
}
function haveSection(variant) {
  let have = false
  for (let i = 0; !have && i < data.value.sections.length; i++) {
    const section = data.value.sections[i]
    if (section.kind === variant && section.members.length) {
      have = true
    }
  }
  return have
}

const briefDescriptionElement = computed(() => {
  return defaultBriefDescription(data.value.brief)
})
const haveTypeDefs = computed(() => {
  return haveSection('typedef')
})
const typeDefs = computed(() => {
  return getSection('typedef')
})
const haveFunctions = computed(() => {
  return haveSection('func')
})
const functions = computed(() => {
  return getSection('func')
})
const haveEnums = computed(() => {
  return haveSection('enum')
})
const enums = computed(() => {
  return getSection('enum')
})
</script>
