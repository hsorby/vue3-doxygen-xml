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
