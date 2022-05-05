<script>
import { doxygenChildren } from '../mixins/DoxygenChildren.vue'

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
