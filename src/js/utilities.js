export const decodeHTML = (encoded) => {
  let elem = document.createElement('textarea')
  elem.innerHTML = encoded
  return elem.value
}

export const removeDeletedFunctions = (functions) => {
  let refIds = []
  let i = functions.length
  while (i--) {
    let currentFunction = functions[i]
    if (currentFunction.argsString.endsWith('=delete')) {
      refIds.push(currentFunction.id)
      functions.splice(i, 1)
    }
  }
  return refIds
}

export const isEmptyTextElement = (node) => {
  let is = true
  for (const child of node.children) {
    if (child.nodeType !== 3) {
      is = false
    }
  }
  if (is && !!node.textContent.trim()) {
    is = false
  }
  return is
}

export const defaultBriefDescription = (briefIn) => {
  let brief = briefIn
  if (isEmptyTextElement(brief)) {
    brief = document.createElement('P')
    brief.innerHTML = 'Brief description is missing.'
  }
  return brief
}
