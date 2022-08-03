## Constants

<dl>
<dt><a href="#DependenciesProvider">DependenciesProvider</a> : <code>Component</code></dt>
<dd><p>Provide dependency with React context</p></dd>
</dl>

## Functions

<dl>
<dt><a href="#useInjectable">useInjectable(...dependencies, overrides)</a> ⇒ <code>unknown</code></dt>
<dd><p>React hook for retrieve injectable value inside IoC context</p></dd>
</dl>

<a name="DependenciesProvider"></a>

## DependenciesProvider : <code>Component</code>
<p>Provide dependency with React context</p>

**Kind**: global constant  
**Example**  
```js
const value = token('foo')<string>()
const Component = () => {
  const depFoo useInjectable(value)
  return <div>{depFoo}</div>
}
const App = () => {
  return (
   <DependenciesProvider value={{ foo: 'bar'}}>
     <Component />
   </DependenciesProvider>
  )
}
```
<a name="useInjectable"></a>

## useInjectable(...dependencies, overrides) ⇒ <code>unknown</code>
<p>React hook for retrieve injectable value inside IoC context</p>

**Kind**: global function  
**Returns**: <code>unknown</code> - <p>dependency</p>  

| Param | Type |
| --- | --- |
| ...dependencies | <code>unknown</code> | 
| overrides | <code>Partial.&lt;InjectableDependencies.&lt;Input&gt;&gt;</code> | 

**Example**  
```js
const value = token('foo')<string>()
const Component = () => {
  const depFoo useInjectable(value)
  return <div>{depFoo}</div>
}
```
