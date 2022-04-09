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

export interface Injectable<Tree extends UnknownDependencyTree, Value> {
  (tree: Flatten<NoInfer<Tree>>): Value
}

export type InjectableValue<Target> = Target extends Injectable<
  UnknownDependencyTree,
  infer Value
>
  ? Value
  : never

type InjectableDependencyTree<Target> = Target extends Injectable<
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
  Inputs extends readonly Injectable<never, unknown>[],
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
): Injectable<
  {
    readonly [Key in keyof MergeDependencies<
      Inputs,
      never,
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
): Injectable<
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
  const name = typeof args[0] === 'string' ? args[0] : undefined
  const injectables: readonly Injectable<UnknownDependencyTree, unknown>[] =
    // eslint-disable-next-line no-restricted-syntax
    args.slice(name !== undefined ? 1 : 0, args.length - 1) as never
  // eslint-disable-next-line no-restricted-syntax
  const project: (...values: readonly unknown[]) => unknown = args[
    args.length - 1
  ] as never

  const memoizedProject = memoMany(project)
  return (dependencies: Record<PropertyKey, unknown>) => {
    if (name !== undefined) {
      const override = dependencies[name]
      if (override !== undefined) {
        return override
      }
    }
    const values = injectables.map((injectable) => injectable(dependencies))
    return memoizedProject(...values)
  }
}
