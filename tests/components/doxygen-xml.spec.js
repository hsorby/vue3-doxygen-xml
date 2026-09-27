import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDoxygenCache } from '../../src/js/doxygencache'
import {
  classXml,
  func,
  indexXml,
  loaded,
  memberId,
  mountAt,
  namespaceXml,
  serve,
  settle,
  compoundXml,
  text,
  unmountAll,
  variable,
} from '../helpers/doxygen'

const heading = (wrapper) => wrapper.find('h1').exists() ? wrapper.find('h1').text() : undefined
const hrefs = (wrapper) => wrapper.findAll('a[href]').map((a) => a.attributes('href'))

beforeEach(() => {
  useDoxygenCache().clear()
})
afterEach(() => {
  unmountAll()
})

describe('loading pages', () => {
  it('shows a class page', async () => {
    serve({ classA: classXml('classA', 'A') })
    const { wrapper, errors } = await mountAt('/help/classA')
    expect(heading(wrapper)).toBe('Class A reference')
    expect(errors).toEqual([])
  })

  it('shows the page for the current URL when an earlier page loads later (bug 6)', async () => {
    serve({ classSlow: classXml('classSlow', 'Slow'), classFast: classXml('classFast', 'Fast') }, { delays: { classSlow: 50 } })
    const { wrapper, router } = await mountAt('/help/classSlow', {}, { wait: false })
    await router.push('/help/classFast')
    await settle(100)
    await loaded(wrapper)
    expect(router.currentRoute.value.path).toBe('/help/classFast')
    expect(heading(wrapper)).toBe('Class Fast reference')
  })

  it('does not redirect when a page the user has left fails to load (bug 6)', async () => {
    serve({ classFast: classXml('classFast', 'Fast') }, { delays: { classGone: 50 } })
    const { wrapper, router } = await mountAt('/help/classGone', {}, { wait: false })
    await router.push('/help/classFast')
    await settle(100)
    await loaded(wrapper)
    expect(router.currentRoute.value.path).toBe('/help/classFast')
    expect(heading(wrapper)).toBe('Class Fast reference')
  })

  it('shows a class whose base class page cannot be loaded (bug 5)', async () => {
    serve({
      classD: classXml('classD', 'D', { bases: [{ refId: 'interfaceB', name: 'B' }, { refId: 'classGone', name: 'Gone' }] }),
      interfaceB: compoundXml('interfaceB', 'B', 'interface'),
    })
    const { wrapper, router, errors } = await mountAt('/help/classD')
    expect(router.currentRoute.value.path).toBe('/help/classD')
    expect(heading(wrapper)).toBe('Class D reference')
    expect(errors).toEqual([])
  })

  it('reloads the page from the new source when baseURL changes', async () => {
    serve({ '/v1/classA': classXml('classA', 'A one'), '/v2/classA': classXml('classA', 'A two') })
    const { wrapper, state } = await mountAt('/help/classA', { baseURL: '/v1' })
    expect(heading(wrapper)).toBe('Class A one reference')
    state.baseURL = '/v2'
    await settle(10)
    await loaded(wrapper)
    expect(heading(wrapper)).toBe('Class A two reference')
  })
})

describe('errors', () => {
  it('redirects to the not-found route and emits not-found', async () => {
    serve({})
    const { wrapper, router, errors } = await mountAt('/help/classGone')
    expect(router.currentRoute.value.fullPath).toBe('/404?path=/help/classGone')
    expect(wrapper.find('#not-found').exists()).toBe(true)
    expect(errors.map((e) => e.kind)).toEqual(['not-found'])
  })

  it('shows server errors in place and emits http', async () => {
    // Vue reports the failed loader; the error component is the expected result.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    serve({ classA: Object.assign(new Error('failed'), { response: { status: 500 } }) })
    const { wrapper, router, errors } = await mountAt('/help/classA')
    expect(router.currentRoute.value.path).toBe('/help/classA')
    expect(text(wrapper)).toContain('The documentation server returned an error')
    expect(errors.map((e) => [e.kind, e.status])).toEqual([['http', 500]])
  })

  it('emits unsupported for page types it cannot show, without fetching', async () => {
    // Vue reports the failed loader; the error component is the expected result.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const getPage = serve({})
    const { wrapper, errors } = await mountAt('/help/x_8h')
    expect(getPage).not.toHaveBeenCalled()
    expect(errors.map((e) => e.kind)).toEqual(['unsupported'])
    expect(text(wrapper)).toContain('not supported yet')
    expect(errors[0].message).toContain('class, struct, union and namespace')
    expect(wrapper.find('[name]').exists()).toBe(false)
  })
})

