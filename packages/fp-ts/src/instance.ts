import { Injectable, UnknownDependencyTree } from '@injectable-ts/core'
import { pipeable } from 'fp-ts/lib/pipeable'
import { Monad1 } from 'fp-ts/lib/Monad'

export const URI = '@injectable-ts/fp-ts//Injectable'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Injectable<UnknownDependencyTree, A>
  }
}

export const MonadInjectable: Monad1<URI> = {
  URI,
  of: (a) => () => a,
  map: (fa, f) => (e) => f(fa(e)),
  chain: (fa, f) => (e) => f(fa(e))(e),
  ap: (fab, fa) => (e) => fab(e)(fa(e)),
}

export const { chain, ap, map, apFirst, chainFirst, apSecond, flatten } =
  pipeable(MonadInjectable)
