// build the following graph
//           a
//          / \
// (token) e   b
//              \
//               c
//                \
//                 d (token)
import { injectable, token } from '@injectable-ts/core'

const d = token('token name')<'token type'>()
const c = injectable(d, (d) => `c->${d}` as const)
const b = injectable(
  'b',
  c,
  token('inline')<'iii'>(),
  (c, iii) => `b->${c} b->${iii}` as const
)
const e = token('e')<'e'>()
export const a = injectable('a', b, e, (b, e) => `a->${b}, a->${e}` as const)
// const withD = provide(a)<'d'>()
