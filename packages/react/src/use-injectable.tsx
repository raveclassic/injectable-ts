import {
  Injectable,
  InjectableDependencies,
  UnknownDependencyTree,
} from '@injectable-ts/core'
import { useContext, useMemo } from 'react'
import { context } from './context'

export function useInjectable<
  Input extends Injectable<UnknownDependencyTree, Value>,
  Value
>(input: Input, overrides?: Partial<InjectableDependencies<Input>>): Value {
  const dependencies = useContext(context)
  if (dependencies === undefined) {
    throw new Error(
      'useInjectable must be called within DependenciesProvider subtree'
    )
  }
  return useMemo(
    () =>
      input(
        overrides === undefined
          ? dependencies
          : { ...dependencies, ...overrides }
      ),
    [dependencies, overrides, input]
  )
}
