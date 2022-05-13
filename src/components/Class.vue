<template>
  <div class="class-container">
    <section :id="data.id">
      <h1>Class {{ data.name }} reference</h1>
      <p>
        <brief-description :element="briefDescriptionElement" />
        <router-link
          :to="{
            name: routeName,
            params: routeParams,
            hash: '#detailed_section_' + data.id,
          }"
        >
          More ...</router-link
        >
      </p>
      <table>
        <tbody>
          <tr>
            <td>Header:</td>
            <td>{{ data.location.header }}</td>
          </tr>
          <tr v-if="baseClasses.length">
            <td>Inherits:</td>
            <td><router-link-list :links="baseClasses" /></td>
          </tr>
          <tr v-if="derivedClasses.length">
            <td>Inherited by:</td>
            <td><router-link-list :links="derivedClasses" /></td>
          </tr>
        </tbody>
      </table>
      <a @click.prevent="onListAllMembers"
        >List of all members, including inherited members</a
      >
      <div
        ref="listOfAllMembers"
        class="column-wrapper"
        :style="{ display: showAllMembers ? 'block' : 'none' }"
      >
        <ul>
          <li
            v-for="item in simplifiedAllMembersIncludingInherited"
            :key="'list_' + item.refId"
          >
            <router-link
              :to="{
                path: item.link.path,
                hash: item.link.hash,
                // params: item.link.params,
              }"
              >{{ item.name }}</router-link
            >{{ item.argsString }} :
            <linked-text :item="item.returnType" :link="item.link" />
          </li>
        </ul>
      </div>
      <template v-if="data.publicTypes.length">
        <h2>Public Types</h2>
        <section
          v-for="publicType in data.publicTypes"
          :key="`public_enum_${publicType.id}`"
        >
          <enum v-if="publicType.kind === 'enum'" :data="publicType" />
        </section>
      </template>
      <template v-if="data.publicFunctions.length">
        <section :id="'public_function_section_' + data.id">
          <h2>Public Functions</h2>
          <table>
            <tr
              v-for="publicFunction in data.publicFunctions"
              :key="'public_functions_' + publicFunction.id"
            >
              <td>{{ publicFunction.returnType.text }}</td>
              <td>
                <router-link
                  :to="{
                    path: $route.path,
                    hash: '#' + publicFunction.id,
                    // params: $route.params,
                  }"
                  >{{ publicFunction.name }}</router-link
                >{{ publicFunction.argsString }}
              </td>
            </tr>
          </table>
        </section>
      </template>
      <template v-if="data.publicStaticFunctions.length">
        <section :id="'public_static_functions_section_' + data.id">
          <h2>Public Static Functions</h2>
          <table>
            <tr
              v-for="publicStaticFunction in data.publicStaticFunctions"
              :key="'public_static_functions_' + publicStaticFunction.id"
            >
              <td>{{ publicStaticFunction.returnType.text }}</td>
              <td>
                <router-link
                  :to="{
                    path: $route.path,
                    hash: '#' + publicStaticFunction.id,
                    // params: $route.params,
                  }"
                >
                  {{ publicStaticFunction.name }}</router-link
                >{{ publicStaticFunction.argsString }}
              </td>
            </tr>
          </table>
        </section>
      </template>
      <section :id="'detailed_section_' + data.id">
        <h2>Detailed Description</h2>
        <detailed-description :element="data.detailed" />
      </section>
      <section :id="'member_function_section_' + data.id">
        <h2>Member Function Documentation</h2>
        <public-function
          v-for="publicFunction in allMemberFunctions"
          :data="publicFunction"
          :key="'public_function_decl_' + publicFunction.id"
        />
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, toRefs, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

import BriefDescription from './BriefDescription.vue'
import DetailedDescription from './DetailedDescription.vue'
import Enum from './Enum.vue'
import LinkedText from './LinkedText.vue'
import PublicFunction from './PublicFunction.vue'
import RouterLinkList from './RouterLinkList.vue'

import {
  removeDeletedFunctions,
  defaultBriefDescription,
} from '../js/utilities'
import { getPageStem } from '../router/modules/doxygen'

const props = defineProps({
  data: Object,
  name: String,
})

const { data } = toRefs(props)
const store = useStore()
const route = useRoute()
const showAllMembers = ref(false)

function onListAllMembers() {
  showAllMembers.value = !showAllMembers.value
}
function getDependees() {
  return store.getters['doxygen/getDependeePages'](
    getPageStem(route),
    data.value.id,
    true
  )
}
function createSimplifiedMember(
  refId,
  name,
  argsString,
  returnType,
  targetId,
  routePath
) {
  const link = {
    path: routePath ? routePath : route.path,
    hash: '#' + targetId,
  }
  return {
    refId,
    name,
    argsString,
    returnType,
    link,
  }
}

const briefDescriptionElement = computed(() => {
  return defaultBriefDescription(data.value.brief)
})
const detailedDescription = computed(() => {
  return { element: data.value.detailed }
})
const baseClasses = computed(() => {
  return data.value.baseClasses.filter((baseClass) => !!baseClass.refId)
})
const derivedClasses = computed(() => {
  return data.value.derivedClasses.filter((baseClass) => !!baseClass.refId)
})
const routeName = computed(() => {
  return route.name
})
const routeParams = computed(() => {
  return route.params
})
const allMemberFunctions = computed(() => {
  // Remove all references to functions that have argument strings that end in '=delete'
  removeDeletedFunctions(data.value.publicFunctions)

  return [...data.value.publicFunctions, ...data.value.publicStaticFunctions]
})
const simplifiedAllMembersIncludingInherited = computed(() => {
  let simplifiedMembers = []
  const dependees = getDependees()
  for (const dependee of dependees) {
    // Prune out dependee public functions that we don't want.
    removeDeletedFunctions(dependee.publicFunctions)
  }
  for (const member of data.value.listOfAllMembers) {
    const foundFunction = allMemberFunctions.value.filter(
      (fcn) => fcn.id === member.refId
    )
    if (foundFunction.length) {
      const memberFunction = foundFunction[0]
      simplifiedMembers.push(
        createSimplifiedMember(
          member.refId,
          memberFunction.name,

          memberFunction.argsString,
          memberFunction.returnType,
          memberFunction.id
        )
      )
    } else {
      let notFound = true
      for (let i = 0; i < dependees.length && notFound; i++) {
        let dependee = dependees[i]
        const foundFunction = dependee.publicFunctions.filter(
          (fcn) => fcn.id === member.refId
        )
        if (foundFunction.length) {
          notFound = false
          const memberFunction = foundFunction[0]
          simplifiedMembers.push(
            createSimplifiedMember(
              member.refId,
              memberFunction.name,
              memberFunction.argsString,
              memberFunction.returnType,
              memberFunction.id,
              dependee.id
            )
          )
        }
      }
    }
  }
  return simplifiedMembers
})
</script>

<style scoped>
table td:first-child {
  text-align: right;
}
table td:nth-child(2) {
  padding-left: 1em;
}
.column-wrapper {
  column-count: 2;
}
</style>
