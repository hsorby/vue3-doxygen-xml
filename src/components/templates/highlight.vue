<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren'

export default {
  name: 'highlight',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  data() {
    return {
      tagName: 'mark'
    }
  }
}
</script>

<style scoped></style>
