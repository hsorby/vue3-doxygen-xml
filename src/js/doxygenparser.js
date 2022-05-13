import { decodeHTML } from './utilities'

function splitNamespace(text) {
  return text.split('::')
}

function parseMainPage(xmlDoc) {
  let namespaceElements = xmlDoc.querySelectorAll('compound[kind="namespace"]')
  let classElements = xmlDoc.querySelectorAll('compound[kind="class"]')
  let fileElements = xmlDoc.querySelectorAll('compound[kind="file"]')

  let namespaces = []
  namespaceElements.forEach(namespaceElement => {
    namespaces.push({
      name: namespaceElement.querySelector('name').innerHTML,
      refId: namespaceElement.getAttribute('refid'),
      classes: []
    })
  })
  classElements.forEach(classElement => {
    const splitNames = splitNamespace(
      classElement.querySelector('name').innerHTML
    )
    let candidateNamespace = namespaces.find(
      namespace => namespace.name === splitNames[0]
    )
    candidateNamespace.classes.push({
      name: classElement.querySelector('name').innerHTML,
      refId: classElement.getAttribute('refid')
    })
  })

  let files = []
  fileElements.forEach(fileElement => {
    files.push({
      name: fileElement.querySelector('name').innerHTML,
      refId: fileElement.getAttribute('refid')
    })
  })

  return {
    id: 'index',
    namespaces,
    files
  }
}

function getDescriptions(element) {
  const brief = element.querySelector(':scope > briefdescription')
  const detailed = element.querySelector(':scope > detaileddescription')

  return {
    brief,
    detailed
  }
}

function parseMemberDefs(element) {
  const memberDefElements = element.querySelectorAll('memberdef')
  let memberDefs = []
  memberDefElements.forEach(memberDefElement => {
    memberDefs.push(processMemberDef(memberDefElement))
  })
  return memberDefs
}

function parseNamespace(element) {
  const id = element.getAttribute('id')
  const name = element.querySelector('compoundname').innerHTML
  const classElements = element.querySelectorAll('innerclass')
  const sectionElements = element.querySelectorAll('sectiondef')
  const { brief, detailed } = getDescriptions(element)
  let classes = []
  classElements.forEach(classElement => {
    classes.push({
      name: classElement.innerHTML,
      refId: classElement.getAttribute('refid')
    })
  })
  let sections = []
  sectionElements.forEach(sectionElement => {
    const members = parseMemberDefs(sectionElement)
    sections.push({
      members,
      kind: sectionElement.getAttribute('kind')
    })
  })

  return {
    id,
    name,
    brief,
    detailed,
    classes,
    sections
  }
}

function parseLocationType(element) {
  return {
    header: element.getAttribute('file')
  }
}

function parseRefTextType(element) {
  return {
    refId: element.getAttribute('refid'),
    refKind: element.getAttribute('kindref'),
    text: element.innerHTML
  }
}

export function parseLinkedTextType(element) {
  const text = element.textContent
  let linkedText = ''
  let reference = null
  const refElement = element.querySelector('ref')
  if (element.hasAttribute('refid')) {
    reference = parseRefTextType(element)
    linkedText = reference.text
  } else if (refElement && refElement.hasAttribute('refid')) {
    reference = parseRefTextType(refElement)
    linkedText = reference.text
  }

  return {
    text,
    linkedText,
    reference
  }
}

function parseCompoundRefs(elements) {
  let compoundRefs = []
  elements.forEach(element => {
    compoundRefs.push({
      name: element.innerHTML,
      refId: element.getAttribute('refid'),
      accessSpecifier: element.getAttribute('prot'),
      virtual: element.getAttribute('virt') !== 'non-virtual'
    })
  })
  return compoundRefs
}

function parseListOfAllMembers(element) {
  let members = []
  element.querySelectorAll('member[prot="public"]').forEach(element => {
    members.push({
      refId: element.getAttribute('refid'),
      accessSpecifier: element.getAttribute('prot'),
      scope: element.querySelector('scope').innerHTML,
      name: element.querySelector('name').innerHTML
    })
  })

  return members
}

function parseParam(element) {
  return {
    paramType: parseLinkedTextType(element.querySelector('type')),
    name: element.querySelector('declname').textContent
  }
}

function parseParams(elements) {
  let params = []
  elements.forEach(element => {
    params.push(parseParam(element))
  })
  return params
}

