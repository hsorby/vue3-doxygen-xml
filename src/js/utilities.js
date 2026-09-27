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
