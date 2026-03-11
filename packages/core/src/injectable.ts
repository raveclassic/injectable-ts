import { memoMany } from '@frp-ts/utils'
import {
  isPropertyKey,
  isRecord,
  Merge,
  UnionToIntersection,
} from './utils'

export interface UnknownDependencyTree {
  readonly name: PropertyKey | never
  readonly type: unknown
  readonly children: readonly UnknownDependencyTree[]
  readonly optional: boolean
  /** Pre-computed flattened dependencies — avoids recursive Flatten traversal */
  readonly flatDeps: Record<PropertyKey, unknown>
}

/**
 * Flatten is now O(1) — it simply extracts the pre-computed flatDeps field.
 * Previously this was a recursive type that walked the entire dependency tree,
 * causing exponential type expansion in large codebases.
 */
export type Flatten<Tree> = Tree extends { readonly flatDeps: infer F }
  ? F
  : never

export interface InjectableWithoutName<Tree, Value> {
  (tree: NoInfer<Flatten<Tree>>): Value
}

export interface InjectableWithName<Tree, Value> {
  (tree: NoInfer<Flatten<Tree>>): Value
  readonly key: Tree extends { readonly name: infer N } ? N : never
}

export type Injectable<Tree, Value> =
  | InjectableWithoutName<Tree, Value>
  | InjectableWithName<Tree, Value>

export type InjectableValue<Target> = Target extends Injectable<
  infer _Tree,
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

export interface DependencyWithoutName<Result, Children, FlatDeps = {}> {
  readonly name: never
  readonly type: Result
  readonly optional: false
  readonly children: Children
  readonly flatDeps: FlatDeps
}

export interface DependencyWithName<Name, Result, Children, FlatDeps = {}> {
  readonly name: Name
  readonly type: Result
  readonly optional: true
  readonly children: Children
  readonly flatDeps: FlatDeps
}

/**
 * Helper: collects flatDeps from an array/tuple of dependency trees into a single intersection.
 * Used at injectable creation time to pre-compute the flattened dependencies.
 */
type CollectChildFlatDeps<Children> = UnionToIntersection<
  Children extends readonly (infer Child)[]
    ? Child extends UnknownDependencyTree
      ? Child['flatDeps']
      : never
    : never
>

/**
 * Helper: computes the full flatDeps for a named dependency node.
 * The node's own name becomes an optional property, merged with children's flatDeps.
 */
type NamedFlatDeps<Name extends PropertyKey, Result, Children> = {
  readonly [K in Name]?: Result
} & CollectChildFlatDeps<Children>

/**
 * Helper: computes the full flatDeps for an unnamed dependency node.
 * Only children's flatDeps are merged.
 */
type UnnamedFlatDeps<Children> = CollectChildFlatDeps<Children>

export function injectable<Name extends PropertyKey, Result>(
  name: Name,
  project: () => Result
): InjectableWithName<
  DependencyWithName<Name, Result, [], { readonly [K in Name]?: Result }>,
  Result
>
export function injectable<Result>(
  project: () => Result
): InjectableWithoutName<DependencyWithoutName<Result, [], {}>, Result>
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
  DependencyWithoutName<
    Result,
    {
      [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
    }[keyof Inputs][],
    UnnamedFlatDeps<
      {
        [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
      }[keyof Inputs][]
    >
  >,
  Result
>
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
  DependencyWithName<
    Name,
    Result,
    {
      [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
    }[keyof Inputs][],
    NamedFlatDeps<
      Name,
      Result,
      {
        [Key in keyof Inputs]: InjectableDependencyTree<Inputs[Key]>
      }[keyof Inputs][]
    >
  >,
  Result
>
export function injectable<
  Name extends PropertyKey,
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[],
  Result
>(
  name: Name,
  ...args: [...Inputs, (...values: MapInjectablesToValues<Inputs>) => Result]
): InjectableWithName<
  DependencyWithName<
    Name,
    Result,
    {
      readonly [Index in keyof Inputs]: InjectableDependencyTree<Inputs[Index]>
    },
    NamedFlatDeps<
      Name,
      Result,
      {
        readonly [Index in keyof Inputs]: InjectableDependencyTree<
          Inputs[Index]
        >
      }
    >
  >,
  Result
>
export function injectable<
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[],
  Result
>(
  ...args: [...Inputs, (...values: MapInjectablesToValues<Inputs>) => Result]
): InjectableWithoutName<
  DependencyWithoutName<
    Result,
    {
      readonly [Index in keyof Inputs]: InjectableDependencyTree<Inputs[Index]>
    },
    UnnamedFlatDeps<
      {
        readonly [Index in keyof Inputs]: InjectableDependencyTree<
          Inputs[Index]
        >
      }
    >
  >,
  Result
>
/* @__NO_SIDE_EFFECTS__ */
export function injectable(
  ...args: readonly unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Injectable<any, any> {
  return isRecord(args[0]) || (isPropertyKey(args[0]) && isRecord(args[1]))
    ? createRecordInjectable(args)
    : createListInjectable(args)
}

function createRecordInjectable(
  args: readonly unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Injectable<any, any> {
  const name = isPropertyKey(args[0]) ? args[0] : undefined
  let injectables: Record<
    PropertyKey,
    Injectable<UnknownDependencyTree, unknown>
  >
  let project: (values: Record<PropertyKey, unknown>) => unknown
  if (isRecord(args[0])) {
    // eslint-disable-next-line no-restricted-syntax
    injectables = args[0] as never
    // eslint-disable-next-line no-restricted-syntax
    project = args[1] as never
  } else {
    // eslint-disable-next-line no-restricted-syntax
    injectables = args[1] as never
    // eslint-disable-next-line no-restricted-syntax
    project = args[2] as never
  }

  let cachedResult: unknown
  let cachedArg: Record<PropertyKey, unknown>
  let hasValue = false
  const keys = Object.keys(injectables)
  const update = (arg: Record<PropertyKey, unknown>): void => {
    cachedResult = project(arg)
    hasValue = true
    cachedArg = arg
  }
  const f = (dependencies: Record<PropertyKey, unknown>): unknown => {
    if (name !== undefined) {
      const override = dependencies[name]
      if (override !== undefined) {
        return override
      }
    }
    const values: Record<PropertyKey, unknown> = {}
    for (const key of keys) {
      values[key] = injectables[key](dependencies)
    }

    if (hasValue) {
      for (const key of keys) {
        if (cachedArg[key] !== values[key]) {
          update(values)
          return cachedResult
        }
      }

      return cachedResult
    } else {
      update(values)
      return cachedResult
    }
  }
  f.key = name

  // eslint-disable-next-line no-restricted-syntax
  return f as never
}

function createListInjectable(
  args: readonly unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Injectable<any, any> {
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

  // eslint-disable-next-line no-restricted-syntax
  return f as never
}
