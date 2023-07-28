import {
  Injectable,
  InjectableDependencies,
  InjectableDependencyTree,
  InjectableValue,
  InjectableWithName,
  InjectableWithoutName,
  UnknownDependencyTree,
} from './injectable'
import { token } from './token'

export declare function injectableRecord<
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
export declare function injectableRecord<
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
export declare function injectableRecord<
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
export declare function injectableRecord<
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
