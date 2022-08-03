import React from 'react'
import { useInjectable } from '@injectable-ts/react'
import { counterService } from './Counter.service'

function Counter() {
  const cs = useInjectable(counterService)

  return (
    <div>
      <div>Counter: {cs.count}</div>
      <button onClick={cs.inc}>+</button>
      <button onClick={cs.dec}>-</button>
    </div>
  )
}

export default Counter
