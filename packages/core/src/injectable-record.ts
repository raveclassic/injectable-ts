import {
  Injectable,
  InjectableDependencyTree,
  InjectableValue,
  InjectableWithName,
  InjectableWithoutName,
  isPropertyKey,
  UnknownDependencyTree,
} from './injectable'
import { identity } from './utils'

export function injectableRecord<
  Name extends PropertyKey,
  Inputs extends Record<PropertyKey, Injectable<UnknownDependencyTree, unknown>>
>(
  name: Name,
  inputs: Inputs
): InjectableWithName<
  {
    readonly name: Name
    readonly type: {
      readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
    }
    readonly optional: true
    readonly children: {
      [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
    }[keyof Inputs][]
  },
  {
    readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
  }
>
export function injectableRecord<
  Inputs extends Record<PropertyKey, Injectable<UnknownDependencyTree, unknown>>
>(
  inputs: Inputs
): InjectableWithoutName<
  {
    readonly name: never
    readonly type: {
      readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
    }
    readonly optional: false
    readonly children: {
      [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
    }[keyof Inputs][]
  },
  {
    readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
  }
>
export function injectableRecord<
  Name extends PropertyKey,
  Inputs extends Record<
    PropertyKey,
    Injectable<UnknownDependencyTree, unknown>
  >,
  Result
>(
  name: Name,
  inputs: Inputs,
  project: (values: {
    readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
  }) => Result
): InjectableWithName<
  {
    readonly name: Name
    readonly type: Result
    readonly optional: true
    readonly children: {
      [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
    }[keyof Inputs][]
  },
  Result
>
export function injectableRecord<
  Inputs extends Record<
    PropertyKey,
    Injectable<UnknownDependencyTree, unknown>
  >,
  Result
>(
  inputs: Inputs,
  project: (values: {
    readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
  }) => Result
): InjectableWithoutName<
  {
    readonly name: never
    readonly type: Result
    readonly optional: false
    readonly children: {
      [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
    }[keyof Inputs][]
  },
  Result
>
export function injectableRecord(
  ...args: readonly unknown[]
): InjectableWithoutName<UnknownDependencyTree, unknown> {
  let name: PropertyKey | undefined
  let inputs:
    | Record<PropertyKey, Injectable<UnknownDependencyTree, unknown>>
    | undefined
  let project: ((values: Record<PropertyKey, unknown>) => unknown) | undefined

  if (args.length === 1) {
    // const foo = token('foo')<string>()
    // injectable({ foo })
    // eslint-disable-next-line no-restricted-syntax
    inputs = args[0] as never
    project = identity
  } else if (args.length === 2) {
    if (isPropertyKey(args[0])) {
      // injectable('name', { foo })
      // eslint-disable-next-line no-restricted-syntax
      name = args[0] as never
      // eslint-disable-next-line no-restricted-syntax
      inputs = args[1] as never
    } else {
      // injectable({ foo }, p => p.foo)
      // eslint-disable-next-line no-restricted-syntax
      inputs = args[0] as never
      // eslint-disable-next-line no-restricted-syntax
      project = args[1] as never
    }
  } else if (args.length === 3) {
    // injectable('name', { foo }, p => p.foo)
    // eslint-disable-next-line no-restricted-syntax
    name = args[0] as never
    // eslint-disable-next-line no-restricted-syntax
    inputs = args[1] as never
    // eslint-disable-next-line no-restricted-syntax
    project = args[2] as never
  }
}
