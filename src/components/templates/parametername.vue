<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren.js'

export default {
  name: 'parametername',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  data() {
    return {
      tagName: 'code'
    }
  }
}
</script>

<style scoped></style>
