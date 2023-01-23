import { memo, useEffect, useRef, useState } from 'react'
import { GlobalStyled } from './global.styled'
import * as go from 'gojs/release/go-debug'
import { NormalizedGraph } from '../shared/domain/entities/normalized-graph-node/normalized-graph-node'
import styled from 'styled-components'

export const GoApp = memo(() => {
  const [graphElement, setGraphElement] = useState<HTMLDivElement | null>(null)

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

  // const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  useEffect(() => {
    if (isInitialized.current || !graphElement || !graph) return

    console.log('run')
    const diagram = new go.Diagram(graphElement)

    for (const graphNode of Object.values(graph)) {
      diagram.add(
        new go.Node('Auto').add(new go.TextBlock(graphNode.identifier))
      )

      switch (graphNode.kind) {
        case 'useInjectable': {
          // diagram.add(
          //   new go.Node('Auto').add(new go.TextBlock(graphNode.identifier))
          // )
          break
        }
        case 'token': {
          diagram.add(new go.Link())
          break
        }
        case 'injectable': {
          break
        }
      }
    }
    // diagram.model = new go.GraphLinksModel(
    //   [
    //     { key: 'Hello' }, // two node data, in an Array
    //     { key: 'World!' },
    //   ],
    //   [{ from: 'Hello', to: 'World!' }] // one link data, in an Array
    // )

    // const node = new go.Node('Auto')
    // const shape = new go.Shape()
    // shape.figure = 'RoundedRectangle'
    // shape.fill = 'lightblue'
    // shape.strokeWidth = 3
    // node.add(shape)
    // const textblock = new go.TextBlock()
    // textblock.text = 'Hello!'
    // textblock.margin = 5
    // node.add(textblock)
    // diagram.add(node)

    diagram.add(
      new go.Node('Auto')
        .add(
          new go.Shape('RoundedRectangle', {
            fill: 'lightblue',
            strokeWidth: 3,
          })
        )
        .add(
          new go.TextBlock('Hello!', {
            margin: 5,
          })
        )
    )

    isInitialized.current = true
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