describe('index page', () => {
  const index = indexXml({
    namespaces: [['namespacens', 'ns']],
    classes: [['classns_1_1A', 'ns::A'], ['classGlobal', 'Global']],
  })

  it.each(['/help', '/help/', '/help?version=2', '/help#top'])('links to pages under the route from %s (bug 8)', async (path) => {
    serve({ index })
    const { wrapper } = await mountAt(path)
    expect(hrefs(wrapper)).toEqual(['/help/namespacens', '/help/classns_1_1A', '/help/classGlobal'])
  })

  it('lists classes outside any namespace (bug 4)', async () => {
    serve({ index })
    const { wrapper } = await mountAt('/help')
    expect(text(wrapper)).toContain('Global')
  })
})

describe('deep links (bug 9)', () => {
  const far = classXml('classFar', 'Far', { sections: { 'public-func': [func(memberId('classFar'), 'target')] } })

  it.each([
    ['loads quickly', 0],
    ['loads slower than scrollDelay', 60],
  ])('scrolls to the linked member when the page %s', async (_, delay) => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    serve({ classNear: classXml('classNear', 'Near'), classFar: far }, { delays: { classFar: delay } })
    const { wrapper, router } = await mountAt('/help/classNear', { scrollDelay: 10 })
    await router.push(`/help/classFar#${memberId('classFar')}`)
    await settle(delay + 100)
    await loaded(wrapper)
    await settle(50)
    expect(document.getElementById(memberId('classFar'))).not.toBeNull()
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })
})

describe('links', () => {
  it('links a nested-class member to the nested class page (bug 7)', async () => {
    const target = memberId('classOuter_1_1Inner')
    serve({
      classOuter: classXml('classOuter', 'Outer', {
        detailed: `<para>See <ref refid="${target}" kindref="member">Inner::f</ref>.</para>`,
      }),
      classOuter_1_1Inner: classXml('classOuter_1_1Inner', 'Outer::Inner'),
    })
    const { wrapper } = await mountAt('/help/classOuter')
    await settle(10)
    expect(wrapper.find('[id^=detailed_section] a').attributes('href')).toBe(`/help/classOuter_1_1Inner#${target}`)
  })

  it('links members of classes nested in namespaces without guessing file names', async () => {
    const target = memberId('classns_1_1Outer_1_1Inner')
    const getPage = serve({
      classX: classXml('classX', 'X', {
        detailed: `<para>See <ref refid="${target}" kindref="member">Inner::f</ref>.</para>`,
      }),
      classns_1_1Outer: classXml('classns_1_1Outer', 'ns::Outer'),
      classns_1_1Outer_1_1Inner: classXml('classns_1_1Outer_1_1Inner', 'ns::Outer::Inner'),
    })
    const { wrapper } = await mountAt('/help/classX')
    await settle(10)
    expect(wrapper.find('[id^=detailed_section] a').attributes('href')).toBe(`/help/classns_1_1Outer_1_1Inner#${target}`)
    expect(getPage.mock.calls.map(([, name]) => name)).toEqual(['classX', 'classns_1_1Outer_1_1Inner'])
  })

  it('leaves a member link unresolved, without an unhandled error, when its page is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    serve({
      classX: classXml('classX', 'X', {
        detailed: `<para>See <ref refid="${memberId('classGone')}" kindref="member">Gone::f</ref>.</para>`,
      }),
    })
    const { wrapper } = await mountAt('/help/classX')
    await settle(20)
    expect(wrapper.find('[id^=detailed_section]').text()).toContain('Gone::f')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('shows the text around a link in a type', async () => {
    serve({
      classA: classXml('classA', 'A'),
      classX: classXml('classX', 'X', {
        sections: { 'public-func': [func(memberId('classX'), 'f', { params: [{ typeXml: 'const <ref refid="classA" kindref="compound">A</ref> &amp;', name: 'a' }] })] },
      }),
    })
    const { wrapper } = await mountAt('/help/classX')
    const dt = wrapper.find('dl.function dt')
    expect(dt.text().replace(/\s+/g, ' ')).toContain('const A & a')
    expect(dt.find('a').attributes('href')).toBe('/help/classA')
  })

  it('lists inherited static functions among all members', async () => {
    const make = memberId('classBase', 1)
    serve({
      classBase: classXml('classBase', 'Base', { sections: { 'public-static-func': [func(make, 'make')] } }),
      classD: classXml('classD', 'D', {
        bases: [{ refId: 'classBase', name: 'Base' }],
        members: [{ refId: make, scope: 'Base', name: 'make' }],
      }),
    })
    const { wrapper } = await mountAt('/help/classD')
    const allMembers = wrapper.find('.column-wrapper')
    expect(allMembers.text()).toContain('make')
    expect(allMembers.find('a').attributes('href')).toBe(`/help/classBase#${make}`)
  })
})

