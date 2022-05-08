<script>
import { doxygenChildren } from '../../mixins/DoxygenChildren'
import { h } from 'vue';

export default {
  name: 'simplesect',
  mixins: [doxygenChildren],
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    heading() {
      const kind = this.data.element.getAttribute('kind')

      return kind === 'see'
        ? 'See also'
        : kind.charAt(0).toUpperCase() + kind.slice(1)
    }
  },
  // Override the mixin render function
  render() {
    return h(
      'dl', // tag name
      [
        h('dt', [h('strong', this.heading)]),
        h('dd', [
          h(
            'p',
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
