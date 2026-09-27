import { computed } from 'vue'

import Error from '../components/ErrorComponent.vue'
import LinkedText from '../components/LinkedText.vue'
import SimpleTag from '../components/SimpleTag.vue'

import computeroutput from '../components/templates/computeroutput.vue'
import entry from '../components/templates/entry.vue'
import mdash from '../components/templates/mdash.vue'
import ndash from '../components/templates/ndash.vue'
import parameterlist from '../components/templates/parameterlist.vue'
import plaintext from '../components/templates/plaintext.vue'
import simplesect from '../components/templates/simplesect.vue'
import sp from '../components/templates/sp.vue'
import table from '../components/templates/table.vue'
import ulink from '../components/templates/ulink.vue'


const nodeNameTagNameMap = new Map([
  ['bold', 'strong'],
  ['codeline', 'span'],
  ['emphasis', 'em'],
  ['highlight', 'mark'],
  ['itemizedlist', 'ul'],
  ['linebreak', 'br'],
  ['listitem', 'li'],
  ['orderedlist', 'ol'],
  ['para', 'span'],
  ['parameterdescription', 'span'],
  ['parameteritem', 'li'],
  ['parametername', 'code'],
  ['parameternamelist', 'span'],
  ['programlisting', 'code'],
  ['row', 'tr'],
])

const nodeNameComponentMap = new Map([
  ['computeroutput', computeroutput],
  ['entry', entry],
  ['parameterlist', parameterlist],
  ['ref', LinkedText],
  ['simplesect', simplesect],
  ['table', table],
  ['ulink', ulink],
])

// Elements with no content of their own.
const nodeNameEmptyComponentMap = new Map([
  ['mdash', mdash],
  ['ndash', ndash],
  ['nonbreakablespace', sp],
  ['sp', sp],
])

// `skip` lists element names the caller renders itself (e.g. a <title>).
export function useChildren(element, { skip = [] } = {}) {
  const children = computed(() => {
    let childComponents = []
    for (const node of element.childNodes) {
      let childComponent = undefined
      if (skip.includes(node.nodeName)) {
        continue
      } else if (node.nodeName === '#text') {
        childComponent = {
          component: plaintext,
          properties: { text: node.nodeValue },
        }
      } else if (nodeNameTagNameMap.has(node.nodeName)) {
        childComponent = {
          component: SimpleTag,
          properties: {
            element: node,
            tag: nodeNameTagNameMap.get(node.nodeName),
          },
        }
      } else if (nodeNameComponentMap.has(node.nodeName)) {
        childComponent = {
          component: nodeNameComponentMap.get(node.nodeName),
          properties: {
            element: node,
          },
        }
      } else if (nodeNameEmptyComponentMap.has(node.nodeName)) {
        childComponent = {
          component: nodeNameEmptyComponentMap.get(node.nodeName),
          properties: {},
        }
      } else {
        childComponent = {
          component: Error,
          properties: {
            name: node.nodeName,
          },
        }
      }
      childComponents.push(childComponent)
    }

    return childComponents
  })
  return {
    children,
  }
}
