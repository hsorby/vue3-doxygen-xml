<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren.js'

export default {
  name: 'emphasis',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  data() {
    return {
      tagName: 'em'
    }
  }
}
</script>

<style scoped></style>
