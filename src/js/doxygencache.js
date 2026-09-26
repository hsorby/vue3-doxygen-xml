import { markRaw, shallowReactive } from 'vue'

import DoxygenService from '../services/DoxygenService'
import { parsePage } from './doxygenparser'

// Module-level cache of parsed Doxygen pages, shared by all components.
//
// Only `pages` is reactive: ClassPage reads it inside a computed.
// It is shallow so that the Map itself is tracked, but the parsed page
// objects (large, read-only trees) are not deep-proxied.
const pages = shallowReactive(new Map()) // routeURL -> Page[]
const urlMap = new Map() // routeURL -> baseURL
const inflight = new Map() // routeURL -> Map<pageName, Promise<Page>>

function getPageById(routeURL, id) {
  return pages.get(routeURL)?.find((page) => page.id === id)
}

function getBaseUrl(routeURL) {
  return urlMap.get(routeURL)
}

function findPageForReference(routeURL, reference) {
  return pages.get(routeURL)?.find((page) => reference.startsWith(page.id))
}

function hasPageForReferenceId(routeURL, reference) {
  return findPageForReference(routeURL, reference) !== undefined
}

function getPageIdForReferenceId(routeURL, reference) {
  return findPageForReference(routeURL, reference)?.id
}

function registerBaseUrl({ baseURL, routeURL }) {
  if (!pages.has(routeURL)) {
    pages.set(routeURL, [])
    urlMap.set(routeURL, baseURL)
    inflight.set(routeURL, new Map())
  }
}

function appendPage({ routeURL, page }) {
  // Set a new array so the shallowReactive Map triggers its dependants.
  pages.set(routeURL, [...(pages.get(routeURL) ?? []), markRaw(page)])
}

function getDependeePages({ routeUrl, id, recursive }) {
  const originalPage = getPageById(routeUrl, id)
  let dependentPages = []
  if (Object.prototype.hasOwnProperty.call(originalPage, 'baseClasses')) {
    originalPage.baseClasses.forEach((baseClass) => {
      if (baseClass.refId) {
        const dependentPage = getPageById(routeUrl, baseClass.refId)
        if (dependentPage !== undefined) {
          dependentPages.push(dependentPage)
          if (recursive) {
            const dependentDependentPages = getDependeePages({
              routeUrl,
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

function fetchPage({ page_name, page_stem, page_url }) {
  registerBaseUrl({ baseURL: page_url, routeURL: page_stem })
  const existingPage = getPageById(page_stem, page_name)
  if (existingPage) {
    return Promise.resolve(existingPage)
  }
  const flights = inflight.get(page_stem)
  if (flights.has(page_name)) {
    return flights.get(page_name)
  }
  const pending = DoxygenService.getPage(page_url, page_name)
    .then((response) => {
      const page = parsePage(page_name, response.data)
      appendPage({ routeURL: page_stem, page })
      return page
    })
    .catch(() => {
      throw 'Page not found'
    })
    .finally(() => {
      flights.delete(page_name)
    })
  flights.set(page_name, pending)
  return pending
}

async function fetchDependeePages({ page_name, page_stem, page_url }) {
  let dependentPage = getPageById(page_stem, page_name)
  if (dependentPage === undefined) {
    dependentPage = await fetchPage({ page_name, page_stem, page_url })
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
  pageNames.forEach((pageName) => {
    promises.push(fetchPage({ page_name: pageName, page_stem, page_url }))
    promises.push(
      fetchDependeePages({ page_name: pageName, page_stem, page_url })
    )
  })

  return Promise.all(promises)
}

const doxygenCache = {
  getPageById,
  getBaseUrl,
  hasPageForReferenceId,
  getPageIdForReferenceId,
  registerBaseUrl,
  appendPage,
  getDependeePages,
  fetchPage,
  fetchDependeePages,
}

export function useDoxygenCache() {
  return doxygenCache
}
