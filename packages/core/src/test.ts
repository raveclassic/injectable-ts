import {
  Injectable,
  injectable,
  InjectableDependencies,
  InjectableValue,
} from './injectable'
import { token } from './token'
import { provide } from './provide'

type Foo = Injectable<
  {
    name: 'a'
    type: 'result'
    optional: false
    children: [
      {
        name: 'b'
        type: string
        optional: true
        children: [
          {
            name: 'c'
            type: number
            optional: false
            children: []
          }
        ]
      },
      {
        name: 'e'
        type: string
        optional: false
        children: []
      }
    ]
  },
  Date
>

declare const foo: Foo
const result = injectable('result', foo, (foo) => foo.toLocaleString())

const d = token('d')<'d'>()
type D = typeof d
type DValue = InjectableValue<D>
type DDependencies = InjectableDependencies<D>

const c = injectable('c', d, (d) => d)
type C = typeof c
type CValue = InjectableValue<C>
type CDependencies = InjectableDependencies<C>

const b = injectable('b', c, (c) => c)
type B = typeof b
type BValue = InjectableValue<B>
type BDependencies = InjectableDependencies<B>

const e = token('e')<'e'>()
type E = typeof e
type EValue = InjectableValue<E>
type EDependencies = InjectableDependencies<E>

const a = injectable('a', b, e, (b, e) => `b: ${b}, e: ${e}` as const)
type A = typeof a
type AValue = InjectableValue<A>
type ADependencies = InjectableDependencies<A>

//
const r = a({
  e: 'e',
  d: 'd',
})

const withoutD = provide(a)<'d'>()
type WithoutD = typeof withoutD
type WithoutDValue = InjectableValue<WithoutD>
type WithoutDDependencies = InjectableDependencies<WithoutD>

const withoutC = provide(a)<'c'>()
type WithoutC = typeof withoutC
type WithoutCValue = InjectableValue<WithoutC>
type WithoutCDependencies = InjectableDependencies<WithoutC>

const withoutB = provide(a)<'b'>()
type WithoutB = typeof withoutB
type WithoutBValue = InjectableValue<WithoutB>
type WithoutBDependencies = InjectableDependencies<WithoutB>

const withoutE = provide(a)<'e'>()
type WithoutE = typeof withoutE
type WithoutEValue = InjectableValue<WithoutE>
type WithoutEDependencies = InjectableDependencies<WithoutE>

const withoutDE = provide(a)<'d' | 'e'>()
type WithoutDE = typeof withoutDE
type WithoutDEValue = InjectableValue<WithoutDE>
type WithoutDEDependencies = InjectableDependencies<WithoutDE>

const rrrr = withoutDE({
  b: 'd',
})
const final = rrrr({
  e: 'e',
  d: 'd',
})
