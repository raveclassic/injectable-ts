import { Merge, NoInfer, UnionToIntersection } from './utils'

export interface UnknownDependency {
  readonly parent: PropertyKey | never
  readonly required: boolean
  readonly type: unknown
}

export interface UnknownDependencies {
  readonly [Name: string]: UnknownDependency
}

type RunFlatten<Dependencies extends UnknownDependencies> = {
  readonly [Key in keyof Dependencies as Dependencies[Key]['required'] extends true
    ? Key
    : never]: Dependencies[Key]['type']
} & {
  readonly [Key in keyof Dependencies as Dependencies[Key]['required'] extends false
    ? Key
    : never]?: Dependencies[Key]['type']
}

type Flatten<Dependencies> = Dependencies extends UnknownDependencies
  ? Merge<RunFlatten<Dependencies>>
  : never

export interface Injectable<Dependencies, Value> {
  (dependencies: Flatten<NoInfer<Dependencies>>): Value
}

export type InjectableValue<Target> = Target extends Injectable<
  unknown,
  infer Value
>
  ? Value
  : never

type InjectableDependenciesStructure<Target> = Target extends Injectable<
  infer Dependencies,
  unknown
>
  ? Dependencies
  : never

export type InjectableDependencies<Target> = Flatten<
  InjectableDependenciesStructure<Target>
>

type MapInjectablesToValues<
  Targets extends readonly Injectable<unknown, unknown>[]
> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>
}

type MapInjectablesToDependenciesStructures<Targets> = {
  readonly [Index in keyof Targets]: InjectableDependenciesStructure<
    Targets[Index]
  >
}

type WrapWithParent<Dependencies, Parent extends PropertyKey> = {
  readonly [Name in keyof Dependencies]: Dependencies[Name] extends {
    readonly parent: never
  }
    ? Omit<Dependencies[Name], 'parent'> & {
        readonly parent: Parent
      }
    : Dependencies[Name]
}

type MergeDependenciesWithParent<
  Inputs extends readonly Injectable<unknown, unknown>[],
  Parent extends PropertyKey,
  Value
> = Record<
  Parent,
  {
    readonly required: false
    readonly parent: never
    readonly type: Value
  }
> &
  WrapWithParent<
    UnionToIntersection<MapInjectablesToDependenciesStructures<Inputs>[number]>,
    Parent
  >

type MergeDependencies<Inputs extends readonly Injectable<unknown, unknown>[]> =
  UnionToIntersection<MapInjectablesToDependenciesStructures<Inputs>[number]>

export declare function injectable<
  Token extends PropertyKey,
  Inputs extends readonly Injectable<unknown, unknown>[],
  Value
>(
  token: Token,
  ...args: readonly [
    ...Inputs,
    (...values: MapInjectablesToValues<Inputs>) => Value
  ]
): Injectable<
  {
    readonly [Key in keyof MergeDependenciesWithParent<
      Inputs,
      Token,
      Value
    >]: MergeDependenciesWithParent<Inputs, Token, Value>[Key]
  },
  Value
>
export declare function injectable<
  Inputs extends readonly Injectable<unknown, unknown>[],
  Value
>(
  ...args: readonly [
    ...Inputs,
    (...values: MapInjectablesToValues<Inputs>) => Value
  ]
): Injectable<
  {
    readonly [Key in keyof MergeDependencies<Inputs>]: MergeDependencies<Inputs>[Key]
  },
  Value
>

// type Deps = {
//   d: {
//     required: true
//     parent: 'c'
//     type: string
//   }
//   c: {
//     required: false
//     parent: 'b'
//     type: string
//   }
//   b: {
//     required: false
//     parent: 'a'
//     type: string
//   }
//   e: {
//     required: true
//     parent: 'a'
//     type: string
//   }
//   a: {
//     required: false
//     parent: never
//     type: string
//   }
// }
//
// const d = token('d')<string>()
// type DDependencies = InjectableDependenciesStructure<typeof d>
// const c = injectable('c', d, (d) => d)
// type CDependencies = InjectableDependencies<typeof c>
// type CDependenciesWithoutD = OmitDependencies<
//   InjectableDependenciesStructure<typeof c>,
//   'd'
// >
// const b = injectable('b', c, (c) => c)
// const e = token('e')<string>()
// const a = injectable('a', b, e, (b, e) => b + e)
// type ADependenciesStructure = InjectableDependenciesStructure<typeof a>
// type ADependenciesStructureWithoutD = OmitDependencies<
//   ADependenciesStructure,
//   'd'
// >
// type dfsdfsdf = ADependenciesStructure['d']['parent']
// const withoutD = provide(a)<'d'>()
// type WithoutDDependencies = InjectableDependencies<typeof withoutD>
// const withoutC = provide(a)<'c'>()
// type WithoutCDependencies = InjectableDependencies<typeof withoutC>
// const withoutB = provide(a)<'b'>()
// type WithoutBDependencies = InjectableDependencies<typeof withoutB>
// const withoutE = provide(a)<'e'>()
// type WithoutEDependencies = InjectableDependencies<typeof withoutE>
// const withoutA = provide(a)<'a'>()
// type WithoutADependencies = InjectableDependencies<typeof withoutA>
//
// function test(a: number | undefined, b: number | undefined) {
//   if (a == b) {
//     return true
//   }
// }
