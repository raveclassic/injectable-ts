/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  injectable,
  InjectableDependencies,
  InjectableValue,
} from './injectable'
import { token, TOKEN_ACCESSOR_KEY } from './token'
import { provide } from './provide'

describe('provide', () => {
  it('removes passed keys from source injectable with a name', () => {
    const foo = injectable(
      'foo',
      token('a')<string>(),
      token('b')<number>(),
      () => 'foo'
    )
    const outer = provide(foo)<'a'>()
    type Dependencies = InjectableDependencies<typeof outer>
    // $ExpectType "foo" | "b"
    type t1 = Exclude<keyof Dependencies, typeof TOKEN_ACCESSOR_KEY>
    // $ExpectType string | undefined
    type t2 = Dependencies['foo']
    // $ExpectType number
    type t3 = Dependencies['b']
    // $ExpectType TokenAccessor | undefined
    type t4 = Dependencies[typeof TOKEN_ACCESSOR_KEY]
  })
  it('removes passed keys from source injectable without a name', () => {
    const foo = injectable(
      token('a')<string>(),
      token('b')<number>(),
      () => 'foo'
    )

    const outer = provide(foo)<'a'>()
    type Dependencies = InjectableDependencies<typeof outer>
    // $ExpectType "b"
    type t1 = Exclude<keyof Dependencies, typeof TOKEN_ACCESSOR_KEY>
    // $ExpectType number
    type t3 = Dependencies['b']
    // $ExpectType TokenAccessor | undefined
    type t4 = Dependencies[typeof TOKEN_ACCESSOR_KEY]
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
    // $ExpectType "a"
    type t1 = keyof InnerDependencies
    // $ExpectType string
    type t2 = InnerDependencies['a']
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
    // $ExpectType "a"
    type t1 = keyof InnerDependencies
    // $ExpectType string
    type t2 = InnerDependencies['a']
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
    const c = injectable('c', d, (d) => `c->${d}` as const)
    const b = injectable('b', c, (c) => `b->${c}` as const)
    const e = token('e')<'e'>()
    const a = injectable('a', b, e, (b, e) => `a->${b}, a->${e}` as const)
    it('splits by "d"', () => {
      const withD = provide(a)<'d'>()
      // $ExpectType "a" | "b" | "c" | "e"
      type t1 = Exclude<
        keyof InjectableDependencies<typeof withD>,
        typeof TOKEN_ACCESSOR_KEY
      >
      // $ExpectType "d"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
    it('splits by "c"', () => {
      const withD = provide(a)<'c'>()
      // $ExpectType "a" | "b" | "e"
      type t1 = Exclude<
        keyof InjectableDependencies<typeof withD>,
        typeof TOKEN_ACCESSOR_KEY
      >
      // $ExpectType "c"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
    it('splits by "b"', () => {
      const withD = provide(a)<'b'>()
      // $ExpectType "a" | "e"
      type t1 = Exclude<
        keyof InjectableDependencies<typeof withD>,
        typeof TOKEN_ACCESSOR_KEY
      >
      // $ExpectType "b"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
    it('splits by "e"', () => {
      const withD = provide(a)<'e'>()
      // $ExpectType "a" | "b" | "c" | "d"
      type t1 = Exclude<
        keyof InjectableDependencies<typeof withD>,
        typeof TOKEN_ACCESSOR_KEY
      >
      // $ExpectType "e"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
    it('splits by "e" and "d" and removes TokenAccessor', () => {
      const withD = provide(a)<'d' | 'e'>()
      // $ExpectType "a" | "b" | "c"
      type t1 = keyof InjectableDependencies<typeof withD>
      // $ExpectType "d" | "e"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
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
      // $ExpectType "e"
      type t1 = Exclude<
        keyof InjectableDependencies<typeof withD>,
        typeof TOKEN_ACCESSOR_KEY
      >
      // $ExpectType "d"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
    it('splits by "e"', () => {
      const withD = provide(a)<'e'>()
      // $ExpectType "d"
      type t1 = Exclude<
        keyof InjectableDependencies<typeof withD>,
        typeof TOKEN_ACCESSOR_KEY
      >
      // $ExpectType "e"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
    it('splits by "e" and "d" and removes TokenAccessor', () => {
      const withD = provide(a)<'d' | 'e'>()
      // $ExpectType never
      type t1 = keyof InjectableDependencies<typeof withD>
      // $ExpectType "d" | "e"
      type t2 = keyof Parameters<InjectableValue<typeof withD>>[0]
    })
  })
})
