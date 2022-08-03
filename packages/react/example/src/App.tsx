import React from 'react'
import { DependenciesProvider } from '@injectable-ts/react'
import Counter from './Counter'
import { counterService, useCounter } from './Counter.service'

function App() {
  const [count, { inc, dec }] = useCounter()

  return (
    <DependenciesProvider
      value={{
        COUNTER_SERVICE: counterService({
          COUNT: count,
          INC: inc,
          DEC: dec,
        }),
      }}
    >
      <Counter />
    </DependenciesProvider>
  )
}

export default App
