import { createContext } from 'react'

export interface UnknownDependencies {
  readonly [Name: PropertyKey]: unknown
}

export const context = createContext<UnknownDependencies | undefined>(undefined)
