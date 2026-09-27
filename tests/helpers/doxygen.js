// Helpers for building small Doxygen XML documents and mounting
// <doxygen-xml> with a real router in tests.
import { h, reactive } from 'vue'
import { vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RouterView, createMemoryHistory, createRouter } from 'vue-router'

import DoxygenService from '../../src/services/DoxygenService'
import DoxygenXml from '../../src/components/DoxygenXml.vue'

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function settle(ms = 0) {
  await sleep(ms)
  await flushPromises()
}

// Wait until <doxygen-xml> shows a page (or an error) rather than nothing or
// its loading component. defineAsyncComponent renders nothing for its first
// 200 ms, and the first import() of a page component can take a while.
export async function loaded(wrapper, timeout = 2000) {
  const start = Date.now()
  await settle()
  while (!wrapper.html().trim() || wrapper.find('.loading-container').exists()) {
    if (Date.now() - start > timeout) {
      throw new Error('page did not finish loading')
    }
    await settle(5)
  }
}

// A Doxygen member id: <compound id>_1a<32 hex digits>.
export const memberId = (compoundId, n = 0) =>
  `${compoundId}_1a${n.toString(16).padStart(32, '0')}`

const descriptions = (brief = '', detailed = '') =>
  `<briefdescription>${brief}</briefdescription><detaileddescription>${detailed}</detaileddescription>`

// `typeXml` gives the <type> content as raw XML, e.g. with a <ref> in it.
export function param({ type, typeXml, name }) {
  return `<param><type>${typeXml ?? esc(type)}</type>${name ? `<declname>${esc(name)}</declname>` : ''}</param>`
}

export function func(id, name, { type = 'void', args = '()', params = [], templateParams, detailed = '' } = {}) {
  const tpl = templateParams
    ? `<templateparamlist>${templateParams.map(param).join('')}</templateparamlist>`
    : ''
  return (
    `<memberdef kind="function" id="${id}" prot="public" static="no">${tpl}` +
    `<type>${esc(type)}</type><definition>${esc(type)} ${esc(name)}</definition>` +
    `<argsstring>${esc(args)}</argsstring><name>${esc(name)}</name>` +
    params.map(param).join('') +
    `${descriptions('', detailed)}<location file="x.h" line="1"/></memberdef>`
  )
}

export function variable(id, name, type = 'int') {
  return (
    `<memberdef kind="variable" id="${id}" prot="public" static="no">` +
    `<type>${esc(type)}</type><definition>${esc(type)} ${esc(name)}</definition>` +
    `<argsstring></argsstring><name>${esc(name)}</name>` +
    `${descriptions('<para>A variable.</para>')}<location file="x.h" line="1"/></memberdef>`
  )
}

export function define(id, name) {
  return `<memberdef kind="define" id="${id}" prot="public" static="no"><name>${name}</name>${descriptions()}<location file="x.h" line="1"/></memberdef>`
}

const sectiondefs = (sections = {}) =>
  Object.entries(sections)
    .map(([kind, members]) => `<sectiondef kind="${kind}">${members.join('')}</sectiondef>`)
    .join('')

export function classXml(id, name, { sections = {}, bases = [], members = [], detailed = '' } = {}) {
  return (
    `<?xml version="1.0"?><doxygen><compounddef id="${id}" kind="class" prot="public">` +
    `<compoundname>${esc(name)}</compoundname>` +
    bases
      .map(
        (b) =>
          `<basecompoundref${b.refId ? ` refid="${b.refId}"` : ''} prot="public" virt="non-virtual">${esc(b.name)}</basecompoundref>`
      )
      .join('') +
    sectiondefs(sections) +
    descriptions('<para>Brief.</para>', detailed) +
    `<location file="x.h" line="1"/><listofallmembers>` +
    members
      .map(
        (m) =>
          `<member refid="${m.refId}" prot="public" virt="non-virtual"><scope>${esc(m.scope)}</scope><name>${esc(m.name)}</name></member>`
      )
      .join('') +
    `</listofallmembers></compounddef></doxygen>`
  )
}

export function namespaceXml(id, name, { sections = {}, classes = [] } = {}) {
  return (
    `<?xml version="1.0"?><doxygen><compounddef id="${id}" kind="namespace">` +
    `<compoundname>${esc(name)}</compoundname>` +
    classes.map(([refId, n]) => `<innerclass refid="${refId}" prot="public">${esc(n)}</innerclass>`).join('') +
    sectiondefs(sections) +
    descriptions('<para>Brief.</para>') +
    `<location file="x.h" line="1"/></compounddef></doxygen>`
  )
}

export function structXml(id, name) {
  return `<?xml version="1.0"?><doxygen><compounddef id="${id}" kind="struct"><compoundname>${esc(name)}</compoundname>${descriptions()}<location file="x.h" line="1"/></compounddef></doxygen>`
}

export function indexXml({ namespaces = [], classes = [] } = {}) {
  const compound = (kind) => ([refId, name]) =>
    `<compound refid="${refId}" kind="${kind}"><name>${esc(name)}</name></compound>`
  return `<?xml version="1.0"?><doxygenindex>${namespaces.map(compound('namespace')).join('')}${classes.map(compound('class')).join('')}</doxygenindex>`
}

// Replace DoxygenService.getPage with a fake server.
// `files` maps page names (or "<baseURL>/<page name>") to XML text;
// anything else answers 404. `delays` maps page names to milliseconds.
export function serve(files, { delays = {} } = {}) {
  return vi.spyOn(DoxygenService, 'getPage').mockImplementation(async (baseURL, name) => {
    await sleep(delays[name] ?? 0)
    const xml = files[`${baseURL}/${name}`] ?? files[name]
    if (xml === undefined) {
      throw Object.assign(new Error('Request failed with status code 404'), {
        response: { status: 404 },
      })
    }
    if (xml instanceof Error) {
      throw xml
    }
    return { data: xml }
  })
}

// Mount <doxygen-xml> under /help/:pageName? with a 404 route, at `path`.
// Returns the wrapper, router, reactive props and emitted errors. Waits for
// the page to load unless `wait` is false.
export async function mountAt(path, props = {}, { wait = true } = {}) {
  const errors = []
  const state = reactive({ baseURL: '/xml', scrollDelay: 10, ...props })
  const Help = { render: () => h(DoxygenXml, { ...state, onError: (e) => errors.push(e) }) }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/help/:pageName?', name: 'Help', component: Help },
      { path: '/404', name: '404', component: { render: () => h('p', { id: 'not-found' }, 'NOT FOUND') } },
    ],
  })
  router.push(path)
  await router.isReady()
  const wrapper = mount({ render: () => h(RouterView) }, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  if (wait) {
    await loaded(wrapper)
  } else {
    await settle()
  }
  return { wrapper, router, state, errors }
}

const mounted = []
export function unmountAll() {
  while (mounted.length) {
    mounted.pop().unmount()
  }
}

export const text = (wrapper) => wrapper.text().replace(/\s+/g, ' ').trim()
