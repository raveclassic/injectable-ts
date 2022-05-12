import path from 'path'
import { getInjectableCore } from '../server/injectable-core'
import { buildGraphMap, GraphMap } from '../server/graph-node'
import * as TSM from 'ts-morph'
import type { ElementDefinition } from 'cytoscape'

const SELF = path.resolve(__dirname)
const demoTSConfig = path.resolve(SELF, './demo/tsconfig.json')
const injectableCore = path.resolve(SELF, '../../../core/src/index.ts')

interface TokenNode {
  readonly kind: 'TokenNode'
  readonly name: string
  readonly type: unknown
}

interface InjectableNode {
  readonly kind: 'InjectableNode'
  readonly name?: string
  readonly type: unknown
  readonly dependencies: readonly GraphNode[]
}

// interface ProvideNode {
//   readonly kind: 'ProvideNode'
//   readonly target: GraphNode
//   readonly keys: readonly PropertyKey[]
//   readonly parents: TSM.Node[]
// }

export type GraphNode = TokenNode | InjectableNode /*| ProvideNode*/

export function buildElements(): readonly ElementDefinition[] {
  const project = new TSM.Project({
    tsConfigFilePath: demoTSConfig,
  })

  const core = getInjectableCore(project, injectableCore)

  const graph = buildGraphMap(project, core)

  let idCounter = 0
  const definitions: ElementDefinition[] = []
  const ids = new Map<TSM.Node, string>()
  const getId = (reference: TSM.Node): string => {
    const id = ids.get(reference) ?? `${++idCounter}`
    ids.set(reference, id)
    return id
  }
  for (const [reference, node] of graph.entries()) {
    switch (node.kind) {
      case 'TokenNode': {
        definitions.push({ data: { id: getId(reference) } })
        break
      }
      case 'InjectableNode': {
        for (const dependency of node.dependencies) {
          definitions.push({
            data: {
              id: `${getId(reference)}->${getId(dependency)}`,
              from: getId(reference),
              target: getId(dependency),
            },
          })
        }
        break
      }
    }
  }
  return definitions
}

// function buildGraphs(root: TSM.Node, map: GraphMap): GraphNode {
//   const node = map.get(root)
//   if (node === undefined) {
//     throw new Error('Cannot build GraphNode')
//   }
//   switch (node.kind) {
//     case 'TokenNode': {
//       return {
//         kind: 'TokenNode',
//         name: node.name,
//         type: node.type,
//       }
//     }
//     case 'InjectableNode': {
//       const dependencies = node.dependencies.map((node) => buildNode(node, map))
//       return {
//         kind: 'InjectableNode',
//         name: node.name,
//         type: node.type,
//         dependencies,
//       }
//     }
//   }
// }
