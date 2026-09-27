import { computed } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { compoundIdForMemberId, useDoxygenCache } from '../../src/js/doxygencache'
import { DoxygenErrorKind, DoxygenPageError } from '../../src/js/errors'
import { classXml, memberId, serve, structXml } from '../helpers/doxygen'

const cache = useDoxygenCache()

beforeEach(() => {
  cache.clear()
})

describe('fetchPage', () => {
  it('shares one request between concurrent callers and caches the result', async () => {
    const getPage = serve({ classA: classXml('classA', 'A') }, { delays: { classA: 5 } })
    const first = cache.fetchPage({ baseURL: '/xml', pageName: 'classA' })
    const second = cache.fetchPage({ baseURL: '/xml/', pageName: 'classA' })
    expect(second).toBe(first)
    const page = await first
    expect(await cache.fetchPage({ baseURL: '/xml', pageName: 'classA' })).toBe(page)
    expect(getPage).toHaveBeenCalledTimes(1)
  })

  it('keeps pages from different sources apart', async () => {
    serve({ '/v1/classA': classXml('classA', 'A (v1)'), '/v2/classA': classXml('classA', 'A (v2)') })
    const v1 = await cache.fetchPage({ baseURL: '/v1', pageName: 'classA' })
    const v2 = await cache.fetchPage({ baseURL: '/v2', pageName: 'classA' })
    expect([v1.name, v2.name]).toEqual(['A (v1)', 'A (v2)'])
    expect(cache.getPageById('/v2', 'classA')).toBe(v2)
  })

  it('does not refill the cache from a request that started before clear()', async () => {
    serve({ classA: classXml('classA', 'A') }, { delays: { classA: 5 } })
    const pending = cache.fetchPage({ baseURL: '/xml', pageName: 'classA' })
    cache.clear()
    await pending
    expect(cache.getPageById('/xml', 'classA')).toBeUndefined()
  })

  it('tries again after a failure', async () => {
    const getPage = serve({})
    await expect(cache.fetchPage({ baseURL: '/xml', pageName: 'classA' })).rejects.toThrow()
    await expect(cache.fetchPage({ baseURL: '/xml', pageName: 'classA' })).rejects.toThrow()
    expect(getPage).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['not-found', { response: { status: 404 } }, { status: 404 }],
    ['http', { response: { status: 500 } }, { status: 500 }],
    ['network', { code: 'ECONNABORTED' }, { code: 'ECONNABORTED' }],
  ])('rejects with kind %s for request failures', async (kind, failure, fields) => {
    serve({ classA: Object.assign(new Error('failed'), failure) })
    const error = await cache.fetchPage({ baseURL: '/xml', pageName: 'classA' }).catch((e) => e)
    expect(error).toBeInstanceOf(DoxygenPageError)
    expect(error).toMatchObject({ kind, pageName: 'classA', baseURL: '/xml', url: '/xml/classA.xml', ...fields })
  })

  it.each([
    ['parse', '<html><body>Not XML'],
    ['unsupported', structXml('classA', 'A')],
  ])('rejects with kind %s for responses it cannot show', async (kind, xml) => {
    serve({ classA: xml })
    const error = await cache.fetchPage({ baseURL: '/xml', pageName: 'classA' }).catch((e) => e)
    expect(error.kind).toBe(kind)
    expect(error.cause).toBeDefined()
  })
})

describe('member references (bug 7)', () => {
  it('reads the compound id from a Doxygen member id', () => {
    expect(compoundIdForMemberId(memberId('classOuter_1_1Inner'))).toBe('classOuter_1_1Inner')
    expect(compoundIdForMemberId(memberId('namespacea__b'))).toBe('namespacea__b')
    expect(compoundIdForMemberId('classOuter')).toBeUndefined()
  })

  it.each([
    ['outer class first', ['classOuter', 'classOuter_1_1Inner']],
    ['nested class first', ['classOuter_1_1Inner', 'classOuter']],
  ])('finds the page a nested-class member belongs to (%s)', async (_, order) => {
    serve({ classOuter: classXml('classOuter', 'Outer'), classOuter_1_1Inner: classXml('classOuter_1_1Inner', 'Outer::Inner') })
    for (const pageName of order) {
      await cache.fetchPage({ baseURL: '/xml', pageName })
    }
    expect(cache.getPageIdForReferenceId('/xml', memberId('classOuter_1_1Inner'))).toBe('classOuter_1_1Inner')
    expect(cache.getPageIdForReferenceId('/xml', memberId('classOuter'))).toBe('classOuter')
  })

  it('does not match a page that is only a text prefix of the member id', async () => {
    serve({ classFoo: classXml('classFoo', 'Foo') })
    await cache.fetchPage({ baseURL: '/xml', pageName: 'classFoo' })
    expect(cache.getPageIdForReferenceId('/xml', memberId('classFooBar'))).toBeUndefined()
  })
})

describe('base classes', () => {
  const derived = (bases) => classXml('classD', 'D', { bases })

  it('loads base classes recursively', async () => {
    serve({
      classD: derived([{ refId: 'classB', name: 'B' }]),
      classB: classXml('classB', 'B', { bases: [{ refId: 'classA', name: 'A' }] }),
      classA: classXml('classA', 'A'),
    })
    await cache.fetchDependeePages({ baseURL: '/xml', pageName: 'classD' })
    expect(cache.getDependeePages({ baseURL: '/xml', id: 'classD', recursive: true }).map((p) => p.id)).toEqual(['classB', 'classA'])
  })

  it.each([
    ['a struct', { structB: structXml('structB', 'B') }, 'structB'],
    ['missing', {}, 'classGone'],
  ])('still loads a class whose base class page is %s (bug 5)', async (_, files, baseId) => {
    serve({
      classD: derived([{ refId: baseId, name: 'B' }, { refId: 'classOk', name: 'Ok' }]),
      classOk: classXml('classOk', 'Ok'),
      ...files,
    })
    await expect(cache.fetchDependeePages({ baseURL: '/xml', pageName: 'classD' })).resolves.toBeDefined()
    expect(cache.getDependeePages({ baseURL: '/xml', id: 'classD', recursive: true }).map((p) => p.id)).toEqual(['classOk'])
  })

  it('still rejects if the page itself cannot be loaded', async () => {
    serve({})
    const error = await cache.fetchDependeePages({ baseURL: '/xml', pageName: 'classD' }).catch((e) => e)
    expect(error.kind).toBe(DoxygenErrorKind.NOT_FOUND)
  })

  it('updates computed values when base classes arrive', async () => {
    serve({ classD: derived([{ refId: 'classB', name: 'B' }]), classB: classXml('classB', 'B') })
    await cache.fetchPage({ baseURL: '/xml', pageName: 'classD' })
    const bases = computed(() => cache.getDependeePages({ baseURL: '/xml', id: 'classD', recursive: true }).length)
    expect(bases.value).toBe(0)
    await cache.fetchDependeePages({ baseURL: '/xml', pageName: 'classD' })
    expect(bases.value).toBe(1)
  })
})
