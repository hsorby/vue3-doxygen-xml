<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren.vue'

export default {
  name: 'parameterlist',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  // Override the mixin render function
  render(h) {
    return h(
      'dl', // tag name
      [
        h('dt', [h('strong', 'Parameters')]),
        h('dd', [
          h(
            'ul',
            this.children.map(child => {
              if (typeof child === 'string') {
                return child
              }
              return h(child[0], child[1])
            })
          )
        ])
      ] // array of children
    )
  }
}
</script>

<style scoped></style>
