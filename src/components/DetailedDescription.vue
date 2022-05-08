<script>
import { doxygenChildren } from '../mixins/DoxygenChildren.js'

export default {
  name: 'DetailedDescription',
  mixins: [doxygenChildren],
  data() {
    return {
      tagName: 'dd'
    }
  }
}
</script>

<style scoped></style>
