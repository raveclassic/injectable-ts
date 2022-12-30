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
import cola from 'cytoscape-cola'
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import {
  NormalizedGraph,
  NormalizedGraphNode,
} from '../shared/domain/entities/normalized-graph-node/normalized-graph-node'
import cytoscape, { ElementDefinition, NodeSingular } from 'cytoscape'

cytoscape.use(cola)

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

    const cx = cytoscape({
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

              switch (graphNode.kind) {
                case 'token': {
                  return '#00ff77'
                }
                case 'injectable': {
                  return '#ec37ff'
                }
              }
            },
            label: (node: NodeSingular) => {
              const graphNode = getGraphNode(node)
              return `${graphNode.identifier}\n${graphNode.file}`
            },
            'text-wrap': 'wrap',
            'text-margin-y': -10,
            'font-size': 10,
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
        // name: 'dagre',
        nodeDimensionsIncludeLabels: true,
        name: 'concentric',
        fit: true,
        // minNodeSpacing: 1,
        spacingFactor: 0.4,
        // animate: true,
        // animationDuration: 2000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        concentric(node: any): number {
          const graphNode = getGraphNode(node)
          const level = -getNodeLevel(graphNode)
          // console.log(node.indexOf(), node.indexOfId(), level, graphNode.file)
          return level
          // return node.degree()
          // if (graphNode.file.includes('ds/apps/native/domain')) {
          //   return 1
          // } else if (graphNode.file.includes('ds/apps/native/data')) {
          //   return 2
          // } else if (graphNode.file.includes('ds/apps/native/ui')) {
          //   return 3
          // }
          // // const isApp = !!graphNode.file.match(/ds\/apps/)
          // // const isIsPackage = !!graphNode.file.match(/ds\/packages/)
          // // if (isApp) return 100
          // // if (isIsPackage) return 99
          // // return node.degree()
          // // return Math.round(Math.random() * 100)
          // return 4
        },
        levelWidth: (nodes) => 1,
        //   rows: 1,
      },
    })
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

const GlobalStyled = createGlobalStyle`
  body, html, #root {
    height: 100%;
    padding: 0;
    margin: 0;
  }
`

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

function buildElements(graph: NormalizedGraph): ElementDefinition[] {
  const elements: ElementDefinition[] = []
  const files = new Set<string>()

  for (const node of Object.values(graph)) {
    // if (!files.has(node.file)) {
    //   files.add(node.file)
    //   elements.push({
    //     data: {
    //       id: node.file,
    //     },
    //   })
    // }
    switch (node.kind) {
      case 'token': {
        elements.push({
          data: {
            id: node.id,
            node,
            // parent: node.file,
          },
        })
        break
      }
      case 'injectable': {
        elements.push({
          data: {
            id: node.id,
            node,
            // parent: node.file,
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
    }
  }

  return elements
}

function getGraphNode(node: Pick<NodeSingular, 'data'>): NormalizedGraphNode {
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
