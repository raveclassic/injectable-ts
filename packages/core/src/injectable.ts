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
  readonly _value: Value
  readonly _tree: NoInfer<Tree>
  readonly _flat: Flatten<NoInfer<Tree>>
  (tree: this['_flat']): Value
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UnknownInjectable extends Injectable<any, any> {}

export type InjectableValue<Target extends UnknownInjectable> = Target['_value']

export type InjectableDependencyTree<Target extends UnknownInjectable> =
  Target['_tree']

export type InjectableDependencies<Target extends UnknownInjectable> = Merge<
  Flatten<InjectableDependencyTree<Target>>
>

type MapInjectablesToValues<Targets extends readonly UnknownInjectable[]> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>
}

interface MergeDependencies<
  Inputs extends readonly Injectable<never, unknown>[],
  Name extends PropertyKey | never,
  Type
> {
  readonly name: Name
  readonly type: Type
  readonly optional: Name extends never ? false : true
  readonly children: {
    readonly [Index in keyof Inputs]: InjectableDependencyTree<Inputs[Index]>
  }
}

export function injectable<
  Name extends PropertyKey,
  Inputs extends readonly UnknownInjectable[],
  Value
>(
  name: Name,
  ...args: [...Inputs, (...values: MapInjectablesToValues<Inputs>) => Value]
): Injectable<
  {
    readonly [Key in keyof MergeDependencies<
      Inputs,
      Name,
      Value
    >]: MergeDependencies<Inputs, Name, Value>[Key]
  },
  Value
>
export function injectable<Inputs extends readonly UnknownInjectable[], Value>(
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
export function injectable(...args: readonly unknown[]): UnknownInjectable {
  const name = isPropertyKey(args[0]) ? args[0] : undefined
  const injectables: readonly UnknownInjectable[] =
    // eslint-disable-next-line no-restricted-syntax
    args.slice(name !== undefined ? 1 : 0, args.length - 1) as never
  // eslint-disable-next-line no-restricted-syntax
  const project: (...values: readonly unknown[]) => unknown = args[
    args.length - 1
  ] as never

  const memoizedProject = memoMany(project)
  // eslint-disable-next-line no-restricted-syntax
  return ((dependencies: Record<PropertyKey, unknown>): unknown => {
    if (name !== undefined) {
      const override = dependencies[name]
      if (override !== undefined) {
        return override
      }
    }
    const values = injectables.map((injectable) => injectable(dependencies))
    return memoizedProject(...values)
  }) as UnknownInjectable
}

const isPropertyKey = (input: unknown): input is PropertyKey =>
  typeof input === 'string' ||
  typeof input === 'number' ||
  typeof input === 'symbol'
