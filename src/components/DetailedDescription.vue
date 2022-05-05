<script>
import { doxygenChildren } from '../mixins/DoxygenChildren'

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
