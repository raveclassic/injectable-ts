/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  injectable,
  InjectableDependencies,
  InjectableValue,
} from './injectable'
import { token } from './token'

describe('injectable', () => {
  it('calls projection function without arguments and memorizes result when called without dependencies', () => {
    const time = performance.now()
    const project = jest.fn(() => time)
    const value = injectable(project)
    // $ExpectType number
    type t1 = InjectableValue<typeof value>
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
    type t1 = InjectableDependencies<typeof a>
  })
})
