import { injectable, token } from '@injectable-ts/core'
import { useState } from 'react'

interface CounterService {
  count: number
  inc: () => void
  dec: () => void
}

export const counterService = injectable(
  'COUNTER_SERVICE',
  token('COUNT')<number>(),
  injectable('INC', () => () => {}),
  injectable('DEC', () => () => {}),
  (count, inc, dec): CounterService => ({
    count: count as number,
    inc: inc as () => void,
    dec: dec as () => void,
  })
)

export function useCounter() {
  const [count, setCount] = useState(0)
  const inc = () => setCount((c) => ++c)
  const dec = () => setCount((c) => --c)

  return [count, { inc, dec }] as [number, { inc: () => void; dec: () => void }]
}
