import { memoMany } from '@frp-ts/utils'
import {
  identity,
  isPropertyKey,
  isRecord,
  memoS,
  Merge,
  NoInfer,
  UnionToIntersection,
} from './utils'

export interface UnknownDependencyTree {
  readonly name: PropertyKey | never
  readonly type: unknown
  readonly children: readonly UnknownDependencyTree[]
  readonly optional: boolean
}

type PickRequired<DependencyTree extends UnknownDependencyTree> = {
  readonly [Name in DependencyTree['name'] as DependencyTree['optional'] extends true
    ? never
    : Name]: DependencyTree['type']
}

type PickOptional<DependencyTree extends UnknownDependencyTree> = {
  readonly [Name in DependencyTree['name'] as DependencyTree['optional'] extends true
    ? Name
    : never]?: DependencyTree['type']
}

export type Flatten<Tree> = Tree extends UnknownDependencyTree
  ? PickRequired<Tree> &
      PickOptional<Tree> &
      UnionToIntersection<
        {
          readonly [Index in keyof Tree['children']]: Flatten<
            Tree['children'][Index]
          >
        }[number]
      >
  : never

export interface InjectableWithoutName<
  Tree extends UnknownDependencyTree,
  Value
> {
  (tree: Flatten<NoInfer<Tree>>): Value
}

export interface InjectableWithName<Tree extends UnknownDependencyTree, Value> {
  (tree: Flatten<NoInfer<Tree>>): Value
  readonly key: Tree['name']
}

export type Injectable<Tree extends UnknownDependencyTree, Value> =
  | InjectableWithoutName<Tree, Value>
  | InjectableWithName<Tree, Value>

export type InjectableValue<Target> = Target extends Injectable<
  UnknownDependencyTree,
  infer Value
>
  ? Value
  : never

export type InjectableDependencyTree<Target> = Target extends Injectable<
  infer Tree,
  unknown
>
  ? Tree
  : never

export type InjectableDependencies<Target> = Merge<
  Flatten<InjectableDependencyTree<Target>>
>

type MapInjectablesToValues<Targets> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>
}

type MergeDependencies<
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[],
  Name extends PropertyKey | never,
  Type
> = {
  readonly name: Name
  readonly type: Type
  readonly optional: Name extends never ? false : true
  readonly children: {
    readonly [Index in keyof Inputs]: InjectableDependencyTree<Inputs[Index]>
  }
}

export function injectable<
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
// export function injectable<
//   Name extends PropertyKey,
//   Inputs extends Record<PropertyKey, Injectable<UnknownDependencyTree, unknown>>
// >(
//   name: Name,
//   inputs: Inputs
// ): InjectableWithName<
//   {
//     readonly name: Name
//     readonly type: {
//       readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
//     }
//     readonly optional: true
//     readonly children: {
//       [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
//     }[keyof Inputs][]
//   },
//   {
//     readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
//   }
// >
export function injectable<
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
// export function injectable<
//   Inputs extends Record<PropertyKey, Injectable<UnknownDependencyTree, unknown>>
// >(
//   inputs: Inputs
// ): InjectableWithoutName<
//   {
//     readonly name: never
//     readonly type: {
//       readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
//     }
//     readonly optional: false
//     readonly children: {
//       [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
//     }[keyof Inputs][]
//   },
//   {
//     readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
//   }
// >
export function injectable<
  Name extends PropertyKey,
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[],
  Value
>(
  name: Name,
  ...args: [...Inputs, (...values: MapInjectablesToValues<Inputs>) => Value]
): InjectableWithName<
  {
    readonly [Key in keyof MergeDependencies<
      Inputs,
      Name,
      Value
    >]: MergeDependencies<Inputs, Name, Value>[Key]
  },
  Value
>
export function injectable<
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[],
  Value
>(
  ...args: [...Inputs, (...values: MapInjectablesToValues<Inputs>) => Value]
): InjectableWithoutName<
  {
    readonly [Key in keyof MergeDependencies<
      Inputs,
      never,
      Value
    >]: MergeDependencies<Inputs, never, Value>[Key]
  },
  Value
