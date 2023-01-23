import { memo, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Konva from 'konva'
import { groupBy } from 'lodash'
import {
  NormalizedGraph,
  NormalizedGraphNode,
} from '../../../shared/domain/entities/normalized-graph-node/normalized-graph-node'

interface KonvaGraphProps {
  readonly graph: NormalizedGraph
}

const SCALE_FACTOR = 1.07

export const KonvaGraph = memo((props: KonvaGraphProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const graphRef = useRef(props.graph)

  useLayoutEffect(() => {
    if (!container) return

    console.log('initialize')

    const bounds = container.getBoundingClientRect()
    const stage = new Konva.Stage({
      container,
      width: bounds.width,
      height: bounds.height,
      draggable: true,
    })

    initZoom(stage)

    const layer = new Konva.Layer()

    // layer.add(circle)
    renderNodes(graphRef.current, layer)

    stage.add(layer)

    layer.draw()
  }, [container])

  return <KonvaGraphStyled ref={setContainer} />
})

const KonvaGraphStyled = styled.div`
  height: 100%;
  width: 100%;
`

const size = 200
const TEXT_HEIGHT = 25
function renderNodes(graph: NormalizedGraph, layer: Konva.Layer): void {
  const groups = new Map<string, Konva.Group>()

  const groupped = groupBy(
    Object.values(graph),
    (node) => getNodeGroupName(node) ?? 'other'
  )

  let x = 0
  // for (const graphNode of Object.values(graph)) {
  //   const identifierText = new Konva.Text({
  //     text: graphNode.identifier,
  //     x: x - size / 2,
  //     width: size,
  //     align: 'center',
  //   })
  //
  //   // const graphNodeGroupName = getNodeGroupName(graphNode)
  //   // if (graphNodeGroupName !== undefined) {
  //   //   const packageGroup =
  //   //     groups.get(graphNodeGroupName) ?? new Konva.Group({ x })
  //   //   groups.set(graphNodeGroupName, packageGroup)
  //   //   if (packageGroup.children) {
  //   //     identifierText.y(packageGroup.children.length * 20)
  //   //   }
  //   //   packageGroup.add(identifierText)
  //   // } else {
  //   //   layer.add(identifierText)
  //   // }
  //
  //   layer.add(identifierText)
  //   x += size
  // }

  const nodes = new Map<NormalizedGraphNode, Konva.Node>()

  for (const [group, children] of Object.entries(groupped)) {
    const konvaGroup = new Konva.Group({ x, draggable: true })
    layer.add(konvaGroup)

    konvaGroup.add(
      new Konva.Text({ text: group, height: TEXT_HEIGHT, fontStyle: 'bold' })
    )
    const childrenGroup = new Konva.Group({ y: TEXT_HEIGHT })
    konvaGroup.add(childrenGroup)
    for (const [i, child] of children.entries()) {
      const text = new Konva.Text({
        text: child.identifier,
        y: i * TEXT_HEIGHT,
        fill: getGraphNodeColor(child),
      })
      nodes.set(child, text)
      childrenGroup.add(text)
    }

    x += size
  }

  for (const graphNode of Object.values(graph)) {
    const start = nodes.get(graphNode)
    if (!start) continue
    const { width: startWidth, height: startHeight } = start.size()
    const { x: x1, y: y1 } = start.absolutePosition()
    switch (graphNode.kind) {
      case 'useInjectable': {
        const end = nodes.get(graph[graphNode.targetId])
        if (end) {
          const { x: x2, y: y2 } = end.absolutePosition()
          const { width: endWidth, height: endHeight } = start.size()
          const line = new Konva.Arrow({
            points: [
              x1 + startWidth / 2,
              y1 + startHeight / 2,
              x2 + endWidth / 2,
              y2 + endHeight / 2,
            ],
            pointerLength: 5,
            pointerWidth: 5,
            fill: 'black',
            stroke: 'black',
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
          })
          layer.add(line)
        }
        break
      }
      case 'injectable': {
        for (const dependencyId of graphNode.dependencyIds) {
          const end = nodes.get(graph[dependencyId])
          if (end) {
            const { x: x2, y: y2 } = end.absolutePosition()
            const { width: endWidth, height: endHeight } = start.size()
            const line = new Konva.Arrow({
              points: [
                x1 + startWidth / 2,
                y1 + startHeight / 2,
                x2 + endWidth / 2,
                y2 + endHeight / 2,
              ],
              pointerLength: 5,
              pointerWidth: 5,
              fill: 'black',
              stroke: 'black',
              strokeWidth: 1,
              lineCap: 'round',
              lineJoin: 'round',
            })
            layer.add(line)
          }
        }
        break
      }
    }
  }
}

function getNodeGroupName(node: NormalizedGraphNode): string | undefined {
  const appMatch = node.file.match(/^apps\/([^/]+)\//)
  if (appMatch) {
    // const app = appMatch[1]
    // const subdomain = node.file.slice(`apps/${app}/src/`.length)
    // const subdomainMatch = subdomain.match(/^([^/]+)\//)
    // console.log(subdomain)
    // const subdomainMatch =
    return appMatch[1]
  }
  const packageMatch = node.file.match(/^packages\/([^/]+)\//)
  if (packageMatch) {
    return packageMatch[1]
  }
}

function initZoom(stage: Konva.Stage): void {
  stage.on('wheel', (e) => {
    // stop default scrolling
    e.evt.preventDefault()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction
    }

    const newScale =
      direction > 0 ? oldScale * SCALE_FACTOR : oldScale / SCALE_FACTOR

    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    stage.position(newPos)
  })
}

function getGraphNodeColor(node: NormalizedGraphNode): string {
  switch (node.kind) {
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
}
