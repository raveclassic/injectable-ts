import {
  Injectable,
  InjectableDependencies,
  InjectableValue,
  UnknownDependencyTree,
} from '@injectable-ts/core'
import { useContext, useMemo } from 'react'
import { context } from './context'

/* @__NO_SIDE_EFFECTS__ */ export function useInjectable<
  Input extends Injectable<UnknownDependencyTree, unknown>
>(
  input: Input,
  overrides?: Partial<InjectableDependencies<Input>>
): InjectableValue<Input> {
  const dependencies = useContext(context)
  if (dependencies === undefined) {
    throw new Error(
      'useInjectable must be called within DependenciesProvider subtree'
    )
  }
  return useMemo(
    () =>
      // eslint-disable-next-line no-restricted-syntax
      input(
        overrides === undefined
          ? dependencies
          : { ...dependencies, ...overrides }
      ) as InjectableValue<Input>,
    [dependencies, overrides, input]
  )
}
