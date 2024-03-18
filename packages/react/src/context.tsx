import { createContext } from 'react'

export interface UnknownDependencies {
  readonly [Name: PropertyKey]: unknown
}

export const context = /* @__PURE__ */ createContext<
  UnknownDependencies | undefined
>(undefined)
