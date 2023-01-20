// import styled from 'styled-components'
// import NxWelcome from './nx-welcome'
//
// const StyledApp = styled.div`
//   // Your style here
// `
//
// export function App() {
//   return (
//     <StyledApp>
//       <NxWelcome title="analyzer" />
//     </StyledApp>
//   )
// }
// import dagre from 'cytoscape-dagre'
// import cola from 'cytoscape-cola'
import fcose from 'cytoscape-fcose'
import cytoscapeLayoutUtilities from 'cytoscape-layout-utilities'
import { memo, useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  NormalizedGraph,
  NormalizedGraphNode,
} from '../shared/domain/entities/normalized-graph-node/normalized-graph-node'
import cytoscape, { ElementDefinition, NodeSingular } from 'cytoscape'
import { v4 } from 'uuid'
import { GlobalStyled } from './global.styled'

cytoscape.use(fcose)
cytoscape.use(cytoscapeLayoutUtilities)

export const App = memo(() => {
  const [graph, setGraph] = useState<NormalizedGraph | undefined>()

  useEffect(() => {
    const controller = new AbortController()
    async function run() {
      try {
        const response = await fetch('/graph', {
          signal: controller.signal,
        })
        const json: NormalizedGraph = await response.json()
        setGraph(json)
      } catch (e) {
        if (!(e instanceof Error) || e.name !== 'AbortError') {
          console.error(e)
        }
      }
    }
    void run()
    return () => controller.abort()
  }, [])

  // const graphRef = useRef<HTMLDivElement>(null)
  const [graphElement, setGraphElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!graphElement || !graph) return

    const cy = cytoscape({
      container: graphElement,
      // boxSelectionEnabled: false,
      // autoungrabify: true,

      elements: buildElements(graph),
      // elements: [
      //   // list of graph elements to start with
      //   {
      //     // node a
      //     data: { id: 'a' },
      //   },
      //   {
      //     // node b
      //     data: { id: 'b' },
      //   },
      //   {
      //     // edge ab
      //     data: { id: 'ab', source: 'a', target: 'b' },
      //   },
      // ],

      style: [
        // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            // shape: 'barrel',
            // width: 20,
            // height: 20,
            // events: 'no',
            // 'background-color': '#666',
            'background-color': (node) => {
              const graphNode = getGraphNode(node)
              if (!graphNode) {
                return 'white'
              }

              switch (graphNode.kind) {
                case 'token': {
                  return '#00ff77'
                }
                case 'injectable': {
                  return '#ec37ff'
                }
                case 'useInjectable': {
                  return '#3748ff'
                }
              }
            },
            label: (node: NodeSingular) => {
              const graphNode = getGraphNode(node)
              if (!graphNode) return node.data('label') ?? ''
              return graphNode.identifier
              // return `${graphNode.identifier}\n${graphNode.file}`
            },
            'text-wrap': 'wrap',
            'text-margin-y': -10,
            // 'font-size': 10,
          },
        },

        {
          selector: 'edge',
          style: {
            // events: 'no',
            width: 1,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-color': '#9dbaea',
            'target-arrow-color': '#9dbaea',
          },
        },
      ],

      layout: {
        name: 'fcose',
        nodeDimensionsIncludeLabels: true,
        // uniformNodeDimensions: true,
        // animate: false,
        // fit: true,
        // nodeSeparation: 150,
        // quality: 'proof',
        // randomize: false,
        // packComponents: true,
      },

      // layout: {
      //   // name: 'dagre',
      //   nodeDimensionsIncludeLabels: true,
      //   name: 'concentric',
      //   fit: true,
      //   // minNodeSpacing: 1,
      //   spacingFactor: 0.4,
      //   // animate: true,
      //   // animationDuration: 2000,
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //   concentric(node: any): number {
      //     const graphNode = getGraphNode(node)
      //     const level = -getNodeLevel(graphNode)
      //     // console.log(node.indexOf(), node.indexOfId(), level, graphNode.file)
      //     return level
      //     // return node.degree()
      //     // if (graphNode.file.includes('ds/apps/native/domain')) {
      //     //   return 1
      //     // } else if (graphNode.file.includes('ds/apps/native/data')) {
      //     //   return 2
      //     // } else if (graphNode.file.includes('ds/apps/native/ui')) {
      //     //   return 3
      //     // }
      //     // // const isApp = !!graphNode.file.match(/ds\/apps/)
      //     // // const isIsPackage = !!graphNode.file.match(/ds\/packages/)
      //     // // if (isApp) return 100
      //     // // if (isIsPackage) return 99
      //     // // return node.degree()
      //     // // return Math.round(Math.random() * 100)
      //     // return 4
      //   },
      //   levelWidth: (nodes) => 1,
      //   //   rows: 1,
      // },
    })

    // ;(cy as any).layoutUtilities({})
  }, [graph, graphElement])

  return (
    <>
      <GlobalStyled />
      <AppStyled>
        {!graph && <LoadingStyled>Loading...</LoadingStyled>}
        {graph && <GraphStyled ref={setGraphElement} />}
      </AppStyled>
    </>
  )
})

