import { Merge, NoInfer, UnionToIntersection } from './utils'

interface UnknownDependencyTree {
  readonly name: PropertyKey
  readonly type: unknown
  readonly children: readonly UnknownDependencyTree[]
  readonly optional?: true
}

interface Injectable<
  Dependencies extends readonly UnknownDependencyTree[],
  Value
> {
  (dependencies: NoInfer<Dependencies>): Value
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InjectableValue<Target> = Target extends Injectable<any, infer Value>
  ? Value
  : never

type MapInjectablesToValues<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Targets extends readonly Injectable<any, unknown>[]
> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>
}

type Deps = {
  name: 'a'
  type: 'result'
  children: [
    {
      name: 'b'
      type: string
      optional: true
      children: [
        {
          name: 'c'
          type: number
          children: []
        }
      ]
    },
    {
      name: 'e'
      type: string
      children: []
    }
  ]
}
declare const deps: Deps
declare function testDeps(input: UnknownDependencyTree): void
testDeps(deps)

type RunFlattenSingle<DependencyTree> =
  DependencyTree extends UnknownDependencyTree
    ? Merge<
        {
          readonly [Name in DependencyTree['name'] as DependencyTree['optional'] extends true
            ? never
            : Name]: DependencyTree['type']
        } & {
          readonly [Name in DependencyTree['name'] as DependencyTree['optional'] extends true
            ? Name
            : never]?: DependencyTree['type']
        } & RunFlattenMany<DependencyTree['children']>
      >
    : never

type RunFlatten<DependencyTrees extends readonly UnknownDependencyTree[]> = {
  readonly [Index in keyof DependencyTrees]: RunFlattenSingle<
    DependencyTrees[Index]
  >
}

type RunFlattenMany<Dependencies extends readonly UnknownDependencyTree[]> = {
  readonly [Key in keyof UnionToIntersection<
    RunFlatten<Dependencies>[number]
  >]: UnionToIntersection<RunFlatten<Dependencies>[number]>[Key]
}

type t1 = RunFlattenSingle<Deps>
type t2 = RunFlattenMany<[Deps]>

declare function injectable<
  Name extends PropertyKey,
  Inputs extends readonly Injectable<
    readonly UnknownDependencyTree[],
    unknown
  >[],
  Value
>(
  name: Name,
  ...args: readonly [
    ...Inputs,
    (...values: MapInjectablesToValues<Inputs>) => Value
  ]
): Injectable<any, Value>
