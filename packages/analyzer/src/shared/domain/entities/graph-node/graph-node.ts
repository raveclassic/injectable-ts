interface BaseGraphNode {
  readonly id: string
  readonly type: string
  readonly file: string
}

interface TokenGraphNode extends BaseGraphNode {
  readonly kind: 'token'
  readonly name: string
}

interface InjectableGraphNode extends BaseGraphNode {
  readonly kind: 'injectable'
  readonly name?: string
  readonly dependencies: readonly GraphNode[]
}

export type GraphNode = TokenGraphNode | InjectableGraphNode
