import { TOKEN_ACCESSOR_KEY, TokenAccessor } from '@injectable-ts/core'
import * as React from 'react'
import { memo, ProviderProps, useContext, useMemo } from 'react'
import { context, UnknownDependencies } from './context'

const checkedAccessor: TokenAccessor = (dependencies, name) => {
  if (name in dependencies) {
    return dependencies[name]
  }
  throw new Error(`Missing dependency: ${JSON.stringify(name)}`)
}

/**
 * DependeciesProvider
 *
 * @type Component
 *
 * @description
 * Some description
 *
 * @example
 * <DependeciesProvider />
 */
export const DependenciesProvider = memo(
  (props: ProviderProps<UnknownDependencies>) => {
    const previousDependencies = useContext(context)
    const mergedDependencies = useMemo(
      () => ({
        [TOKEN_ACCESSOR_KEY]: checkedAccessor,
        ...previousDependencies,
        ...props.value,
      }),
      [previousDependencies, props.value]
    )
    return (
      <context.Provider value={mergedDependencies}>
        {props.children}
      </context.Provider>
    )
  }
)
DependenciesProvider.displayName = 'DependenciesProvider'
