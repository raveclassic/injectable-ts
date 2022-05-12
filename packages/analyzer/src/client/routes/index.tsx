import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import cytoscape, { ElementDefinition, ElementsDefinition } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import type { GraphMap } from '../../server/graph-node'

// eslint-disable-next-line import/no-default-export
export default function Index() {
  const [elements, setElements] = useState<GraphMap[]>()
  useEffect(() => {
    const socket = io()
    socket.on('GRAPHS', setElements)
    return () => {
      socket.off('GRAPHS', setElements)
    }
  }, [])
  const graphRef = useRef<HTMLDivElement>(null)

  const isInitializedRef = useRef(false)
  useEffect(() => {
    if (elements && graphRef.current && !isInitializedRef.current) {
      cytoscape.use(dagre)
      const cx = cytoscape({
        container: graphRef.current,

        boxSelectionEnabled: false,
        // autounselectify: true,
        autoungrabify: true,
        // autolock: true,

        layout: {
          name: 'dagre',
        },

        style: [
          {
            selector: 'node',
            style: {
              events: 'no',
              'background-color': '#11479e',
            },
          },

          {
            selector: 'edge',
            style: {
              events: 'no',
              width: 4,
              'source-arrow-shape': 'triangle',
              'line-color': '#9dbaea',
              'source-arrow-color': '#9dbaea',
              'curve-style': 'bezier',
            },
          },
        ],

        elements: buildElements(elements),
      })
      isInitializedRef.current = true
    }
  }, [elements])
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {elements === undefined ? (
        'Loading...'
      ) : (
        <div ref={graphRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  )
}

function buildElements(graphMap: GraphMap): ElementsDefinition {}
