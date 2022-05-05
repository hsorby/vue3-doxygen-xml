<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren.vue'

export default {
  name: 'sp',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  // Override the mixin render function
  render() {
    return this._v(' ')
  }
}
</script>

<style scoped></style>
