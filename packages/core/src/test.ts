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

type InjectableDependencies<Target> = Merge<
  Flatten<InjectableDependencyTree<Target>>
>

type MapInjectablesToValues<Targets> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>
}

//
type Foo = Injectable<
  {
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
  },
  Date
>

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

declare function injectable<
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
declare function injectable<
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

declare const foo: Foo
const result = injectable('result', foo, (foo) => foo.toLocaleString())

const d = token('d')<'d'>()
type D = typeof d
type DValue = InjectableValue<D>
type DDependencies = InjectableDependencies<D>

const c = injectable('c', d, (d) => d)
type C = typeof c
type CValue = InjectableValue<C>
type CDependencies = InjectableDependencies<C>

const b = injectable('b', c, (c) => c)
type B = typeof b
type BValue = InjectableValue<B>
type BDependencies = InjectableDependencies<B>

const e = token('e')<'e'>()
type E = typeof e
type EValue = InjectableValue<E>
type EDependencies = InjectableDependencies<E>

const a = injectable('a', b, e, (b, e) => `b: ${b}, e: ${e}` as const)
type A = typeof a
type AValue = InjectableValue<A>
type ADependencies = InjectableDependencies<A>

//
const r = a({
  e: 'e',
  d: 'd',
})

//
type RunOmitInChildren<
  Children extends readonly UnknownDependencyTree[],
  Keys
> = {
  readonly [Index in keyof Children]: RunOmitDependencies<Children[Index], Keys>
}

type RunOmitDependencies<Tree, Keys> = Tree extends UnknownDependencyTree
  ? Tree['name'] extends Keys
    ? never
    : {
        readonly type: Tree['type']
        readonly name: Tree['name']
        readonly optional: Tree['optional']
        readonly children: RunOmitInChildren<Tree['children'], Keys>
      }
  : never

declare function provide<Dependencies extends UnknownDependencyTree, Value>(
  input: Injectable<Dependencies, Value>
): <Keys extends keyof Flatten<Dependencies>>() => Injectable<
  {
    readonly [Key in keyof RunOmitDependencies<
      Dependencies,
      Keys
    >]: RunOmitDependencies<Dependencies, Keys>[Key]
  },
  (innerDependencies: {
    readonly [Key in keyof Flatten<Dependencies> as Key extends Keys
      ? Key
      : never]: Flatten<Dependencies>[Key]
  }) => Value
>

const withoutD = provide(a)<'d'>()
type WithoutD = typeof withoutD
type WithoutDValue = InjectableValue<WithoutD>
type WithoutDDependencies = InjectableDependencies<WithoutD>

const withoutC = provide(a)<'c'>()
type WithoutC = typeof withoutC
type WithoutCValue = InjectableValue<WithoutC>
type WithoutCDependencies = InjectableDependencies<WithoutC>

const withoutB = provide(a)<'b'>()
type WithoutB = typeof withoutB
type WithoutBValue = InjectableValue<WithoutB>
type WithoutBDependencies = InjectableDependencies<WithoutB>

const withoutE = provide(a)<'e'>()
type WithoutE = typeof withoutE
type WithoutEValue = InjectableValue<WithoutE>
type WithoutEDependencies = InjectableDependencies<WithoutE>

const withoutDE = provide(a)<'d' | 'e'>()
type WithoutDE = typeof withoutDE
type WithoutDEValue = InjectableValue<WithoutDE>
type WithoutDEDependencies = InjectableDependencies<WithoutDE>

const rrrr = withoutDE({
  b: 'b',
})
