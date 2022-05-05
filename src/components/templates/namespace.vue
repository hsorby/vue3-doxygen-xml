<template>
  <div class="namespace-container">
    <section id="data.id">
      <h1>Namespace {{ data.name }} reference</h1>
      <brief-description :data="briefDescription" />
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
      </ul>
    </section>
  </div>
</template>

<script>
import BriefDescription from '../BriefDescription'
import PublicFunction from '../PublicFunction'
import Typedef from '../Typedef'

import { isEmptyTextElement, decodeHTML } from '../../js/utilities'

export default {
  name: 'Namespace',
  components: { BriefDescription, PublicFunction, Typedef },
  props: {
    data: {
      type: Object,
      required: true
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
    haveTypeDefs() {
      return this.haveSection('typedef')
    },
    typeDefs() {
      return this.getSection('typedef')
    },
    haveFunctions() {
      return this.haveSection('func')
    },
    functions() {
      return this.getSection('func')
    }
  },
  methods: {
    decodeHTML(text) {
      return decodeHTML(text)
    },
    haveSection(variant) {
      let have = false
      for (let i = 0; !have && i < this.data.sections.length; i++) {
        const section = this.data.sections[i]
        if (section.kind === variant && section.members.length) {
          have = true
        }
      }
      return have
    },
    getSection(variant) {
      let members = undefined
      for (
        let i = 0;
        members === undefined && i < this.data.sections.length;
        i++
      ) {
        let section = this.data.sections[i]
        if (section.kind === variant) {
          members = section.members
        }
      }
      return members
    }
  }
}
</script>

<style scoped></style>
