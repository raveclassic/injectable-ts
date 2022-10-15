import { Injectable } from './injectable'

export const TOKEN_ACCESSOR_KEY = '@injectable-ts/core//TOKEN_ACCESSOR'

export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}

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

export function optional<Name extends PropertyKey>(name: Name) {
  return <Type = never>(): Injectable<
    {
      readonly name: Name
      readonly type: Type | undefined
      readonly optional: true
      readonly children: readonly []
    },
    Type | undefined
  > => {
    return (dependencies) => dependencies[name]
  }
}
