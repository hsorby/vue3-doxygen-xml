<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren.js'
import { h } from 'vue';

export default {
  name: 'computeroutput',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  // Override the mixin render function
  render() {
    return h(
      'code', // tag name
      [
        h(
          'span',
          { class: ['pre'] },
          this.children.map(child => {
            if (typeof child === 'string') {
              return child
            }
            return h(child[0], child[1])
          })
        )
      ] // array of children
    )
  }
}
</script>

<style scoped></style>
