import { memo, useLayoutEffect, useRef } from "react";
import { GlobalStyled } from './global.styled'
import * as GO from 'gojs/release/go-debug'

export const GoApp = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (container)
  }, [])

  return (
    <>
      <GlobalStyled />
      <div>hi</div>
    </>
  )
})
