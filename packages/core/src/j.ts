import { Merge, NoInfer, UnionToIntersection } from './utils'

interface UnknownTree {
  readonly name: PropertyKey | never
  readonly type: unknown
  readonly children: readonly UnknownTree[]
  readonly optional: boolean
}

interface Injectable<Dependencies extends UnknownTree, Value> {
  (dependencies: NoInfer<FlattenTree<NoInfer<Dependencies>>>): Value
}

interface UnknownInjectable {
  (dependencies: Record<PropertyKey, unknown>): unknown
}

type PickRequired<Tree extends UnknownTree> = {
  readonly [Name in Tree['name'] as Tree['optional'] extends true
    ? never
    : Name]: Tree['type']
}
type PickOptional<Tree extends UnknownTree> = {
  readonly [Name in Tree['name'] as Tree['optional'] extends true
    ? Name
    : never]?: Tree['type']
}
type FlattenTree<Tree> = Tree extends UnknownTree
  ? PickRequired<Tree> &
      PickOptional<Tree> &
      UnionToIntersection<FlattenChildren<Tree['children']>[number]>
  : never
type FlattenChildren<Children extends readonly UnknownTree[]> = {
  readonly [Index in keyof Children]: FlattenTree<Children[Index]>
}

export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}
export const TOKEN_ACCESSOR_KEY = '@injectable-ts/core//TOKEN_ACCESSOR'

declare function token<Name extends PropertyKey>(
  name: Name
): <Type = never>() => Injectable<
  {
    readonly name: Name
    readonly type: Type
    readonly optional: false
    readonly children: readonly [
      {
        readonly name: typeof TOKEN_ACCESSOR_KEY
        readonly type: TokenAccessor
        readonly optional: true
        readonly children: readonly []
      }
    ]
  },
  Type
>

type Deps = {
  name: 'a'
  type: 'result'
  optional: false
  children: [
    {
      name: 'b'
      type: string
      optional: true
      children: [
        {
          name: 'c'
          type: number
          optional: false
          children: []
        }
      ]
    },
    {
      name: 'e'
      type: string
      optional: false
      children: []
    }
  ]
}
type Flat1 = Merge<FlattenTree<Deps>>

type InjectableValue<Target extends UnknownInjectable> = ReturnType<Target>
type InjectableDependencies<Target> = Target extends UnknownInjectable
  ? Parameters<Target>[0]
  : never

type _MapInjectablesToValues<Inputs extends readonly unknown[]> = {
  readonly [Index in keyof Inputs]: InjectableDependencies<Inputs[Index]>
}
type MapInjectablesToValues<Inputs extends readonly unknown[]> = [
  InjectableDependencies<Inputs[number]>
]

type MergeDependencies<
  Inputs extends readonly UnknownInjectable[],
  Name extends PropertyKey | never,
  Type
> = {
  readonly name: Name
  readonly type: Type
  readonly optional: Name extends never ? false : true
  readonly children: {
    readonly [Index in keyof Inputs]: Inputs[Index] extends UnknownInjectable
      ? InjectableDependencies<Inputs[Index]>
      : never
  }
}

declare function injectable<
  Name extends PropertyKey,
  Inputs extends readonly Injectable<any, any>[],
  Value
>(
  name: Name,
  ...args: readonly [
    ...Inputs,
    (...values: MapInjectablesToValues<Inputs>) => Value
  ]
): void
injectable('foo', token('a')<string>(), (a) => {})
