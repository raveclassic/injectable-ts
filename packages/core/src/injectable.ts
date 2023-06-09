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
  readonly [Index in keyof Targets]: Targets[Index] extends Promise<infer T>
    ? InjectableValue<T>
    : InjectableValue<Targets[Index]>
}

type MergeDependencies<
  Inputs extends readonly (
    | Injectable<UnknownDependencyTree, unknown>
    | Promise<Injectable<UnknownDependencyTree, unknown>>
  )[],
  Name extends PropertyKey | never,
  Type
> = {
  readonly name: Name
  readonly type: Type
  readonly optional: Name extends never ? false : true
  readonly children: {
    readonly [Index in keyof Inputs]: Inputs[Index] extends Promise<infer T>
      ? InjectableDependencyTree<T>
      : InjectableDependencyTree<Inputs[Index]>
  }
}

export function injectable<
  Name extends PropertyKey,
  Inputs extends readonly (
    | Injectable<UnknownDependencyTree, unknown>
    | InjectableWithName<UnknownDependencyTree, unknown>
  )[],
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
// must always come after regular `Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[]` signature
export function injectable<
  Inputs extends readonly (
    | Injectable<UnknownDependencyTree, unknown>
    | Promise<Injectable<UnknownDependencyTree, unknown>>
  )[],
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
  Promise<Value>
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
    const values: unknown[] = []
    let isAsync = false
    for (const injectable of injectables) {
      if (injectable instanceof Promise) {
        isAsync = true
        values.push(injectable.then((injectable) => injectable(dependencies)))
      } else {
        values.push(injectable(dependencies))
      }
    }

    return isAsync
      ? Promise.all(values).then((values) => memoizedProject(...values))
      : memoizedProject(...values)
  }
  f.key = name

  return f
}

const isPropertyKey = (input: unknown): input is PropertyKey =>
  typeof input === 'string' ||
  typeof input === 'number' ||
  typeof input === 'symbol'
