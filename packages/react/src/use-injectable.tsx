import { Injectable, UnknownDependencyTree } from '@injectable-ts/core'
import { useContext, useMemo } from 'react'
import { context } from './context'

export function useInjectable<
  Input extends Injectable<UnknownDependencyTree, Value>,
  Value
>(input: Input): Value {
  const dependencies = useContext(context)
  if (dependencies === undefined) {
    throw new Error(
      'useInjectable must be called within DependenciesProvider subtree'
    )
  }
  // eslint-disable-next-line no-restricted-syntax
  return useMemo(() => input(dependencies as never), [])
}
