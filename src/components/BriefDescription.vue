<script>
import { doxygenChildren } from '../mixins/DoxygenChildren.vue'

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