function parsePublicFunction(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    brief,
    detailed,
    params: parseParams(element.querySelectorAll('param')),
    returnType: parseLinkedTextType(element.querySelector('type')),
    accessSpecifier: element.getAttribute('prot'),
    definition: element.querySelector('definition').innerHTML,
    argsString: decodeHTML(element.querySelector('argsstring').innerHTML),
    name: element.querySelector('name').innerHTML,
    location: parseLocationType(element.querySelector('location'))
  }
}

function parsePublicFunctions(elements) {
  let publicFunctions = []
  elements.forEach(element => {
    const memberDefs = element.querySelectorAll('memberdef')
    memberDefs.forEach(memberDef => {
      publicFunctions.push(processMemberDef(memberDef))
    })
  })

  return publicFunctions
}

function parseEnumValue(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    brief,
    detailed,
    name: element.querySelector('name').innerHTML
  }
}

function parsePublicEnum(element) {
  const { brief, detailed } = getDescriptions(element)
  let enumValues = []
  const enumValueElements = element.querySelectorAll('enumvalue')
  enumValueElements.forEach(enumValue => {
    enumValues.push(parseEnumValue(enumValue))
  })
  return {
    id: element.getAttribute('id'),
    kind: element.getAttribute('kind'),
    brief,
    detailed,
    name: element.querySelector('name').innerHTML,
    enumValues
  }
}

function parsePublicTypedef(element) {
  const { brief, detailed } = getDescriptions(element)
  return {
    id: element.getAttribute('id'),
    definition: element.querySelector('definition').innerHTML,
    typedefType: parseLinkedTextType(element.querySelector('type')),
    brief,
    detailed,
    name: element.querySelector('name').innerHTML
  }
}

function processMemberDef(memberDef) {
  const kind = memberDef.getAttribute('kind')
  let item = undefined
  if (kind === 'enum') {
    item = parsePublicEnum(memberDef)
  } else if (kind === 'function') {
    item = parsePublicFunction(memberDef)
  } else if (kind === 'typedef') {
    item = parsePublicTypedef(memberDef)
  } else {
    throw `Yikes, we have hit an unknown memberDef '${kind}'`
  }

  return item
}

function parsePublicTypes(elements) {
  let publicTypes = []
  elements.forEach(element => {
    const memberDefs = element.querySelectorAll('memberdef')
    memberDefs.forEach(memberDef => {
      publicTypes.push(processMemberDef(memberDef))
    })
  })

  return publicTypes
}

function parseClass(element) {
  const id = element.getAttribute('id')
  const name = element.querySelector('compoundname').innerHTML
  const baseClasses = parseCompoundRefs(
    element.querySelectorAll('basecompoundref')
  )
  const derivedClasses = parseCompoundRefs(
    element.querySelectorAll('derivedcompoundref')
  )
  const { brief, detailed } = getDescriptions(element)
  const location = parseLocationType(element.querySelector('location'))
  let listOfAllMembers = parseListOfAllMembers(
    element.querySelector('listofallmembers')
  )
  let publicTypes = parsePublicTypes(
    element.querySelectorAll('sectiondef[kind="public-type"]')
  )
  let publicFunctions = parsePublicFunctions(
    element.querySelectorAll('sectiondef[kind="public-func"]')
  )
  let publicStaticFunctions = parsePublicFunctions(
    element.querySelectorAll('sectiondef[kind="public-static-func"]')
  )

  return {
    id,
    name,
    brief,
    detailed,
    baseClasses,
    derivedClasses,
    location,
    listOfAllMembers,
    publicTypes,
    publicFunctions,
    publicStaticFunctions
  }
}

export function parsePage(reference, pageText) {
  let parser = new DOMParser()
  let xmlDoc = parser.parseFromString(pageText, 'text/xml')
  const doxygenIndex = xmlDoc.querySelector('doxygenindex')
  let page = null
  if (doxygenIndex) {
    page = parseMainPage(xmlDoc)
  } else {
    const compoundDef = xmlDoc.querySelector(
      'compounddef[id="' + reference + '"'
    )
    const kind = compoundDef.getAttribute('kind')
    if (kind === 'namespace') {
      page = parseNamespace(compoundDef)
    } else if (kind === 'class') {
      page = parseClass(compoundDef)
    } else {
      throw `Dont know what to do with kind: '${kind}' with '${reference}' reference`
    }
  }

  return page
}
