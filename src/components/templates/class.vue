<template>
  <div class="class-container">
    <section :id="data.id">
      <h1>Class {{ data.name }} reference</h1>
      <p>
        <brief-description :data="briefDescription" />
        <RouterLink
          :to="{
            name: routeName,
            params: routeParams,
            hash: '#detailed_section_' + data.id
          }"
        >
          More ...</RouterLink
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
            <td><RouterLinkList :links="baseClasses" /></td>
          </tr>
          <tr v-if="derivedClasses.length">
            <td>Inherited by:</td>
            <td><RouterLinkList :links="derivedClasses" /></td>
          </tr>
        </tbody>
      </table>
      <a @click.prevent="onListAllMembers"
        >List of all members, including inherited members</a
      >
      <div
        ref="listOfAllMembers"
        class="column-wrapper"
        :style="{ display: listAllMembersState ? 'block' : 'none' }"
      >
        <ul>
          <li
            v-for="item in simplifiedAllMembersIncludingInherited"
            :key="'list_' + item.refId"
          >
            <router-link
              :to="{
                path: item.link.path,
                hash: item.link.hash
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
                    hash: '#' + publicFunction.id
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
                    hash: '#' + publicStaticFunction.id
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
        <detailed-description :data="detailedDescription" />
      </section>
      <section :id="'member_function_section_' + data.id">
        <h2>Member Function Documentation</h2>
        <PublicFunction
          v-for="publicFunction in allMemberFunctions"
          :data="publicFunction"
          :key="'public_function_decl_' + publicFunction.id"
        />
      </section>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import BriefDescription from '../BriefDescription.vue'
import DetailedDescription from '../DetailedDescription.vue'
import Enum from '../Enum.vue'
import LinkedText from '../LinkedText.vue'
import PublicFunction from '../PublicFunction.vue'
import RouterLinkList from '../RouterLinkList.vue'

import { removeDeletedFunctions, isEmptyTextElement } from '../../js/utilities'
import { getPageStem } from '../../router/modules/doxygen'

export default {
  name: 'Class',
  components: {
    LinkedText,
    BriefDescription,
    DetailedDescription,
    Enum,
    RouterLinkList,
    PublicFunction
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      listAllMembersState: false
    }
  },
  computed: {
    briefDescription() {
      let brief = this.data.brief
      if (isEmptyTextElement(brief)) {
        brief = document.createElement('P')
        brief.innerHTML = 'Brief description is missing.'
      }
      return { element: brief }
    },
    detailedDescription() {
      return { element: this.data.detailed }
    },
    baseClasses() {
      return this.data.baseClasses.filter(baseClass => !!baseClass.refId)
    },
    derivedClasses() {
      return this.data.derivedClasses.filter(baseClass => !!baseClass.refId)
    },
    routeName() {
      return this.$route.name
    },
    routeParams() {
      return this.$route.params
    },
    allMemberFunctions() {
      // Remove all references to functions that have argument strings that end in '=delete'
      removeDeletedFunctions(this.data.publicFunctions)

      return [...this.data.publicFunctions, ...this.data.publicStaticFunctions]
    },
    simplifiedAllMembersIncludingInherited() {
      let simplifiedMembers = []
      const dependees = this.getDependees()
      dependees.forEach(dependee => {
        // Prune out dependee public functions that we don't want.
        removeDeletedFunctions(dependee.publicFunctions)
      })
      this.data.listOfAllMembers.forEach(member => {
        const foundFunction = this.allMemberFunctions.filter(
          fcn => fcn.id === member.refId
        )
        if (foundFunction.length) {
          const memberFunction = foundFunction[0]
          simplifiedMembers.push(
            this.createSimplifiedMember(
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
              fcn => fcn.id === member.refId
            )
            if (foundFunction.length) {
              notFound = false
              const memberFunction = foundFunction[0]
              simplifiedMembers.push(
                this.createSimplifiedMember(
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
      })
      return simplifiedMembers
    },
    ...mapGetters({
      getDependeePages: 'doxygen/getDependeePages'
    })
  },
  methods: {
    onListAllMembers() {
      this.listAllMembersState = !this.listAllMembersState
    },
    getDependees() {
      return this.getDependeePages(getPageStem(this.$route), this.data.id, true)
    },
    createSimplifiedMember(
      refId,
      name,
      argsString,
      returnType,
      targetId,
      routePath
    ) {
      const link = {
        path: routePath ? routePath : this.$route.path,
        hash: '#' + targetId
      }
      return {
        refId,
        name,
        argsString,
        returnType,
        link
      }
    }
  }
}
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