describe('structs and unions', () => {
  const x = memberId('structPoint', 1)
  const m = memberId('structPoint', 2)
  const origin = memberId('structPoint', 3)
  const point = classXml('structPoint', 'Point', {
    kind: 'struct',
    sections: {
      'public-attrib': [variable(x, 'x', 'double'), variable(m, 'm', 'double', { args: '[4]' })],
      'public-static-attrib': [variable(origin, 'origin', 'const Point')],
    },
    members: [
      { refId: x, scope: 'Point', name: 'x' },
      { refId: m, scope: 'Point', name: 'm' },
    ],
  })

  it('shows a struct page with its data members', async () => {
    serve({ structPoint: point })
    const { wrapper, errors } = await mountAt('/help/structPoint')
    expect(errors).toEqual([])
    expect(heading(wrapper)).toBe('Struct Point reference')
    const summary = wrapper.find('[id^=public_attributes_section]')
    expect(summary.find('h2').text()).toBe('Public Attributes')
    const cells = (section) => section.findAll('tr').map((tr) => tr.findAll('td').map((td) => td.text()))
    expect(cells(summary)).toEqual([['double', 'x'], ['double', 'm[4]']])
    expect(summary.findAll('a').map((a) => a.attributes('href'))).toEqual([`/help/structPoint#${x}`, `/help/structPoint#${m}`])
    expect(cells(wrapper.find('[id^=public_static_attributes_section]'))).toEqual([['const Point', 'origin']])
    // Each data member has an anchor with its documentation.
    expect(wrapper.find(`[id="${m}"]`).text()).toContain('double m[4]')
    expect(wrapper.find(`[id="${origin}"]`).text()).toContain('A variable.')
  })

  it('lists data members among all members', async () => {
    serve({ structPoint: point })
    const { wrapper } = await mountAt('/help/structPoint')
    expect(wrapper.find('.column-wrapper').text().replace(/\s+/g, ' ')).toContain('m[4] : double')
  })

  it('shows public data members of classes too', async () => {
    serve({ classC: classXml('classC', 'C', { sections: { 'public-attrib': [variable(memberId('classC'), 'count')] } }) })
    const { wrapper } = await mountAt('/help/classC')
    expect(heading(wrapper)).toBe('Class C reference')
    expect(wrapper.find('[id^=public_attributes_section] tr').findAll('td').map((td) => td.text())).toEqual(['int', 'count'])
  })

  it('shows a union page', async () => {
    serve({ unionU: classXml('unionU', 'U', { kind: 'union' }) })
    const { wrapper } = await mountAt('/help/unionU')
    expect(heading(wrapper)).toBe('Union U reference')
  })

  it('lists data members inherited from a struct base class', async () => {
    serve({
      structPoint: point,
      classD: classXml('classD', 'D', {
        bases: [{ refId: 'structPoint', name: 'Point' }],
        members: [{ refId: x, scope: 'Point', name: 'x' }],
      }),
    })
    const { wrapper } = await mountAt('/help/classD')
    const allMembers = wrapper.find('.column-wrapper')
    expect(allMembers.text()).toContain('x')
    expect(allMembers.find('a').attributes('href')).toBe(`/help/structPoint#${x}`)
    expect(wrapper.find('a[href="/help/structPoint"]').text()).toBe('Point')
  })

  it('opens a struct from the index and from its namespace page', async () => {
    serve({
      index: indexXml({ namespaces: [['namespacens', 'ns']], structs: [['structns_1_1Point', 'ns::Point']] }),
      namespacens: namespaceXml('namespacens', 'ns', { classes: [['structns_1_1Point', 'ns::Point']] }),
      structns_1_1Point: classXml('structns_1_1Point', 'ns::Point', { kind: 'struct' }),
    })
    const { wrapper, router } = await mountAt('/help')
    expect(hrefs(wrapper)).toContain('/help/structns_1_1Point')
    await router.push('/help/namespacens')
    await loaded(wrapper)
    await wrapper.find('a[href="/help/structns_1_1Point"]').trigger('click')
    await settle(10)
    await loaded(wrapper)
    expect(router.currentRoute.value.path).toBe('/help/structns_1_1Point')
    expect(heading(wrapper)).toBe('Struct ns::Point reference')
  })
})