const AppStyled = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
`

const LoadingStyled = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const GraphStyled = styled.div`
  flex: 1;
`

///^apps\/([^\/]+)(?:\/src\/(domain(?:\/(services|repositories|entities|use-cases))?))?/
interface NodeGroup {
  readonly label: string
  readonly children: NodeGroups
}
interface NodeGroups extends Record<string, NodeGroup> {}

function getNodeGroup(node: NormalizedGraphNode): string | undefined {
  const appMatch = node.file.match(/^apps\/([^/]+)\//)
  if (appMatch) {
    const app = appMatch[1]
    const subdomain = node.file.slice(`apps/${app}/src/`.length)
    const subdomainMatch = subdomain.match(/^([^/]+)\//)
    console.log(subdomain)
    // const subdomainMatch =
    return appMatch[1]
  }
  const packageMatch = node.file.match(/^packages\/([^/]+)\//)
  if (packageMatch) {
    return packageMatch[1]
  }
}

// function buildGroups(graph: NormalizedGraph): NodeGroup {
//   for (const node of Object.values(graph)) {
//     const packageMatch = node.file.match(/^packages\/([^/]+)\//)
//     if (packageMatch) {
//       return packageMatch[1]
//     }
//
//     // const appDomainMatch = node.file.match()
//     const appMatch = node.file.match(/^apps\/(.+?)\//)
//     if (appMatch) {
//     }
//   }
// }

function buildElements(graph: NormalizedGraph): ElementDefinition[] {
  const elements: ElementDefinition[] = []
  const groups = new Map<string, string>()

  for (const node of Object.values(graph)) {
    const group = getNodeGroup(node)
    if (group !== undefined && !groups.has(group)) {
      const groupId = v4()
      groups.set(group, groupId)
      elements.push({
        data: {
          id: groupId,
          label: group,
        },
      })
    }

    const parent = group !== undefined ? groups.get(group) : undefined

    switch (node.kind) {
      case 'token': {
        elements.push({
          data: {
            id: node.id,
            node,
            parent,
          },
        })
        break
      }
      case 'injectable': {
        elements.push({
          data: {
            id: node.id,
            node,
            parent,
          },
        })
        for (const dependencyId of node.dependencyIds) {
          elements.push({
            data: {
              id: `${node.id}->${dependencyId}`,
              node,
              source: node.id,
              target: dependencyId,
            },
          })
        }
        break
      }
      case 'useInjectable': {
        elements.push(
          {
            data: {
              id: node.id,
              node,
              parent,
            },
          },
          {
            data: {
              id: `${node.id}->${node.targetId}`,
              node,
              source: node.id,
              target: node.targetId,
            },
          }
        )
      }
    }
  }

  return elements
}

function getGraphNode(
  node: Pick<NodeSingular, 'data'>
): NormalizedGraphNode | undefined {
  return node.data('node')
}

// first - more important
const levels = [
  {
    token: /^apps\/native\/src\/domain\//,
    injectables: [
      /^apps\/native\/src\/domain\/(entities|types)\//,
      /^apps\/native\/src\/domain\/(services|use-cases)\//,
      /^apps\/native\/src\/domain\/(repositories)\//,
      /^apps\/native\/src\/domain\/(utils|validators)\//,
    ],
  },
  {
    token: /^apps\/native\/src\/data\//,
    injectables: [
      /^apps\/native\/src\/data\/(repositories)\//,
      /^apps\/native\/src\/data\/(services)\//,
      /^apps\/native\/src\/data\/(data-source)\//,
      /^apps\/native\/src\/data\/(schema)\//,
      /^apps\/native\/src\/data\/(client)\//,
    ],
  },
  {
    token: /^apps\/native\/src\/ui\//,
    injectables: [/^apps\/native\/src\/ui\//],
  },
  {
    token: /^packages\//,
    injectables: [/^packages\//],
  },
]
const getLevelOffset = (level: typeof levels[number]): number =>
  1 + level.injectables.length
function getNodeLevel(node: NormalizedGraphNode): number {
  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    let offset = 0
    for (let j = levelIndex - 1; j >= 0; j--) {
      offset += getLevelOffset(levels[j])
    }
    switch (node.kind) {
      case 'token': {
        if (node.file.match(levels[levelIndex].token)) {
          return offset
        }
        break
      }
      case 'injectable': {
        const injectablesLength = levels[levelIndex].injectables.length
        for (let j = 0; j < injectablesLength; j++) {
          if (node.file.match(levels[levelIndex].injectables[j])) {
            return offset + j + 1
          }
        }
        break
      }
    }
  }
  throw new Error('Cannot find level')
}
