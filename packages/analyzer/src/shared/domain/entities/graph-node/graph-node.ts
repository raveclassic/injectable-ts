interface TokenGraphNode {
  readonly kind: 'token'
  readonly type: string
  readonly file: string
  readonly name: string
}

interface InjectableGraphNode {
  readonly kind: 'injectable'
  readonly name?: string
  readonly type?: string
  readonly file: string
  readonly dependencies: readonly GraphNode[]
}

export type GraphNode = TokenGraphNode | InjectableGraphNode
