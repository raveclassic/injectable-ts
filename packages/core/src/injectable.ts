import { memoMany } from '@frp-ts/utils'
import { Merge, NoInfer, UnionToIntersection } from './utils'

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
  const name = isPropertyKey(args[0]) ? args[0] : undefined
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

type ValuesToTuple<T extends Record<string, unknown>> = readonly {
  [K in keyof T]: T[K]
}[keyof T][]

export function injectableS<
  Name extends PropertyKey,
  Inputs extends Record<string, Injectable<UnknownDependencyTree, unknown>>,
  Value
>(
  name: Name,
  inputs: Inputs,
  f: (values: {
    readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
  }) => Value
): InjectableWithName<
  {
    readonly [Key in keyof MergeDependencies<
      ValuesToTuple<Inputs>,
      Name,
      Value
    >]: MergeDependencies<ValuesToTuple<Inputs>, Name, Value>[Key]
  },
  Value
>
export function injectableS<
  Inputs extends Record<string, Injectable<UnknownDependencyTree, unknown>>,
  Value
>(
  inputs: Inputs,
  f: (values: {
    readonly [Key in keyof Inputs]: InjectableValue<Inputs[Key]>
  }) => Value
): InjectableWithoutName<
  {
    readonly [Key in keyof MergeDependencies<
      ValuesToTuple<Inputs>,
      never,
      Value
    >]: MergeDependencies<ValuesToTuple<Inputs>, never, Value>[Key]
  },
  Value
>
export function injectableS(
  ...args: readonly unknown[]
): Injectable<UnknownDependencyTree, unknown> {
  let name: PropertyKey | undefined
  let injectables: Record<
    PropertyKey,
    Injectable<UnknownDependencyTree, unknown>
  >
  let project: (values: Record<string, unknown>) => unknown
  if (args.length === 3) {
    // eslint-disable-next-line no-restricted-syntax
    name = args[0] as PropertyKey
    // eslint-disable-next-line no-restricted-syntax
    injectables = args[1] as never
    // eslint-disable-next-line no-restricted-syntax
    project = args[2] as never
  } else {
    name = undefined
    // eslint-disable-next-line no-restricted-syntax
    injectables = args[0] as Record<
      string,
      Injectable<UnknownDependencyTree, unknown>
    >
    // eslint-disable-next-line no-restricted-syntax
    project = args[1] as never
  }

  const memoizedProject = memoS(project)

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
    return memoizedProject(values)
  }
  f.key = name

  return f
}

const isPropertyKey = (input: unknown): input is PropertyKey =>
  typeof input === 'string' ||
  typeof input === 'number' ||
  typeof input === 'symbol'

const memoS = <Arg extends Record<PropertyKey, unknown>, Result>(
  f: (arg: Arg) => Result
): ((arg: Arg) => Result) => {
  let hasValue = false
  let cachedResult: Result
  let cachedArg: Arg
  const update = (arg: Arg): void => {
    cachedResult = f(arg)
    hasValue = true
    cachedArg = arg
  }
  return (arg: Arg): Result => {
    const argKeys = Object.keys(arg)
    if (hasValue) {
      const cachedArgKeys = Object.keys(cachedArg)
      if (argKeys.length === 0 && cachedArgKeys.length === 0) {
        // zero-field argument functions won't change its result
        return cachedResult
      }

      if (cachedArgKeys.length !== argKeys.length) {
        // different number of args
        update(arg)
        return cachedResult
      }

      // same number of fields in the arg, just iterate over them
      for (const key of argKeys) {
        if (cachedArg[key] !== arg[key]) {
          update(arg)
          return cachedResult
        }
      }

      return cachedResult
    } else {
      update(arg)
      return cachedResult
    }
  }
}
