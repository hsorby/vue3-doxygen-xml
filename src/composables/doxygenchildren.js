import { computed } from 'vue'

import Error from '../components/ErrorComponent.vue'
import LinkedText from '../components/LinkedText.vue'
import SimpleTag from '../components/SimpleTag.vue'

import computeroutput from '../components/templates/computeroutput.vue'
import entry from '../components/templates/entry.vue'
import mdash from '../components/templates/mdash.vue'
import parameterlist from '../components/templates/parameterlist.vue'
import plaintext from '../components/templates/plaintext.vue'
import simplesect from '../components/templates/simplesect.vue'
import sp from '../components/templates/sp.vue'
import table from '../components/templates/table.vue'


const nodeNameTagNameMap = new Map([
  ['bold', 'strong'],
  ['codeline', 'span'],
  ['emphasis', 'em'],
  ['highlight', 'mark'],
  ['itemizedlist', 'ul'],
  ['listitem', 'li'],
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
])

export function useChildren(element) {
  const children = computed(() => {
    let childComponents = []
    for (const node of element.childNodes) {
      let childComponent = undefined
      if (node.nodeName === '#text') {
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
      } else if (node.nodeName === 'sp') {
        childComponent = {
          component: sp,
          properties: {},
        }
      } else if (node.nodeName === 'mdash') {
        childComponent = {
          component: mdash,
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
