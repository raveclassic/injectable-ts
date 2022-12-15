import { InjectableWithName } from './injectable'

export const TOKEN_ACCESSOR_KEY = '@injectable-ts/core//TOKEN_ACCESSOR'

export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}

export function token<Name extends PropertyKey>(name: Name) {
  return <Type = never>(): InjectableWithName<
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
    const f = (
      dependencies: {
        readonly [TOKEN_ACCESSOR_KEY]?: TokenAccessor
      } & Record<Name, Type>
    ): Type => {
      const accessor = dependencies[TOKEN_ACCESSOR_KEY]
      return accessor ? accessor(dependencies, name) : dependencies[name]
    }
    f.key = name
    return f
  }
}
