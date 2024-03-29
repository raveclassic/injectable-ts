/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  injectable,
  InjectableDependencies,
  InjectableValue,
} from './injectable'
import { token, TOKEN_ACCESSOR_KEY } from './token'

describe('injectable', () => {
  describe('overloadings', () => {
    it('name, project', () => {
      const result = injectable('foo', () => 123)
      type Result = typeof result
      // $ExpectType number
      type Value = InjectableValue<Result>
      // $ExpectType "foo"
      type Dependencies = keyof InjectableDependencies<Result>
    })
    it('project', () => {
      const result = injectable(() => 123)
      type Result = typeof result
      // $ExpectType number
      type Value = InjectableValue<Result>
      // $ExpectType never
      type Dependencies = keyof InjectableDependencies<Result>
    })
    it('name, list, project', () => {
      const result = injectable('foo', token('t')<'t'>(), (t) => 123)
      type Result = typeof result
      // $ExpectType number
      type Value = InjectableValue<Result>
      // $ExpectType "foo" | "t"
      type Dependencies = Exclude<
        keyof InjectableDependencies<Result>,
        typeof TOKEN_ACCESSOR_KEY
      >
    })
    it('name, record, project', () => {
      const result = injectable('foo', { r: token('t')<'t'>() }, (p) => 123)
      type Result = typeof result
      // $ExpectType number
      type Value = InjectableValue<Result>
      // $ExpectType "foo" | "t"
      type Dependencies = Exclude<
        keyof InjectableDependencies<Result>,
        typeof TOKEN_ACCESSOR_KEY
      >
    })
    it('record, project', () => {
      const result = injectable({ r: token('t')<'t'>() }, (p) => 123)
      type Result = typeof result
      // $ExpectType number
      type Value = InjectableValue<Result>
      // $ExpectType "t"
      type Dependencies = Exclude<
        keyof InjectableDependencies<Result>,
        typeof TOKEN_ACCESSOR_KEY
      >
    })
    it('list, project', () => {
      const result = injectable(token('t')<'t'>(), (t) => 123)
      type Result = typeof result
      // $ExpectType number
      type Value = InjectableValue<Result>
      // $ExpectType "t"
      type Dependencies = Exclude<
        keyof InjectableDependencies<Result>,
        typeof TOKEN_ACCESSOR_KEY
      >
    })
  })
  describe('record', () => {
    it('passes values of dependencies to projection function', () => {
      injectable(
        { a: token('a')<'a'>(), b: token('b')<'b'>() },
        ({
          // $ExpectType "a"
          a,
          // $ExpectType "b"
          b,
        }) => {
          expect(a).toEqual('a')
          expect(b).toEqual('b')
        }
      )
    })
    it('returns result of projection function when called and memorizes it', () => {
      const project = jest.fn(
        ({ a, b }: { a: 'a'; b: 'b' }) => `test ${a} ${b}` as const
      )
      const c = injectable(
        { a: token('a')<'a'>(), b: token('b')<'b'>() },
        project
      )
      // $ExpectType "test a b"
      type t1 = InjectableValue<typeof c>
      // $ExpectType "test a b"
      const result = c({ a: 'a', b: 'b' })
      expect(result).toBe('test a b')
      expect(c({ a: 'a', b: 'b' })).toBe('test a b')
      expect(project).toHaveBeenCalledTimes(1)
    })
    it('re-runs projection function if one of its dependencies changes', () => {
      const project = jest.fn(
        ({ a, b }: { a: string; b: string }) => `test ${a} ${b}`
      )
      const c = injectable(
        { a: token('a')<string>(), b: token('b')<string>() },
        project
      )
      const result = c({ a: 'a', b: 'b' })
      expect(result).toBe('test a b')
      expect(c({ a: 'a', b: 'c' })).toBe('test a c')
      expect(project).toHaveBeenCalledTimes(2)
    })
    it('forwards dependencies of dependencies', () => {
      const d = token('d')<'d'>()
      const e = token('e')<'e'>()
      const c = injectable({ d }, ({ d }) => `${d}c` as const)
      const b = injectable({ e }, ({ e }) => `${e}b` as const)
      const a = injectable({ b, c }, () => 123)
      const result = a({
        e: 'e',
        d: 'd',
        [TOKEN_ACCESSOR_KEY]: (dependencies, name) => dependencies[name],
      })
    })
    it('supports overrides via "name" argument as string', () => {
      const project = jest.fn(() => 'foo value')
      const foo = injectable('FOO', {}, project)
      // $ExpectType string | undefined
      type t1 = InjectableDependencies<typeof foo>['FOO']
      // $ExpectType string
      const result = foo({ FOO: 'override' })
      expect(result).toBe('override')
      expect(project).not.toHaveBeenCalled()
    })
    it('supports overrides via "name" argument as number', () => {
      const project = jest.fn(() => 'foo value')
      const foo = injectable(123, {}, project)
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
      const foo = injectable(symbol, {}, project)
      // $ExpectType string | undefined
      type t1 = InjectableDependencies<typeof foo>[typeof symbol]
      // $ExpectType string
      const result = foo({ [symbol]: 'override' })
      expect(result).toBe('override')
      expect(project).not.toHaveBeenCalled()
    })
    it('stores key', () => {
      const foo = injectable('foo', {}, () => 123)
      // $ExpectType "foo"
      foo.key
      expect(foo.key).toEqual('foo')
    })
  })
  describe('list', () => {
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
          expect(a).toEqual('a')
          expect(b).toEqual('b')
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
    it('re-runs projection function if one of its dependencies changes', () => {
      const project = jest.fn((a: string, b: string) => `test ${a} ${b}`)
      const c = injectable(token('a')<string>(), token('b')<string>(), project)
      const result = c({ a: 'a', b: 'b' })
      expect(result).toBe('test a b')
      expect(c({ a: 'a', b: 'c' })).toBe('test a c')
      expect(project).toHaveBeenCalledTimes(2)
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
    it('stores key', () => {
      const foo = injectable('foo', () => 123)
      // $ExpectType "foo"
      foo.key
      expect(foo.key).toEqual('foo')
    })
  })

  describe('async', () => {
    it('does not unwrap dependencies producing async values', async () => {
      const a = token('a')<Promise<string>>()
      const b = injectable(() => Promise.resolve('b'))
      const c = injectable(
        a,
        b,
        async (
          // $ExpectType Promise<string>
          a,
          // $ExpectType Promise<string>
          b
        ) => (await a) + (await b)
      )
      // $ExpectType Promise<string>
      type t1 = InjectableValue<typeof c>
      expect(await c({ a: Promise.resolve('a') })).toEqual('ab')
    })
  })
})
