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
