import {
  Injectable,
  UnknownDependencyTree,
  UnknownInjectable,
} from './injectable'

export const TOKEN_ACCESSOR_KEY = '@injectable-ts/core//TOKEN_ACCESSOR'

export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}

// must be a type alias, otherwise it doesn't type check
export type TokenInjectable<
  Tree extends UnknownDependencyTree,
  Value,
  Key
> = Injectable<Tree, Value> & { readonly key: Key }

export function token<Key extends PropertyKey>(key: Key) {
  return <Type = never>(): TokenInjectable<
    {
      readonly name: Key
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
    Type,
    Key
  > => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,no-restricted-syntax
    const result = ((dependencies: any) => {
      const accessor = dependencies[TOKEN_ACCESSOR_KEY]
      return accessor !== undefined
        ? accessor(dependencies, key)
        : dependencies[key]
    }) as UnknownInjectable
    // eslint-disable-next-line no-restricted-syntax,@typescript-eslint/no-explicit-any
    ;(result as any).key = key
    // eslint-disable-next-line no-restricted-syntax
    return result as never
  }
}
