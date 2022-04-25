import { render } from '@testing-library/react'
import { useInjectable } from './use-injectable'
import { injectable, token } from '@injectable-ts/core'
import React, { StrictMode } from 'react'
import { suppressConsoleError } from './utils'
import { DependenciesProvider } from './dependencies-provider'

describe('useInjectable', () => {
  it('infers the type correctly', () => {
    const value = injectable(() => 123)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Component = () => {
      // $ExpectType number
      const v = useInjectable(value)
      return v
    }
  })
  it('throws if called not within DependenciesProvider subtree', () => {
    const dispose = suppressConsoleError()
    const value = injectable(() => 123)
    const Component = () => {
      useInjectable(value)
      return null
    }
    expect(() =>
      render(
        <StrictMode>
          <Component />
        </StrictMode>
      )
    ).toThrow()
    dispose()
  })
  it('reads dependencies from the nearest DependenciesProvider', () => {
    const value = token('foo')<string>()
    const cb = jest.fn()
    const Component = () => {
      cb(useInjectable(value))
      return null
    }
    render(
      <StrictMode>
        <DependenciesProvider value={{ foo: 'foo' }}>
          <DependenciesProvider value={{ foo: 'bar' }}>
            <Component />
          </DependenciesProvider>
        </DependenciesProvider>
      </StrictMode>
    )
    expect(cb).toHaveBeenLastCalledWith('bar')
  })
  it('reads dependencies from the any DependenciesProvider up in the tree', () => {
    const value = token('foo')<string>()
    const cb = jest.fn()
    const Component = () => {
      cb(useInjectable(value))
      return null
    }
    render(
      <StrictMode>
        <DependenciesProvider value={{ foo: 'foo' }}>
          <DependenciesProvider value={{ bar: 'bar' }}>
            <Component />
          </DependenciesProvider>
        </DependenciesProvider>
      </StrictMode>
    )
    expect(cb).toHaveBeenLastCalledWith('foo')
  })
  it('throws if token is missing in DependenciesProvider', () => {
    const dispose = suppressConsoleError()
    const value = token('foo')<string>()
    const Component = () => {
      useInjectable(value)
      return null
    }
    expect(() =>
      render(
        <StrictMode>
          <DependenciesProvider value={{}}>
            <Component />
          </DependenciesProvider>
        </StrictMode>
      )
    ).toThrow()
    dispose()
  })
  it('reads dependencies from overrides passed in arguments', () => {
    const value = token('foo')<string>()
    const cb = jest.fn()
    const Component = () => {
      cb(useInjectable(value, { foo: 'bar' }))
      return null
    }
    render(
      <StrictMode>
        <DependenciesProvider value={{ foo: 'foo' }}>
          <Component />
        </DependenciesProvider>
      </StrictMode>
    )
    expect(cb).toHaveBeenLastCalledWith('bar')
  })
})
