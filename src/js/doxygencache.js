import { markRaw, shallowReactive } from 'vue'

import DoxygenService from '../services/DoxygenService'
import { parsePage } from './doxygenparser'

// Injection key used by DoxygenPage to provide its baseURL (a ref) to
// descendant components, so they can look up pages from the same source.
export const baseURLKey = Symbol('vue3-doxygen-xml:baseURL')

// Module-level cache of parsed Doxygen pages, shared by all components and
// kept for the lifetime of the page. Pages are grouped by the baseURL they
// were fetched from, so different Doxygen sources never collide, whatever
// routes they are displayed under.
//
// Only `pages` is reactive: ClassPage reads it inside a computed.
// It is shallow so that the Map itself is tracked, but the parsed page
// objects (large, read-only trees) are not deep-proxied.
const pages = shallowReactive(new Map()) // baseURL -> Page[]
const inflight = new Map() // baseURL -> Map<pageName, Promise<Page>>

// '/xml' and '/xml/' refer to the same source.
function sourceKey(baseURL) {
  return (baseURL ?? '').replace(/\/+$/, '')
}

function getPageById(baseURL, id) {
  return pages.get(sourceKey(baseURL))?.find((page) => page.id === id)
}

function findPageForReference(baseURL, reference) {
  return pages
    .get(sourceKey(baseURL))
    ?.find((page) => reference.startsWith(page.id))
}

function hasPageForReferenceId(baseURL, reference) {
  return findPageForReference(baseURL, reference) !== undefined
}

function getPageIdForReferenceId(baseURL, reference) {
  return findPageForReference(baseURL, reference)?.id
}

function appendPage(baseURL, page) {
  const key = sourceKey(baseURL)
  // Set a new array so the shallowReactive Map triggers its dependants.
  pages.set(key, [...(pages.get(key) ?? []), markRaw(page)])
}

function getDependeePages({ baseURL, id, recursive }) {
  const originalPage = getPageById(baseURL, id)
  let dependentPages = []
  if (
    originalPage &&
    Object.prototype.hasOwnProperty.call(originalPage, 'baseClasses')
  ) {
    originalPage.baseClasses.forEach((baseClass) => {
      if (baseClass.refId) {
        const dependentPage = getPageById(baseURL, baseClass.refId)
        if (dependentPage !== undefined) {
          dependentPages.push(dependentPage)
          if (recursive) {
            const dependentDependentPages = getDependeePages({
              baseURL,
              id: dependentPage.id,
              recursive: true,
            })
            dependentPages = [
              ...new Set([...dependentPages, ...dependentDependentPages]),
            ]
          }
        }
      }
    })
  }
  return dependentPages
}

function fetchPage({ baseURL, pageName }) {
  const key = sourceKey(baseURL)
  const existingPage = getPageById(key, pageName)
  if (existingPage) {
    return Promise.resolve(existingPage)
  }
  if (!inflight.has(key)) {
    inflight.set(key, new Map())
  }
  const flights = inflight.get(key)
  if (flights.has(pageName)) {
    return flights.get(pageName)
  }
  const pending = DoxygenService.getPage(key, pageName)
    .then((response) => {
      const page = parsePage(pageName, response.data)
      appendPage(key, page)
      return page
    })
    .catch(() => {
      throw 'Page not found'
    })
    .finally(() => {
      flights.delete(pageName)
    })
  flights.set(pageName, pending)
  return pending
}

async function fetchDependeePages({ baseURL, pageName }) {
  let dependentPage = getPageById(baseURL, pageName)
  if (dependentPage === undefined) {
    dependentPage = await fetchPage({ baseURL, pageName })
  }
  const pageNames = []
  if (Object.prototype.hasOwnProperty.call(dependentPage, 'baseClasses')) {
    dependentPage.baseClasses.forEach((baseClass) => {
      if (baseClass.refId) {
        pageNames.push(baseClass.refId)
      }
    })
  }

  const promises = []
  pageNames.forEach((name) => {
    promises.push(fetchPage({ baseURL, pageName: name }))
    promises.push(fetchDependeePages({ baseURL, pageName: name }))
  })

  return Promise.all(promises)
}

const doxygenCache = {
  getPageById,
  hasPageForReferenceId,
  getPageIdForReferenceId,
  getDependeePages,
  fetchPage,
  fetchDependeePages,
}

export function useDoxygenCache() {
  return doxygenCache
}