describe('rendering', () => {
  it('shows <, > and & as text, not entities (bug 10)', async () => {
    serve({
      'classFoo_3_01int_01_4': classXml('classFoo_3_01int_01_4', 'Foo< int >', {
        sections: { 'public-func': [func(memberId('classFoo_3_01int_01_4'), 'operator<', { type: 'bool', args: '(const Foo &o) const', params: [{ type: 'const Foo &', name: 'o' }] })] },
      }),
    })
    const { wrapper } = await mountAt('/help/classFoo_3_01int_01_4')
    expect(heading(wrapper)).toBe('Class Foo< int > reference')
    expect(text(wrapper)).toContain('operator<(const Foo &o) const')
    expect(text(wrapper)).not.toMatch(/&(lt|gt|amp);/)
  })

  it('gives the namespace section its id and lists variables (bugs 12, 3)', async () => {
    serve({
      namespacens: namespaceXml('namespacens', 'ns', { sections: { var: [variable(memberId('namespacens'), 'answer', 'const int')] } }),
    })
    const { wrapper } = await mountAt('/help/namespacens')
    expect(wrapper.find('section').attributes('id')).toBe('namespacens')
    expect(text(wrapper)).toContain('Variables')
    expect(text(wrapper)).toContain('answer')
  })

  it('renders links, dashes and list headings in descriptions (bug 13)', async () => {
    serve({
      classDoc: classXml('classDoc', 'Doc', {
        detailed:
          '<para>See <ulink url="https://example.org/spec">the spec</ulink>, pages 1<ndash/>2.' +
          '<parameterlist kind="templateparam"><parameteritem><parameternamelist><parametername>T</parametername></parameternamelist><parameterdescription><para>element type</para></parameterdescription></parameteritem></parameterlist>' +
          '<parameterlist kind="exception"><parameteritem><parameternamelist><parametername>std::bad_alloc</parametername></parameternamelist><parameterdescription><para>when out of memory</para></parameterdescription></parameteritem></parameterlist>' +
          '<simplesect kind="return"><para>the value</para></simplesect></para>',
      }),
    })
    const { wrapper } = await mountAt('/help/classDoc')
    const detailed = wrapper.find('[id^=detailed_section]')
    expect(detailed.find('a[href="https://example.org/spec"]').text()).toBe('the spec')
    expect(detailed.text()).toContain('pages 1–2')
    expect(detailed.text()).not.toContain('Missing:')
    expect(detailed.findAll('dt').map((dt) => dt.text())).toEqual(['Template Parameters', 'Exceptions', 'Returns'])
  })
})
