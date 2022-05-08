<script>
import { doxygenChildren } from '../mixins/DoxygenChildren.js'

export default {
  name: 'BriefDescription',
  mixins: [doxygenChildren],
  data() {
    return {
      tagName: 'span'
    }
  }
}
</script>

<style scoped></style>
