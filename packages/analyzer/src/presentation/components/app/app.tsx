import styled, { createGlobalStyle } from 'styled-components'
import { memo, useEffect, useState } from 'react'
import { KonvaGraph } from '../konva-graph/konva-graph'
import { NormalizedGraph } from '../../../shared/domain/entities/normalized-graph-node/normalized-graph-node'

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

  return (
    <AppStyled>
      <GlobalsStyled />
      {!graph && <LoadingStyled />}
      {graph && <KonvaGraph graph={graph} />}
    </AppStyled>
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

const GlobalsStyled = createGlobalStyle`
  body, html, #root {
    height: 100%;
    padding: 0;
    margin: 0;
  }
`
