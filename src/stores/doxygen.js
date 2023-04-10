import { defineStore } from 'pinia'

import DoxygenService from '../services/DoxygenService'
import { parsePage } from '../js/doxygenparser'

export const useDoxygenStore = defineStore('doxygen', {
  state: () => ({
    pages: new Map(),
    urlMap: new Map(),
    inflight: new Map(),
  }),
  getters: {
    getPageById: (state) => (routeURL, id) => {
      return state.pages.get(routeURL).find((page) => page.id === id)
    },
    isInflight: (state) => (routeURL, id) => {
      return !!state.inflight.get(routeURL).get(id)
    },
    getInflight: (state) => (routeURL, id) => {
      return state.inflight.get(routeURL).get(id)
    },
    getBaseUrl: (state) => (routeURL) => {
      return state.urlMap.get(routeURL)
    },
    hasPageForReferenceId: (state) => (routeURL, reference) => {
      const candidatePage = state.pages
        .get(routeURL)
        .find((page) => reference.startsWith(page.id))
      return candidatePage != undefined
    },
    getPageIdForReferenceId: (state) => (routeURL, reference) => {
      const candidatePage = state.pages
        .get(routeURL)
        .find((page) => reference.startsWith(page.id))
      return candidatePage ? candidatePage.id : undefined
    },
  },
  actions: {
    appendPage({ routeURL, page }) {
      let pages = this.pages.get(routeURL)
      if (!pages) {
        pages = []
      }
      pages.push(page)
      this.pages.set(routeURL, pages)
    },
    addInflight(payload) {
      let inflightMap = this.inflight.get(payload.routeURL)
      if (!inflightMap) {
        inflightMap = new Map()
      }
      inflightMap.set(payload.page_name, payload.pending)
      this.inflight.set(payload.routeURL, inflightMap)
    },
    removeInflight({ routeURL, id }) {
      this.inflight.get(routeURL).delete(id)
    },
    registerBaseUrl({ baseURL, routeURL }) {
      const registeredURL = this.pages.get(routeURL)
      if (!registeredURL) {
        this.pages.set(routeURL, [])
        this.urlMap.set(routeURL, baseURL)
        this.inflight.set(routeURL, new Map())
      }
    },
    getDependeePages({routeUrl, id, recursive}) {
      const originalPage = this.getPageById(routeUrl, id)
      let dependentPages = []
      if (Object.prototype.hasOwnProperty.call(originalPage, 'baseClasses')) {
        originalPage.baseClasses.forEach((baseClass) => {
          if (baseClass.refId) {
            const dependentPage = this.getPageById(routeUrl, baseClass.refId)
            if (dependentPage !== undefined) {
              dependentPages.push(dependentPage)
              if (recursive) {
                const dependentDependentPages = this.getDependeePages({
                  routeUrl,
                  id: dependentPage.id,
                  recursive: true
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
    },
    fetchPage(payload) {
      const page_name = payload.page_name
      const page_stem = payload.page_stem
      const base_url = payload.page_url
      this.registerBaseUrl({ baseURL: base_url, routeURL: page_stem })
      const existingPage = this.getPageById(page_stem, page_name)
      if (existingPage) {
        return Promise.resolve(existingPage)
      }
      if (this.isInflight(page_stem, page_name)) {
        return this.getInflight(page_stem, page_name)
      }
      const pending = DoxygenService.getPage(base_url, page_name)
        .then((response) => {
          const page = parsePage(page_name, response.data)
          this.appendPage({ routeURL: page_stem, page })
          this.removeInflight({ routeURL: page_stem, id: page_name })
          return page
        })
        .catch((error) => {
          this.removeInflight({ routeURL: page_stem, id: page_name })
          throw 'Page not found'
        })
      this.addInflight({ routeURL: page_stem, page_name, pending })
      return pending
    },
    async fetchDependeePages(payload) {
      const basePageName = payload.page_name
      const page_stem = payload.page_stem

      let dependentPage = this.getPageById(page_stem, basePageName)
      if (dependentPage === undefined) {
        dependentPage = await this.fetchPage({
          page_name: basePageName,
          page_stem: page_stem,
          page_url: payload.page_url,
        })
      }
      let pageNames = []
      if (Object.prototype.hasOwnProperty.call(dependentPage, 'baseClasses')) {
        dependentPage.baseClasses.forEach((baseClass) => {
          if (baseClass.refId) {
            pageNames.push(baseClass.refId)
          }
        })
      }

      let promises = []
      pageNames.forEach((pageName) => {
        promises.push(
          this.fetchPage({
            page_name: pageName,
            page_stem: page_stem,
            page_url: payload.page_url,
          })
        )
        promises.push(
          this.fetchDependeePages({
            page_name: pageName,
            page_stem: page_stem,
            page_url: payload.page_url,
          })
        )
      })

      return Promise.all(promises)
    },
  },
})
