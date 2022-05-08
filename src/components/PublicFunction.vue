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
    <detailed-description :data="detailedDescription" />
  </dl>
</template>

<script>
import DetailedDescription from './DetailedDescription.vue'
import LinkedText from './LinkedText.vue'

export default {
  name: 'PublicFunction',
  components: { LinkedText, DetailedDescription },
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    postArgs() {
      let postArgs = ''
      if (this.data.argsString.includes(')')) {
        const splitArgsString = this.data.argsString.split(')')
        postArgs = splitArgsString[splitArgsString.length - 1]
      }
      return postArgs
    },
    detailedDescription() {
      return { element: this.data.detailed }
    }
  }
}
</script>

<style scoped>
/*
dl.function {
  margin-top: 15px;
  margin-bottom: 3px;
}
dl.function > dt {
  font-size: larger;
  border-radius: 25px;
  background-color: #eeeeee;
}
dl.function > dt > span:first-child {
  margin-left: 11px;
}
*/
</style>
