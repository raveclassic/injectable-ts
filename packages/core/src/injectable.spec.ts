/* eslint-disable @typescript-eslint/no-unused-vars */
import { injectable, InjectableValue } from './injectable'
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
      ) => 0
    )
  })
  it('returns result of projection function when called', () => {
    const a = token('a')<1>()
    const b = token('b')<2>()
    const c = injectable(
      token('a')<1>(),
      token('b')<2>(),
      (a, b) => `test ${a} ${b}` as const
    )
    // $ExpectType "test 1 2"
    type t1 = InjectableValue<typeof c>
    // $ExpectType "test 1 2"
    const result = c({ a: 1, b: 2 })
  })
  it('combines multiple injectables', () => {
    const a = token('a')<'a'>()
    const b = token('b')<'b'>()
    const c = injectable(
      a,
      b,
      (
        // $ExpectType "a"
        a,
        // $ExpectType "b"
        b
      ) => new Date(a + b)
    )
    // $ExpectType Date
    type t1 = InjectableValue<typeof c>
  })
})
