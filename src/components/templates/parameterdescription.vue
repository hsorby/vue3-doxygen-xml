<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren'

export default {
  name: 'parameterdescription',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  data() {
    return {
      tagName: 'span'
    }
  }
}
</script>

<style scoped></style>
