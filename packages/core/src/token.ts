import { Injectable } from './injectable'

export const TOKEN_ACCESSOR_KEY = '@injectable-ts/core//TOKEN_ACCESSOR'

export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}

type TokenDependencies<Name extends PropertyKey, Type> = Record<
  Name,
  { readonly type: Type; readonly parent: never; readonly required: true }
> &
  Record<
    typeof TOKEN_ACCESSOR_KEY,
    {
      readonly type: TokenAccessor
      readonly parent: Name
      readonly required: false
    }
  >

export function token<Name extends PropertyKey>(name: Name) {
  return <Type = never>(): Injectable<
    {
      readonly [Key in keyof TokenDependencies<Name, Type>]: TokenDependencies<
        Name,
        Type
      >[Key]
    },
    Type
  > => {
    return (dependencies) => {
      const flattened: Record<Name, Type> &
        Partial<Record<typeof TOKEN_ACCESSOR_KEY, TokenAccessor>> =
        // the cast is required to get rid of NoInfer
        // eslint-disable-next-line no-restricted-syntax
        dependencies as never
      const accessor = flattened[TOKEN_ACCESSOR_KEY]
      return accessor ? accessor(flattened, name) : flattened[name]
    }
  }
}
