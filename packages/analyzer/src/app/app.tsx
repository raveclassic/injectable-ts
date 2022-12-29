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
import dagre from 'cytoscape-dagre'

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
    cytoscape.use(dagre)

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
            width: 20,
            height: 20,
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
              return graphNode.identifier
            },
            'text-wrap': 'wrap',
            'text-margin-y': -10,
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
        name: 'dagre',
        nodeDimensionsIncludeLabels: true,
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
            parent: node.file,
          },
        })
        break
      }
      case 'injectable': {
        elements.push({
          data: {
            id: node.id,
            node,
            parent: node.file,
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

function getGraphNode(node: NodeSingular): NormalizedGraphNode {
  return node.data('node')
}
