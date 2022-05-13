import DoxygenService from '../../services/DoxygenService'
import { parsePage } from '../../js/doxygenparser'

export const namespaced = true

export const state = {
  pages: new Map(), // Map of routeURL to list of pages
  urlMap: new Map(), // Map of routeURL to baseURL
  inflight: new Map(), // Map of routeURL to map of page name to pending promise
}

export const mutations = {
  APPEND_PAGE(state, { routeURL, page }) {
    let pages = state.pages.get(routeURL)
    if (!pages) {
      pages = []
    }
    pages.push(page)
    state.pages.set(routeURL, pages)
  },
  ADD_INFLIGHT(state, payload) {
    let inflightMap = state.inflight.get(payload.routeURL)
    if (!inflightMap) {
      inflightMap = new Map()
    }
    inflightMap.set(payload.page_name, payload.pending)
    state.inflight.set(payload.routeURL, inflightMap)
  },
  REMOVE_INFLIGHT(state, { routeURL, id }) {
    state.inflight.get(routeURL).delete(id)
  },
  REGISTER_BASE_URL(state, { baseURL, routeURL }) {
    const registeredURL = state.pages.get(routeURL)
    if (!registeredURL) {
      state.pages.set(routeURL, [])
      state.urlMap.set(routeURL, baseURL)
      state.inflight.set(routeURL, new Map())
    }
  },
}

export const actions = {
  fetchPage({ commit, getters }, payload) {
    const page_name = payload.page_name
    const page_stem = payload.page_stem
    const base_url = payload.page_url
    commit('REGISTER_BASE_URL', { baseURL: base_url, routeURL: page_stem })
    const existingPage = getters.getPageById(page_stem, page_name)
    if (existingPage) {
      return Promise.resolve(existingPage)
    }
    if (getters.isInflight(page_stem, page_name)) {
      return getters.getInflight(page_stem, page_name)
    }
    const pending = DoxygenService.getPage(base_url, page_name)
      .then((response) => {
        const page = parsePage(page_name, response.data)
        commit('APPEND_PAGE', { routeURL: page_stem, page })
        commit('REMOVE_INFLIGHT', { routeURL: page_stem, id: page_name })
        return page
      }, () => {
        commit('REMOVE_INFLIGHT', { routeURL: page_stem, id: page_name })
      })
      .catch((error) => {
        commit('REMOVE_INFLIGHT', { routeURL: page_stem, id: page_name })
        // throw error
      })
    commit('ADD_INFLIGHT', { routeURL: page_stem, page_name, pending })
    return pending
  },
  async fetchDependeePages({ dispatch, getters }, payload) {
    const basePageName = payload.page_name
    const page_stem = payload.page_stem

    let dependentPage = getters.getPageById(page_stem, basePageName)
    if (dependentPage === undefined) {
      dependentPage = await dispatch('fetchPage', {
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
        dispatch('fetchPage', {
          page_name: pageName,
          page_stem: page_stem,
          page_url: payload.page_url,
        })
      )
      promises.push(
        dispatch('fetchDependeePages', {
          page_name: pageName,
          page_stem: page_stem,
          page_url: payload.page_url,
        })
      )
    })

    return Promise.all(promises)
  },
  registerBaseURL({ commit }, { baseURL, routeURL }) {
    commit('REGISTER_BASE_URL', { baseURL, routeURL })
  },
}

export const getters = {
  getPageById: (state) => (routeURL, id) => {
    return state.pages.get(routeURL).find((page) => page.id === id)
  },
  // dispalyInflight: state => () => {
  //   console.log(state.inflight)
  // },
  // displayPages: state => () => {
  //   console.log(state.pages)
  // },
  isInflight: (state) => (routeURL, id) => {
    return !!state.inflight.get(routeURL).get(id)
  },
  getInflight: (state) => (routeURL, id) => {
    return state.inflight.get(routeURL).get(id)
  },
  getBaseUrl: (state) => (routeURL) => {
    return state.urlMap.get(routeURL)
  },
  getPageIdForReferenceId: (state) => (routeURL, reference) => {
    const candidatePage = state.pages
      .get(routeURL)
      .find((page) => reference.startsWith(page.id))
    return candidatePage ? candidatePage.id : undefined
  },
  getDependeePages: (state, getters) => (routeURL, id, recursive) => {
    const originalPage = getters.getPageById(routeURL, id)
    let dependentPages = []
    if (Object.prototype.hasOwnProperty.call(originalPage, 'baseClasses')) {
      originalPage.baseClasses.forEach((baseClass) => {
        if (baseClass.refId) {
          const dependentPage = getters.getPageById(routeURL, baseClass.refId)
          if (dependentPage !== undefined) {
            dependentPages.push(dependentPage)
            if (recursive) {
              const dependentDependentPages = getters.getDependeePages(
                routeURL,
                dependentPage.id,
                true
              )
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
}
