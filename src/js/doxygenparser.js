import { UnsupportedDoxygenContent } from './errors'

// All lookups are scoped to direct children (`:scope > name`) so that, for
// example, a function's <type> is never taken from its <templateparamlist>.
// Text is read with textContent: innerHTML would re-escape <, > and & as
// entities (operator&lt;, Foo&lt; int &gt;).

function child(element, name) {
  return element ? element.querySelector(`:scope > ${name}`) : null
}

function children(element, name) {
  return element ? [...element.querySelectorAll(`:scope > ${name}`)] : []
}

function text(element) {
  return element ? element.textContent : ''
}

function splitNamespace(name) {
  return name.split('::')
}

// Compound kinds shown with the class page template.
const classKinds = new Set(['class', 'struct', 'union'])

function parseMainPage(xmlDoc) {
  const root = xmlDoc.documentElement
  const compound = (element) => ({
    kind: element.getAttribute('kind'),
    name: text(child(element, 'name')),
    refId: element.getAttribute('refid'),
  })

  const namespaces = children(root, 'compound[kind="namespace"]').map(
    (element) => ({ ...compound(element), classes: [] })
  )
  const namespacesByName = new Map(namespaces.map((n) => [n.name, n]))

  // Classes, structs and unions outside any namespace.
  const classes = []
  children(root, 'compound')
    .filter((element) => classKinds.has(element.getAttribute('kind')))
    .forEach((element) => {
      const item = compound(element)
      // 'a::b::C' belongs to namespace 'a::b'; 'a::Outer::Inner' (a nested
      // class) to 'a'. Try the longest enclosing scope first.
      const parts = splitNamespace(item.name)
      let owner = undefined
      for (let i = parts.length - 1; i > 0 && !owner; i--) {
        owner = namespacesByName.get(parts.slice(0, i).join('::'))
      }
      if (owner) {
        owner.classes.push(item)
      } else {
        classes.push(item)
      }
    })

  const files = children(root, 'compound[kind="file"]').map(compound)

  return {
    id: 'index',
    namespaces,
    classes,
    files,
  }
}

function getDescriptions(element) {
  return {
    brief: child(element, 'briefdescription'),
    detailed: child(element, 'detaileddescription'),
  }
}

function parseLocationType(element) {
  return {
    header: element ? element.getAttribute('file') : '',
  }
}

function parseRefTextType(element) {
  return {
    refId: element.getAttribute('refid'),
    refKind: element.getAttribute('kindref'),
    text: element.textContent,
  }
}

export function parseLinkedTextType(element) {
  if (!element) {
    return { text: '', linkedText: '', reference: null }
  }
  const refElement = element.querySelector('ref')
  let linkedText = ''
  let reference = null
  if (element.hasAttribute('refid')) {
    reference = parseRefTextType(element)
    linkedText = reference.text
  } else if (refElement && refElement.hasAttribute('refid')) {
    reference = parseRefTextType(refElement)
    linkedText = reference.text
  }

  return {
    text: element.textContent,
    linkedText,
    reference,
  }
}

function parseCompoundRefs(elements) {
  return elements.map((element) => ({
    name: element.textContent,
    refId: element.getAttribute('refid'),
    accessSpecifier: element.getAttribute('prot'),
    virtual: element.getAttribute('virt') !== 'non-virtual',
  }))
}

function parseListOfAllMembers(element) {
  return children(element, 'member[prot="public"]').map((member) => ({
    refId: member.getAttribute('refid'),
    accessSpecifier: member.getAttribute('prot'),
    scope: text(child(member, 'scope')),
    name: text(child(member, 'name')),
  }))
}

function parseParam(element) {
  return {
    paramType: parseLinkedTextType(child(element, 'type')),
    // Unnamed parameters, e.g. `void f(int)`, have no <declname>.
    name: text(child(element, 'declname')),
  }
}

function parseTemplateParam(element) {
  return {
    type: text(child(element, 'type')),
    name: text(child(element, 'declname')),
  }
}

function parseFunction(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    kind: 'function',
    id: element.getAttribute('id'),
    brief,
    detailed,
    templateParams: children(child(element, 'templateparamlist'), 'param').map(
      parseTemplateParam
    ),
    params: children(element, 'param').map(parseParam),
    returnType: parseLinkedTextType(child(element, 'type')),
    accessSpecifier: element.getAttribute('prot'),
    definition: text(child(element, 'definition')),
    argsString: text(child(element, 'argsstring')),
    name: text(child(element, 'name')),
    location: parseLocationType(child(element, 'location')),
  }
}

