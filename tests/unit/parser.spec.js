import { describe, expect, it } from 'vitest'

import { parsePage } from '../../src/js/doxygenparser'
import { UnsupportedDoxygenContent } from '../../src/js/errors'
import {
  classXml,
  define,
  func,
  indexXml,
  memberId,
  namespaceXml,
  structXml,
  variable,
} from '../helpers/doxygen'

const classWith = (...functions) =>
  parsePage('classX', classXml('classX', 'X', { sections: { 'public-func': functions } }))

describe('parsePage: member functions', () => {
  it('parses named parameters', () => {
    const [f] = classWith(
      func(memberId('classX'), 'f', { args: '(int n)', params: [{ type: 'int', name: 'n' }] })
    ).publicFunctions
    expect(f.params.map((p) => [p.paramType.text, p.name])).toEqual([['int', 'n']])
  })

  it('parses unnamed parameters instead of failing the page (bug 1)', () => {
    const [f] = classWith(
      func(memberId('classX'), 'f', { args: '(int)', params: [{ type: 'int' }] })
    ).publicFunctions
    expect(f.params.map((p) => [p.paramType.text, p.name])).toEqual([['int', '']])
  })

  it.each([
    ['without a declname', [{ type: 'typename T' }]],
    ['with a declname', [{ type: 'typename', name: 'T' }]],
  ])('keeps template parameters out of the return type and parameters, %s (bug 2)', (_, templateParams) => {
    const [f] = classWith(
      func(memberId('classX'), 'get', {
        type: 'T',
        args: '(T v)',
        templateParams,
        params: [{ type: 'T', name: 'v' }],
      })
    ).publicFunctions
    expect(f.returnType.text).toBe('T')
    expect(f.params.map((p) => `${p.paramType.text} ${p.name}`)).toEqual(['T v'])
    expect(f.templateParams.map((p) => `${p.type} ${p.name}`.trim())).toEqual(['typename T'])
  })

  it('leaves out deleted functions', () => {
    const page = classWith(
      func(memberId('classX', 1), 'X', { type: '', args: '(const X &)=delete', params: [{ type: 'const X &' }] }),
      func(memberId('classX', 2), 'g')
    )
    expect(page.publicFunctions.map((f) => f.name)).toEqual(['g'])
  })
})

describe('parsePage: text with <, > and & (bug 10)', () => {
  it('returns plain text for names, not HTML entities', () => {
    const page = classWith(
      func(memberId('classX'), 'operator<', {
        type: 'bool',
        args: '(const X &o) const',
        params: [{ type: 'const X &', name: 'o' }],
      })
    )
    const [f] = page.publicFunctions
    expect(f.name).toBe('operator<')
    expect(f.argsString).toBe('(const X &o) const')
    expect(f.params[0].paramType.text).toBe('const X &')
  })

  it('returns plain text for template class names', () => {
    const id = 'classFoo_3_01int_01_4'
    expect(parsePage(id, classXml(id, 'Foo< int >')).name).toBe('Foo< int >')
  })
})

describe('parsePage: namespaces', () => {
  it('parses variables instead of failing the page (bug 3)', () => {
    const page = parsePage(
      'namespacens',
      namespaceXml('namespacens', 'ns', {
        sections: { var: [variable(memberId('namespacens'), 'answer', 'const int')] },
      })
    )
    const vars = page.sections.find((s) => s.kind === 'var').members
    expect(vars.map((v) => [v.kind, v.name, v.varType.text])).toEqual([['variable', 'answer', 'const int']])
  })

  it('skips member kinds it cannot show, keeping the rest of the page', () => {
    const page = parsePage(
      'namespacens',
      namespaceXml('namespacens', 'ns', {
        sections: {
          define: [define(memberId('namespacens', 1), 'MACRO')],
          func: [func(memberId('namespacens', 2), 'f')],
        },
      })
    )
    const members = page.sections.flatMap((s) => s.members.map((m) => m.name))
    expect(members).toEqual(['f'])
  })
})

describe('parsePage: index', () => {
  it('lists classes outside any namespace instead of failing (bug 4)', () => {
    const page = parsePage(
      'index',
      indexXml({ namespaces: [['namespacens', 'ns']], classes: [['classGlobal', 'Global'], ['classns_1_1A', 'ns::A']] })
    )
    expect(page.classes.map((c) => c.name)).toEqual(['Global'])
    expect(page.namespaces.map((n) => [n.name, n.classes.map((c) => c.name)])).toEqual([['ns', ['ns::A']]])
  })

  it('groups classes under their innermost namespace (bug 4)', () => {
    const page = parsePage(
      'index',
      indexXml({
        namespaces: [['namespacea', 'a'], ['namespacea_1_1b', 'a::b']],
        classes: [['classa_1_1b_1_1C', 'a::b::C'], ['classa_1_1Outer_1_1Inner', 'a::Outer::Inner']],
      })
    )
    expect(page.namespaces.map((n) => [n.name, n.classes.map((c) => c.name)])).toEqual([
      ['a', ['a::Outer::Inner']],
      ['a::b', ['a::b::C']],
    ])
  })
})

describe('parsePage: errors', () => {
  it('reports malformed XML', () => {
    expect(() => parsePage('classX', '<!doctype html><html><body><p>x</body></html>')).toThrow(/not well-formed XML|no <compounddef/)
  })

  it('reports XML without the expected compound', () => {
    expect(() => parsePage('classX', classXml('classY', 'Y'))).toThrow(/no <compounddef id="classX">/)
  })

  it('reports compound kinds it cannot show as unsupported', () => {
    expect(() => parsePage('structS', structXml('structS', 'S'))).toThrow(UnsupportedDoxygenContent)
  })
})
