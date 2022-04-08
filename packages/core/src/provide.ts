import { Eq } from './utils'
import { Injectable, UnknownDependencies } from './injectable'

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
  : false

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
    : Current]: Dependencies[Current]
}

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
    >]: OmitDependencies<Dependencies, Keys>[Key]
  },
  Injectable<
    {
      readonly [Key in Keys]: Dependencies[Key]
    },
    Value
  >
>
