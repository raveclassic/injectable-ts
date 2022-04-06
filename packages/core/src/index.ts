interface UnknownDependency {
  readonly parent: PropertyKey | never;
  readonly required: boolean;
  readonly type: unknown;
}

interface UnknownDependencies {
  readonly [Name: string]: UnknownDependency;
}

type NoInfer<T> = T extends infer S ? S : never;

type RunFlatten<Dependencies extends UnknownDependencies> = {
  readonly [Key in keyof Dependencies as Dependencies[Key]['required'] extends true
    ? Key
    : never]: Dependencies[Key]['type'];
} & {
  readonly [Key in keyof Dependencies as Dependencies[Key]['required'] extends false
    ? Key
    : never]?: Dependencies[Key]['type'];
};
type Merge<Target> = {
  readonly [Key in keyof Target]: Target[Key];
};
type Flatten<Dependencies> = Dependencies extends UnknownDependencies
  ? Merge<RunFlatten<Dependencies>>
  : never;

export interface Injectable<Dependencies, Value> {
  (dependencies: Flatten<NoInfer<Dependencies>>): Value;
}

export type InjectableValue<Target> = Target extends Injectable<
  any,
  infer Value
>
  ? Value
  : never;

type InjectableDependenciesStructure<Target> = Target extends Injectable<
  infer Dependencies,
  any
>
  ? Dependencies
  : never;

export type InjectableDependencies<Target> = Flatten<
  InjectableDependenciesStructure<Target>
>;

type MapInjectablesToValues<Targets extends readonly Injectable<any, any>[]> = {
  readonly [Index in keyof Targets]: InjectableValue<Targets[Index]>;
};

type MapInjectablesToDependenciesStructures<Targets> = {
  readonly [Index in keyof Targets]: InjectableDependenciesStructure<
    Targets[Index]
  >;
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export declare function token<Name extends PropertyKey>(
  name: Name
): <Type = never>() => Injectable<
  {
    readonly [P in Name]: {
      readonly type: Type;
      readonly parent: never;
      readonly required: true;
    };
  },
  Type
>;

type WrapWithParent<Dependencies, Parent extends PropertyKey> = {
  readonly [Name in keyof Dependencies]: Dependencies[Name] extends {
    readonly parent: never;
  }
    ? Omit<Dependencies[Name], 'parent'> & {
        readonly parent: Parent;
      }
    : Dependencies[Name];
};
type MergeDependenciesWithParent<
  Inputs extends readonly Injectable<any, any>[],
  Parent extends PropertyKey,
  Value
> = Record<
  Parent,
  {
    readonly required: false;
    readonly parent: never;
    readonly type: Value;
  }
> &
  WrapWithParent<
    UnionToIntersection<MapInjectablesToDependenciesStructures<Inputs>[number]>,
    Parent
  >;

type MergeDependencies<Inputs extends readonly Injectable<any, any>[]> =
  UnionToIntersection<MapInjectablesToDependenciesStructures<Inputs>[number]>;

export declare function injectable<
  Token extends PropertyKey,
  Inputs extends readonly Injectable<any, any>[],
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
    >]: MergeDependenciesWithParent<Inputs, Token, Value>[Key];
  },
  Value
>;
export declare function injectable<
  Inputs extends readonly Injectable<any, any>[],
  Value
>(
  ...args: readonly [
    ...Inputs,
    (...values: MapInjectablesToValues<Inputs>) => Value
  ]
): Injectable<
  {
    readonly [Key in keyof MergeDependencies<Inputs>]: MergeDependencies<Inputs>[Key];
  },
  Value
>;

type Eq<A, B> = [A, B] extends [B, A] ? true : false;

type ShouldRemove<
  Dependencies extends UnknownDependencies,
  CurrentDependency extends keyof Dependencies,
  DependenciesToOmit extends keyof Dependencies
> = Eq<DependenciesToOmit, CurrentDependency> extends true
  ? true
  : Dependencies[CurrentDependency]['parent'] extends never
  ? false
  : Dependencies[CurrentDependency]['parent'] extends keyof Dependencies
  ? ShouldRemove<
      Dependencies,
      Dependencies[CurrentDependency]['parent'],
      DependenciesToOmit
    >
  : false;

type OmitDependencies<
  Dependencies extends UnknownDependencies,
  DependenciesToOmit extends keyof Dependencies
> = {
  readonly [Current in keyof Dependencies as ShouldRemove<
    Dependencies,
    Current,
    DependenciesToOmit
  > extends true
    ? never
    : Current]: Dependencies[Current];
};

export declare function provide<
  Dependencies extends UnknownDependencies,
  Value
>(
  input: Injectable<Dependencies, Value>
): <Keys extends keyof Dependencies>() => Injectable<
  {
    readonly [Key in keyof OmitDependencies<
      Dependencies,
      Keys
    >]: OmitDependencies<Dependencies, Keys>[Key];
  },
  Injectable<
    {
      readonly [Key in Keys]: Dependencies[Key];
    },
    Value
  >
>;

type Deps = {
  d: {
    required: true;
    parent: 'c';
    type: string;
  };
  c: {
    required: false;
    parent: 'b';
    type: string;
  };
  b: {
    required: false;
    parent: 'a';
    type: string;
  };
  e: {
    required: true;
    parent: 'a';
    type: string;
  };
  a: {
    required: false;
    parent: never;
    type: string;
  };
};
//
// const d = token('d')<string>();
// type DDependencies = InjectableDependenciesStructure<typeof d>;
// const c = injectable('c', d, (d) => d);
// type CDependencies = InjectableDependencies<typeof c>;
// type CDependenciesWithoutD = OmitDependencies<
//   InjectableDependenciesStructure<typeof c>,
//   'd'
// >;
// const b = injectable('b', c, (c) => c);
// const e = token('e')<string>();
// const a = injectable('a', b, e, (b, e) => b + e);
// type ADependenciesStructure = InjectableDependenciesStructure<typeof a>;
// type ADependenciesStructureWithoutD = OmitDependencies<
//   ADependenciesStructure,
//   'd'
// >;
// type dfsdfsdf = ADependenciesStructure['d']['parent'];
// const withoutD = provide(a)<'d'>();
// type WithoutDDependencies = InjectableDependencies<typeof withoutD>;
// const withoutC = provide(a)<'c'>();
// type WithoutCDependencies = InjectableDependencies<typeof withoutC>;
// const withoutB = provide(a)<'b'>();
// type WithoutBDependencies = InjectableDependencies<typeof withoutB>;
// const withoutE = provide(a)<'e'>();
// type WithoutEDependencies = InjectableDependencies<typeof withoutE>;
// const withoutA = provide(a)<'a'>();
// type WithoutADependencies = InjectableDependencies<typeof withoutA>;
