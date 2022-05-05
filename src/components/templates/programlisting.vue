<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren'

export default {
  name: 'programlisting',
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
