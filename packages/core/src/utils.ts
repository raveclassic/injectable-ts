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

export const isRecord = (
  input: unknown
): input is Record<PropertyKey, unknown> =>
  typeof input === 'object' &&
  input !== null &&
  !Array.isArray(input) &&
  !(input instanceof Date) &&
  !(input instanceof Map) &&
  !(input instanceof Set) &&
  !(input instanceof WeakSet) &&
  !(input instanceof WeakMap)

export const isPropertyKey = (input: unknown): input is PropertyKey =>
  typeof input === 'string' ||
  typeof input === 'number' ||
  typeof input === 'symbol'
