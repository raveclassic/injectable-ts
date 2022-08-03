import {
  Injectable,
  InjectableDependencies,
  InjectableValue,
  UnknownDependencyTree,
} from '@injectable-ts/core'
import { useContext, useMemo } from 'react'
import { context } from './context'

/**
 * React hook for retrieve injectable value inside IoC context
 *
 * @param {...unknown} dependencies
 * @param {Partial<InjectableDependencies<Input>>} overrides
 * @returns {unknown} dependency
 *
 * @example
 * const value = token('foo')<string>()
 * const Component = () => {
 *   const depFoo useInjectable(value)
 *   return <div>{depFoo}</div>
 * }
 */
export function useInjectable<
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
