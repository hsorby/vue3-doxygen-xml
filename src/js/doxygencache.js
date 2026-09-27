import { markRaw, shallowReactive } from 'vue'

import DoxygenService from '../services/DoxygenService'
import { parsePage } from './doxygenparser'
import { fetchError, parseError } from './errors'

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
let generation = 0 // bumped by clear(), so older requests don't refill the cache

// '/xml' and '/xml/' refer to the same source.
function sourceKey(baseURL) {
  return (baseURL ?? '').replace(/\/+$/, '')
}

function getPageById(baseURL, id) {
  return pages.get(sourceKey(baseURL))?.find((page) => page.id === id)
}

// Doxygen member ids are '<compound id>_1<anchor>', where the anchor is a
// letter followed by 32 hex digits, e.g. classOuter_1_1Inner_1a3f2c...
const memberIdPattern = /^(.+)_1[a-z][0-9a-f]{32}$/

// The id of the page (class, namespace, ...) that a member id belongs to,
// or undefined if `reference` is not a member id.
export function compoundIdForMemberId(reference) {
  return memberIdPattern.exec(reference)?.[1]
}

function findPageForReference(baseURL, reference) {
  const list = pages.get(sourceKey(baseURL)) ?? []
  const exact = list.find((page) => page.id === reference)
  if (exact) {
    return exact
  }
  const compoundId = compoundIdForMemberId(reference)
  if (compoundId) {
    return list.find((page) => page.id === compoundId)
  }
  // Unrecognised id format: fall back to the longest page id that the
  // reference starts with, followed by Doxygen's '_1' separator.
  return list
    .filter((page) => reference.startsWith(page.id + '_1'))
    .sort((a, b) => b.id.length - a.id.length)[0]
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
  const details = { pageName, baseURL: key, url: `${key}/${pageName}.xml` }
  const requestGeneration = generation
  // Rejects with a DoxygenPageError (see errors.js) whose `kind` says
  // whether fetching or parsing failed.
  const pending = DoxygenService.getPage(key, pageName)
    .catch((error) => {
      throw fetchError(error, details)
    })
    .then((response) => {
      let page
      try {
        page = parsePage(pageName, response.data)
      } catch (error) {
        throw parseError(error, details)
      }
      if (requestGeneration === generation) {
        appendPage(key, page)
      }
      return page
    })
    .finally(() => {
      flights.delete(pageName)
    })
  flights.set(pageName, pending)
  return pending
}

// Load a page and, recursively, the pages of its base classes. Rejects only
// if the page itself cannot be loaded: a base class page that fails (a struct,
// a missing file, ...) just means its inherited members are not listed.
async function fetchDependeePages({ baseURL, pageName }) {
  const page =
    getPageById(baseURL, pageName) ?? (await fetchPage({ baseURL, pageName }))
  const baseNames = (page.baseClasses ?? [])
    .map((baseClass) => baseClass.refId)
    .filter(Boolean)
  return Promise.allSettled(
    baseNames.map((name) => fetchDependeePages({ baseURL, pageName: name }))
  )
}

// Forget all cached pages, e.g. after the documentation has been rebuilt.
function clear() {
  generation++
  pages.clear()
  inflight.clear()
}

const doxygenCache = {
  getPageById,
  hasPageForReferenceId,
  getPageIdForReferenceId,
  getDependeePages,
  fetchPage,
  fetchDependeePages,
  clear,
}

export function useDoxygenCache() {
  return doxygenCache
}
