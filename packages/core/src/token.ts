/**
 * @since 1.0.0-alpha.2
 */
import { Injectable } from './injectable'

/**
 * @since 1.0.0-alpha.2
 */
export const TOKEN_ACCESSOR_KEY = '@injectable-ts/core//TOKEN_ACCESSOR'

/**
 * @since 1.0.0-alpha.2
 */
export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}

/**
 * Token
 *
 * Some information here
 *
 * @example
 * console.log(1)
 *
 * @category core
 * @since 1.0.0-alpha.2
 */
export function token<Name extends PropertyKey>(name: Name) {
  return <Type = never>(): Injectable<
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
  > => {
    return (dependencies) => {
      const accessor = dependencies[TOKEN_ACCESSOR_KEY]
      return accessor ? accessor(dependencies, name) : dependencies[name]
    }
  }
}
