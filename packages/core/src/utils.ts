export type NoInfer<T> = T extends infer S ? S : never

export type Merge<Target> = {
  readonly [Key in keyof Target]: Target[Key]
}

export type Eq<A, B> = [A, B] extends [B, A] ? true : false

export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

export const identity = <T>(input: T): T => input

export const isRecord = (
  input: unknown
): input is Record<PropertyKey, unknown> =>
  typeof input === 'object' && input !== null && !Array.isArray(input)

export const isPropertyKey = (input: unknown): input is PropertyKey =>
  typeof input === 'string' ||
  typeof input === 'number' ||
  typeof input === 'symbol'

export const memoS = <Arg extends Record<PropertyKey, unknown>, Result>(
  f: (arg: Arg) => Result
): ((arg: Arg) => Result) => {
  let hasValue = false
  let cachedResult: Result
  let cachedArg: Arg
  const update = (arg: Arg): void => {
    cachedResult = f(arg)
    hasValue = true
    cachedArg = arg
  }
  return (arg: Arg): Result => {
    const argKeys = Object.keys(arg)
    if (hasValue) {
      const cachedArgKeys = Object.keys(cachedArg)
      if (argKeys.length === 0 && cachedArgKeys.length === 0) {
        // zero-field argument functions won't change its result
        return cachedResult
      }

      if (cachedArgKeys.length !== argKeys.length) {
        // different number of args
        update(arg)
        return cachedResult
      }

      // same number of fields in the arg, just iterate over them
      for (const key of argKeys) {
        if (cachedArg[key] !== arg[key]) {
          update(arg)
          return cachedResult
        }
      }

      return cachedResult
    } else {
      update(arg)
      return cachedResult
    }
  }
}
