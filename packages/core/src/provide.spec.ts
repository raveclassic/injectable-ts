/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  injectable,
  InjectableDependencies,
  InjectableValue,
} from './injectable'
import { token, TOKEN_ACCESSOR_KEY, TokenAccessor } from './token'
import { provide } from './provide'
import { Eq } from './utils'

describe('provide', () => {
  it('removes passed keys from source injectable with a name', () => {
    const foo = injectable(
      'foo',
      token('a')<string>(),
      token('b')<number>(),
      () => 'foo'
    )
    const outer = provide(foo)<'a'>()
    // $ExpectType true
    type t1 = Eq<
      {
        foo?: string
        b: number
        [TOKEN_ACCESSOR_KEY]?: TokenAccessor
      },
      InjectableDependencies<typeof outer>
    >
  })
  it('removes passed keys from source injectable without a name', () => {
    const foo = injectable(
      token('a')<string>(),
      token('b')<number>(),
      () => 'foo'
    )

    const outer = provide(foo)<'a'>()
    // $ExpectType true
    type t1 = Eq<
      {
        b: number
        [TOKEN_ACCESSOR_KEY]?: TokenAccessor
      },
      InjectableDependencies<typeof outer>
    >
  })
  it('removes all keys but passed keys from the result factory for source injectable with a name', () => {
    const foo = injectable(
      'foo',
      token('a')<string>(),
      token('b')<number>(),
      () => 'foo'
    )
    const outer = provide(foo)<'a'>()
    const inner = outer({ b: 123 })
    type InnerDependencies = Parameters<typeof inner>[0]
    // $ExpectType true
    type t1 = Eq<{ a: string }, InnerDependencies>
  })
  it('removes all keys but passed keys from the result factory for source injectable without a name', () => {
    const foo = injectable(
      token('a')<string>(),
      token('b')<number>(),
      () => 'foo'
    )
    const outer = provide(foo)<'a'>()
    const inner = outer({ b: 123 })
    type InnerDependencies = Parameters<typeof inner>[0]
    // $ExpectType true
    type t1 = Eq<{ a: string }, InnerDependencies>
  })
  it('merges all keys when both outer injectable and inner factory are executed for source injectable with a name', () => {
    const foo = injectable(
      'foo',
      token('a')<string>(),
      token('b')<number>(),
      (a, b) => `${a}${b}`
    )
    const outer = provide(foo)<'a'>()
    const inner = outer({ b: 1 })
    // $ExpectType string
    const result = inner({ a: 'a' })
    expect(result).toBe('a1')
  })
  it('merges all keys when both outer injectable and inner factory are executed for source injectable without a name', () => {
    const foo = injectable(
      token('a')<string>(),
      token('b')<number>(),
      (a, b) => `${a}${b}`
    )
    const outer = provide(foo)<'a'>()
    const inner = outer({ b: 1 })
    // $ExpectType string
    const result = inner({ a: 'a' })
    expect(result).toBe('a1')
  })
  describe('stress test with names', () => {
    // build the following graph
    //           a
    //          / \
    // (token) e   b
    //              \
    //               c
    //                \
    //                 d (token)
    const d = token('d')<'d'>()
    const c = injectable('c', d, (d) => `c->${d}`)
    const b = injectable('b', c, (c) => `b->${c}`)
    const e = token('e')<'e'>()
    const a = injectable('a', b, e, (b, e) => `a->${b}, a->${e}`)
    it('splits by "d"', () => {
      const withD = provide(a)<'d'>()
      // $ExpectType true
      type t1 = Eq<
        {
          a?: string
          b?: string
          c?: string
          e: 'e'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        InjectableDependencies<typeof withD>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          d: 'd'
        },
        Parameters<InjectableValue<typeof withD>>[0]
      >
    })
    it('splits by "c"', () => {
      const withC = provide(a)<'c'>()
      // $ExpectType true
      type t1 = Eq<
        {
          a?: string
          b?: string
          e: 'e'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        InjectableDependencies<typeof withC>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          c?: string
        },
        Parameters<InjectableValue<typeof withC>>[0]
      >
    })
    it('splits by "b"', () => {
      const withB = provide(a)<'b'>()
      // $ExpectType true
      type t1 = Eq<
        {
          a?: string
          e: 'e'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        InjectableDependencies<typeof withB>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          b?: string
        },
        Parameters<InjectableValue<typeof withB>>[0]
      >
    })
    it('splits by "e"', () => {
      const withE = provide(a)<'e'>()
      // $ExpectType true
      type t1 = Eq<
        {
          a?: string
          b?: string
          c?: string
          d: 'd'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        InjectableDependencies<typeof withE>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          e: 'e'
        },
        Parameters<InjectableValue<typeof withE>>[0]
      >
    })
    it('splits by "e" and "d" and removes TokenAccessor', () => {
      const withED = provide(a)<'d' | 'e'>()
      // $ExpectType true
      type t1 = Eq<
        {
          a?: string
          b?: string
          c?: string
        },
        InjectableDependencies<typeof withED>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          d: 'd'
          e: 'e'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        Parameters<InjectableValue<typeof withED>>[0]
      >
    })
  })
  describe('stress test without names', () => {
    // build the following graph
    //           ?
    //          / \
    // (token) e   ?
    //              \
    //               ?
    //                \
    //                 d (token)
    const d = token('d')<'d'>()
    const c = injectable(d, (d) => `c->${d}` as const)
    const b = injectable(c, (c) => `b->${c}` as const)
    const e = token('e')<'e'>()
    const a = injectable(b, e, (b, e) => `a->${b}, a->${e}` as const)
    it('splits by "d"', () => {
      const withD = provide(a)<'d'>()
      // $ExpectType true
      type t1 = Eq<
        {
          e: 'e'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        InjectableDependencies<typeof withD>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          d: 'd'
        },
        Parameters<InjectableValue<typeof withD>>[0]
      >
    })
    it('splits by "e"', () => {
      const withE = provide(a)<'e'>()
      // $ExpectType true
      type t1 = Eq<
        {
          d: 'd'
          [TOKEN_ACCESSOR_KEY]?: TokenAccessor
        },
        InjectableDependencies<typeof withE>
      >
      // $ExpectType true
      type t2 = Eq<
        {
          e: 'e'
        },
        Parameters<InjectableValue<typeof withE>>[0]
      >
    })
    it('splits by "e" and "d" and removes TokenAccessor', () => {
      const withD = provide(a)<'d' | 'e'>()
      // $ExpectType never
      type t1 = keyof InjectableDependencies<typeof withD>
      // $ExpectType true
      type t2 = Eq<
        {
          d: 'd'
          e: 'e'
        },
        Parameters<InjectableValue<typeof withD>>[0]
      >
    })
  })
})
