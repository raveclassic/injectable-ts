/* eslint-disable @typescript-eslint/no-unused-vars */
import { token, TOKEN_ACCESSOR_KEY, TokenAccessor } from './token'
import { InjectableDependencies, InjectableValue } from './injectable'

describe('token', () => {
  it('returns passed value as result', () => {
    const foo = token('foo')<'bar'>()
    type Foo = typeof foo
    // $ExpectType "bar"
    type t1 = InjectableValue<Foo>
    // $ExpectType "bar"
    type t2 = InjectableDependencies<Foo>['foo']
    // $ExpectType "bar"
    const result = foo({ foo: 'bar' })
    expect(result).toBe('bar')
  })
  it('uses TokenAccessor to read values', () => {
    const foo = token('foo')<'bar'>()
    type Foo = typeof foo
    // $ExpectType TokenAccessor | undefined
    type t1 = InjectableDependencies<Foo>[typeof TOKEN_ACCESSOR_KEY]
    const cb = jest.fn(<T>(value: T): T => value)
    const accessor: TokenAccessor = (dependencies, name) =>
      cb(dependencies[name])
    // $ExpectType "bar"
    const result = foo({ [TOKEN_ACCESSOR_KEY]: accessor, foo: 'bar' })
    expect(cb).toHaveBeenCalledWith('bar')
  })
})