function parseEnumValue(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    brief,
    detailed,
    name: text(child(element, 'name')),
  }
}

function parseEnum(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    kind: 'enum',
    brief,
    detailed,
    name: text(child(element, 'name')),
    enumValues: children(element, 'enumvalue').map(parseEnumValue),
  }
}

function parseTypedef(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    kind: 'typedef',
    definition: text(child(element, 'definition')),
    typedefType: parseLinkedTextType(child(element, 'type')),
    brief,
    detailed,
    name: text(child(element, 'name')),
  }
}

function parseVariable(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    kind: 'variable',
    definition: text(child(element, 'definition')),
    // e.g. '[4]' for an array
    argsString: text(child(element, 'argsstring')),
    varType: parseLinkedTextType(child(element, 'type')),
    brief,
    detailed,
    name: text(child(element, 'name')),
  }
}

const memberParsers = {
  enum: parseEnum,
  function: parseFunction,
  typedef: parseTypedef,
  variable: parseVariable,
}

function isDeleted(member) {
  return (
    member.kind === 'function' &&
    member.argsString.replace(/\s/g, '').endsWith('=delete')
  )
}

// Parse the <memberdef>s of the given <sectiondef>s. Member kinds this library
// cannot show yet (defines, friends, signals, ...) are skipped rather than
// failing the whole page, and deleted functions are left out.
function parseMembers(sectionElements) {
  return sectionElements
    .flatMap((section) => children(section, 'memberdef'))
    .map((memberDef) => {
      const parser = memberParsers[memberDef.getAttribute('kind')]
      return parser ? parser(memberDef) : null
    })
    .filter((member) => member && !isDeleted(member))
}

function parseNamespace(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    name: text(child(element, 'compoundname')),
    brief,
    detailed,
    classes: children(element, 'innerclass').map((classElement) => ({
      name: classElement.textContent,
      refId: classElement.getAttribute('refid'),
    })),
    sections: children(element, 'sectiondef').map((section) => ({
      members: parseMembers([section]),
      kind: section.getAttribute('kind'),
    })),
  }
}

function parseClass(element) {
  const { brief, detailed } = getDescriptions(element)
  const sections = (kind) => children(element, `sectiondef[kind="${kind}"]`)
  return {
    id: element.getAttribute('id'),
    // 'class', 'struct' or 'union': Doxygen describes all three the same way.
    kind: element.getAttribute('kind'),
    name: text(child(element, 'compoundname')),
    brief,
    detailed,
    baseClasses: parseCompoundRefs(children(element, 'basecompoundref')),
    derivedClasses: parseCompoundRefs(children(element, 'derivedcompoundref')),
    location: parseLocationType(child(element, 'location')),
    listOfAllMembers: parseListOfAllMembers(child(element, 'listofallmembers')),
    publicTypes: parseMembers(sections('public-type')),
    publicFunctions: parseMembers(sections('public-func')),
    publicStaticFunctions: parseMembers(sections('public-static-func')),
    publicAttributes: parseMembers(sections('public-attrib')),
    publicStaticAttributes: parseMembers(sections('public-static-attrib')),
  }
}

export function parsePage(reference, pageText) {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(pageText, 'text/xml')
  if (xmlDoc.querySelector('parsererror')) {
    throw new Error(
      'response is not well-formed XML (is the server returning an HTML page for missing files?)'
    )
  }
  if (xmlDoc.documentElement.nodeName === 'doxygenindex') {
    return parseMainPage(xmlDoc)
  }
  const compoundDef = xmlDoc.querySelector(`compounddef[id="${reference}"]`)
  if (!compoundDef) {
    throw new Error(
      `no <compounddef id="${reference}"> element found; is this Doxygen XML output?`
    )
  }
  const kind = compoundDef.getAttribute('kind')
  if (kind === 'namespace') {
    return parseNamespace(compoundDef)
  }
  if (classKinds.has(kind)) {
    return parseClass(compoundDef)
  }
  throw new UnsupportedDoxygenContent(
    `compound kind '${kind}' for reference '${reference}'`
  )
}
