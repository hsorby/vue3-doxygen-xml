<template>
  <div :id="data.id" class="enum">
    <h3>enum {{ data.name }}</h3>
    <brief-description :data="briefDescription" />
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
        <td><brief-description :data="{ element: enumValue.brief }" /></td>
      </tr>
    </table>
  </div>
</template>

<script>
import BriefDescription from './BriefDescription'

export default {
  name: 'Enum',
  components: { BriefDescription },
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    briefDescription() {
      return { element: this.data.brief }
    },
    linkedText() {
      return this.data.enumType
    }
  }
}
</script>