>
export function injectable(
  ...args: readonly unknown[]
): Injectable<UnknownDependencyTree, unknown> {
  const [arg0, arg1, arg2] = args

  const name = isPropertyKey(arg0) ? arg0 : undefined

  if (isRecord(arg0) || (isPropertyKey(arg0) && isRecord(arg1))) {
    let injectables: Record<
      PropertyKey,
      Injectable<UnknownDependencyTree, unknown>
    >
    let project: (values: Record<PropertyKey, unknown>) => unknown
    if (isRecord(arg0)) {
      // eslint-disable-next-line no-restricted-syntax
      injectables = arg0 as never
      // eslint-disable-next-line no-restricted-syntax
      project = memoS(arg1 as never)
    } else {
      // eslint-disable-next-line no-restricted-syntax
      injectables = arg1 as never
      // eslint-disable-next-line no-restricted-syntax
      project = memoS(arg2 as never)
    }

    const f = (dependencies: Record<PropertyKey, unknown>): unknown => {
      if (name !== undefined) {
        const override = dependencies[name]
        if (override !== undefined) {
          return override
        }
      }
      const values: Record<PropertyKey, unknown> = {}
      for (const [name, injectable] of Object.entries(injectables)) {
        values[name] = injectable(dependencies)
      }
      return project(values)
    }
    f.key = name

    return f
  } else {
    const injectables: readonly Injectable<UnknownDependencyTree, unknown>[] =
      // eslint-disable-next-line no-restricted-syntax
      args.slice(name !== undefined ? 1 : 0, args.length - 1) as never
    // eslint-disable-next-line no-restricted-syntax
    const project: (...values: readonly unknown[]) => unknown = args[
      args.length - 1
    ] as never

    const memoizedProject = memoMany(project)
    const f = (dependencies: Record<PropertyKey, unknown>): unknown => {
      if (name !== undefined) {
        const override = dependencies[name]
        if (override !== undefined) {
          return override
        }
      }
      const values = injectables.map((injectable) => injectable(dependencies))
      return memoizedProject(...values)
    }
    f.key = name

    return f
  }
  //
  // if (isPropertyKey(arg0) && isRecord(arg1) && typeof arg2 === 'function') {
  //   // injectable('name', {}, () => {})
  //   const name: PropertyKey = arg0
  //   const injectables: Record<
  //     PropertyKey,
  //     Injectable<UnknownDependencyTree, unknown>
  //     // eslint-disable-next-line no-restricted-syntax
  //   > = arg1 as never
  //   const memoizedProject: (values: Record<PropertyKey, unknown>) => unknown =
  //     memoS(
  //       // eslint-disable-next-line no-restricted-syntax
  //       arg2 as never
  //     )
  //
  //   const f = (dependencies: Record<PropertyKey, unknown>): unknown => {
  //     if (name !== undefined) {
  //       const override = dependencies[name]
  //       if (override !== undefined) {
  //         return override
  //       }
  //     }
  //     const values: Record<PropertyKey, unknown> = {}
  //     for (const [name, injectable] of Object.entries(injectables)) {
  //       values[name] = injectable(dependencies)
  //     }
  //     return memoizedProject(values)
  //   }
  //   f.key = name
  //
  //   return f
  // } else if (isPropertyKey(arg0) && isRecord(arg1)) {
  //   // injectable('name', {})
  //   const name = arg0
  //   const inputs = arg1
  //   const project = identity
  // } else if (isPropertyKey(arg0)) {
  //   // injectable('name', ...[], () => {})
  //   const name = arg0
  //   const inputs = args.slice(1, args.length - 1)
  //   const project = args[args.length - 1]
  // } else if (isRecord(arg0) && typeof arg1 === 'function') {
  //   // injectable({}, () => {})
  //   const inputs = args[0]
  //   const project = args[args.length - 1]
  // } else if (isRecord(arg0)) {
  //   // injectable({})
  //   const inputs = args[0]
  //   const project = identity
  // } else {
  //   // injectable(...[], () => {})
  //   const inputs = args.slice(0, args.length - 1)
  //   const project = args[args.length - 1]
  // }
  //
  // // const name = isPropertyKey(args[0]) ? args[0] : undefined
  // // const injectables: readonly Injectable<UnknownDependencyTree, unknown>[] =
  // //   // eslint-disable-next-line no-restricted-syntax
  // //   args.slice(name !== undefined ? 1 : 0, args.length - 1) as never
  // // // eslint-disable-next-line no-restricted-syntax
  // // const project: (...values: readonly unknown[]) => unknown = args[
  // //   args.length - 1
  // // ] as never
  // //
  // // const memoizedProject = memoMany(project)
  // // const f = (dependencies: Record<PropertyKey, unknown>): unknown => {
  // //   if (name !== undefined) {
  // //     const override = dependencies[name]
  // //     if (override !== undefined) {
  // //       return override
  // //     }
  // //   }
  // //   const values = injectables.map((injectable) => injectable(dependencies))
  // //   return memoizedProject(...values)
  // // }
  // // f.key = name
  // //
  // // return f
}
