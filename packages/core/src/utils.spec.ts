import { isPropertyKey, isRecord } from './utils'

describe('utils', () => {
  describe('isPropertyKey', () => {
    it('returns true for strings', () => {
      expect(isPropertyKey('foo')).toEqual(true)
    })
    it('returns true for numbers', () => {
      expect(isPropertyKey(123)).toEqual(true)
    })
    it('returns true for symbols', () => {
      expect(isPropertyKey(Symbol('foo'))).toEqual(true)
    })
    it('returns true for everything else', () => {
      expect(isPropertyKey([])).toEqual(false)
      expect(isPropertyKey({})).toEqual(false)
      expect(isPropertyKey(new Date())).toEqual(false)
      expect(isPropertyKey(() => {})).toEqual(false)
    })
  })

  describe('isRecord', () => {
    it('returns true for object literals', () => {
      expect(isRecord({})).toEqual(true)
    })
    it('returns false for object nulls', () => {
      expect(isRecord(null)).toEqual(false)
    })
    it('returns false for arrays', () => {
      expect(isRecord([])).toEqual(false)
    })
    it('returns false for everything else', () => {
      expect(isRecord('foo')).toEqual(false)
      expect(isRecord(123)).toEqual(false)
      expect(isRecord(Symbol('foo'))).toEqual(false)
      expect(isRecord(new Date())).toEqual(false)
      expect(isRecord(() => {})).toEqual(false)
      expect(isRecord(new Map())).toEqual(false)
      expect(isRecord(new Set())).toEqual(false)
      expect(isRecord(new WeakSet())).toEqual(false)
      expect(isRecord(new WeakMap())).toEqual(false)
      expect(isRecord(BigInt(123))).toEqual(false)
    })
  })
})
