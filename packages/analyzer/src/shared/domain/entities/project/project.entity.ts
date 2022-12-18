import { GraphNode } from '../graph-node/graph-node'

export interface ProjectEntity {
  readonly graphs: readonly GraphNode[]
}
