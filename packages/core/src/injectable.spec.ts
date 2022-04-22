/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  injectable,
  InjectableDependencies,
  InjectableValue,
} from './injectable'
import { token, TOKEN_ACCESSOR_KEY } from './token'

describe('injectable', () => {
  it('calls projection function without arguments and memorizes result when called without dependencies', () => {
    const time = performance.now()
    const project = jest.fn(() => time)
    const value = injectable(project)
    // $ExpectType number
    type t1 = InjectableValue<typeof value>
    // $ExpectType never
    type t2 = keyof InjectableDependencies<typeof value>
    // $ExpectType number
    const result = value({})
    expect(result).toBe(time)
    expect(value({})).toBe(time)
    expect(project).toHaveBeenCalledTimes(1)
  })
  it('passes values of dependencies to projection function', () => {
    injectable(
      token('a')<'a'>(),
      token('b')<'b'>(),
      (
        // $ExpectType "a"
        a,
        // $ExpectType "b"
        b
      ) => {
        expect(a).toBe('a')
        expect(b).toBe('b')
      }
    )
  })
  it('returns result of projection function when called and memorizes it', () => {
    const project = jest.fn((a: 'a', b: 'b') => `test ${a} ${b}` as const)
    const c = injectable(token('a')<'a'>(), token('b')<'b'>(), project)
    // $ExpectType "test a b"
    type t1 = InjectableValue<typeof c>
    // $ExpectType "test a b"
    const result = c({ a: 'a', b: 'b' })
    expect(result).toBe('test a b')
    expect(c({ a: 'a', b: 'b' })).toBe('test a b')
    expect(project).toHaveBeenCalledTimes(1)
  })
  it('forwards dependencies of dependencies', () => {
    const d = token('d')<'d'>()
    const e = token('e')<'e'>()
    const c = injectable(d, (d) => `${d}c` as const)
    const b = injectable(e, (e) => `${e}b` as const)
    const a = injectable(b, c, () => 123)
    const result = a({
      e: 'e',
      d: 'd',
      [TOKEN_ACCESSOR_KEY]: (dependencies, name) => dependencies[name],
    })
  })
  it('supports overrides via "name" argument as string', () => {
    const project = jest.fn(() => 'foo value')
    const foo = injectable('FOO', project)
    // $ExpectType string | undefined
    type t1 = InjectableDependencies<typeof foo>['FOO']
    // $ExpectType string
    const result = foo({ FOO: 'override' })
    expect(result).toBe('override')
    expect(project).not.toHaveBeenCalled()
  })
  it('supports overrides via "name" argument as number', () => {
    const project = jest.fn(() => 'foo value')
    const foo = injectable(123, project)
    // $ExpectType string | undefined
    type t1 = InjectableDependencies<typeof foo>[123]
    // $ExpectType string
    const result = foo({ 123: 'override' })
    expect(result).toBe('override')
    expect(project).not.toHaveBeenCalled()
  })
  it('supports overrides via "name" argument as symbol', () => {
    const project = jest.fn(() => 'foo value')
    const symbol = Symbol()
    const foo = injectable(symbol, project)
    // $ExpectType string | undefined
    type t1 = InjectableDependencies<typeof foo>[typeof symbol]
    // $ExpectType string
    const result = foo({ [symbol]: 'override' })
    expect(result).toBe('override')
    expect(project).not.toHaveBeenCalled()
  })
})
