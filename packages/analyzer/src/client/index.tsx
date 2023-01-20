import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'

import { GoApp } from '../app/go-app'

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <GoApp />
    </StrictMode>
  )
}
