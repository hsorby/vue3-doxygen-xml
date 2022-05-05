import { parseLinkedTextType } from '../js/doxygenparser'

const childLinkedText = node => {
  const item = parseLinkedTextType(node)
  return [
    'LinkedText',
    {
      props: {
        item
      }
    }
  ]
}

const childDoxygenComponent = node => {
  return [
    'DoxygenComponent',
    {
      props: {
        componentData: {
          element: node
        },
        componentType: node.nodeName
      }
    }
  ]
}

export const doxygenChildren = {
  components: {
    DoxygenComponent: () =>
      import(/* webpackPrefetch: true */ '../components/DoxygenComponent'),
    LinkedText: () =>
      import(/* webpackPrefetch: true */ '../components/LinkedText')
  },
  props: {
    data: {
      type: Object
    }
  },
  render(h) {
    return h(
      this.tagName, // tag name
      {
        class: this.classes
      }, // options
      this.children.map(child => {
        if (typeof child === 'string') {
          return child
        }
        return h(child[0], child[1])
      }) // array of children
    )
  },
  computed: {
    classes() {
      return undefined
    },
    children() {
      let childElements = []
      this.data.element.childNodes.forEach(node => {
        let childElement = undefined
        if (node.nodeName === '#text') {
          childElement = node.nodeValue
        } else if (node.nodeName === 'ref') {
          childElement = childLinkedText(node)
        } else {
          childElement = childDoxygenComponent(node)
        }
        childElements.push(childElement)
      })
      return childElements
    }
  }
}
