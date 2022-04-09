import { Merge, NoInfer, UnionToIntersection } from './utils'

interface UnknownDependencyTree {
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
type Flatten<Tree> = Tree extends UnknownDependencyTree
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

interface Injectable<Tree extends UnknownDependencyTree, Value> {
  (tree: Flatten<NoInfer<Tree>>): Value
}
type InjectableValue<Target> = Target extends Injectable<
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

type InjectableDependencies<Target> = Flatten<InjectableDependencyTree<Target>>

type MapInjectablesToValues<Targets> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>
}

//
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
type Foo = Injectable<Deps, Date>
// $ExpectType Date
type FooValue = InjectableValue<Foo>
type FooDependencies = Merge<InjectableDependencies<Foo>>
type InjectableFn<
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[]
> = (...args: MapInjectablesToValues<Inputs>) => void

declare function injectable<
  Inputs extends readonly Injectable<UnknownDependencyTree, unknown>[],
  Value
>(
  ...args: [...Inputs, (...values: MapInjectablesToValues<Inputs>) => Value]
): Injectable<UnknownDependencyTree, Value>

declare const foo: Foo
const result = injectable(foo, (foo) => foo.toLocaleString())
