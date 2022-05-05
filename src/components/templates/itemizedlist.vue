<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren'

export default {
  name: 'itemizedlist',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  data() {
    return {
      tagName: 'ul'
    }
  }
}
</script>

<style scoped></style>
