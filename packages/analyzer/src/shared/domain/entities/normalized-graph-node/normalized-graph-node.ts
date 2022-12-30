interface NormalizedTokenGraphNode {
  readonly kind: 'token'
  readonly id: string
  readonly type: string
  readonly file: string
  readonly name: string
  readonly identifier: string
}

interface NormalizedInjectableGraphNode {
  readonly kind: 'injectable'
  readonly id: string
  readonly name?: string
  readonly type?: string
  readonly file: string
  readonly identifier: string
  /**
   * Mutable
   */
  dependencyIds: string[]
}

interface NormalizedUseInjectableGraphNode {
  readonly kind: 'useInjectable'
  readonly id: string
  readonly file: string
  readonly identifier: string
  readonly targetId: string
}

export type NormalizedGraphNode =
  | NormalizedTokenGraphNode
  | NormalizedInjectableGraphNode
  | NormalizedUseInjectableGraphNode

export interface NormalizedGraph extends Record<string, NormalizedGraphNode> {}
