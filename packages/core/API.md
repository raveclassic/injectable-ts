## Functions

<dl>
<dt><a href="#injectable">injectable(name, ...dependencies)</a> ⇒ <code>Injectable</code></dt>
<dd><p>Create IoC with DI</p></dd>
<dt><a href="#provide">provide(...dependencies)</a> ⇒ <code>Injectable</code></dt>
<dd><p>Takes a list of keys of available dependencies and &quot;splits&quot; the computation into 2 nested computations - inner and outer</p>
<ol>
<li>the &quot;outer&quot; computation that takes all dependencies but passed to provide</li>
<li>the &quot;inner&quot; computation that takes only dependencies passed to provide</li>
</ol></dd>
<dt><a href="#token">token(name)</a> ⇒ <code>Injectable</code></dt>
<dd><p>Create injectable with assign dependency to named key</p></dd>
</dl>

<a name="injectable"></a>

## injectable(name, ...dependencies) ⇒ <code>Injectable</code>
<p>Create IoC with DI</p>

**Kind**: global function  

| Param | Type |
| --- | --- |
| name | <code>Name</code> | 
| ...dependencies | <code>unknown</code> | 

**Example**  
```js
const a = token('a')<string>()
const b = injectable('b', a, (a) => `${a} b`)
const c = injectable(b, (b) => `${b} c`)
c({ a: 'a', b: 'override!' }) // returns "override! c"
```
<a name="provide"></a>

## provide(...dependencies) ⇒ <code>Injectable</code>
<p>Takes a list of keys of available dependencies and &quot;splits&quot; the computation into 2 nested computations - inner and outer</p>
<ol>
<li>the &quot;outer&quot; computation that takes all dependencies but passed to provide</li>
<li>the &quot;inner&quot; computation that takes only dependencies passed to provide</li>
</ol>

**Kind**: global function  

| Param | Type |
| --- | --- |
| ...dependencies | <code>unknown</code> | 

**Example**  
```js
const a = token('a')<string>()
const b = injectable('b', a, (a) => `${a} b`)
const c = injectable(b, (b) => `${b} c`)
const outer = provide(c)<'b'>()
const inner = outer({}) // empty object here as there are no dependencies left
inner({ b: 'override!' }) // no 'a' required, returns "override! c"
```
<a name="token"></a>

## token(name) ⇒ <code>Injectable</code>
<p>Create injectable with assign dependency to named key</p>

**Kind**: global function  

| Param | Type |
| --- | --- |
| name | <code>Name</code> | 

**Example**  
```js
const a = token('a')<string>()
const b = injectable(a, (a) => `${a} b`)
```
