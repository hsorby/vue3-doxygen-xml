<script>
import { doxygenChildren } from '../mixins/DoxygenChildren'

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
