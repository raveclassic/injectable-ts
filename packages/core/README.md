# @injectable-ts/core

This package contains the building blocks for IoC/DI.

## Overview

The main idea of the library stands on primitive building blocks - computations.
A computation is just a pure function taking some dependencies (or none) and returning some value.

Let's consider a simple authorization service:

```typescript
interface AuthService {
  /**
   * Authorizes user by login/password credentials
   * and returns authentication token
   */
  authorize(login: string, password: string): Promise<string>
}

const authService: AuthService = {
  async authorize(login: string, password: string): Promise<string> {
    const response = await fetch('https://my-api.com/authorize', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    })
    return await response.json()
  },
}
```

The first thing that might catch your eye is that API url is hardcoded.
That's not an option, and we'd like to configure the instance of this service.
We have several options:

- pass the url together with login and password - doesn't make the API very friendly
- turn the service constant (`authService`) to a constructor (`newAuthService`) that would take the url in arguments - slightly better,
  but we would have to create a global instance somewhere in the root of the app and always reference that instance everywhere in the code
- inverse the control and inject the url via IoC

So, the best option seems to rely on IoC.
How can we do it?

As mentioned above, `@injectable-ts/core` operates on "computations" which can depend on other computations.
So we need to update the code:

```typescript
import { injectable } from '@injectable-ts/core'

const authService = injectable(
  (): AuthService => ({
    async authorize(login: string, password: string): Promise<string> {
      // implementation here
    },
  })
)
```

Now we need to turn the url into "dependent computation".
`@injectable-ts/core` provides a special function `token` to require everything we need.
We can simply add such token to the list of dependencies of our `authService`

```typescript
const authService = injectable(
  token(/** Name */ 'API_URL')</** Type */ string>(),
  (/** Resolved value */ apiUrl): AuthService => ({
    async authorize(login: string, password: string): Promise<string> {
      // now we can use the url directly
      // as it's available in the closure
      const response = await fetch(`${apiUrl}/authorize`)
      // apiUrl as a string ----------^
      // as required by `token`
    },
  })
)
```

Finally, as our `authService` is not a constant anymore but an `Injectable`,
we have to "run" the computation to get the instance:

```typescript
//               "Injectable" is just a function taking dependencies and returning a value
//              /
const service = authService({ API_URL: 'https://my-api.com' })
//    ^------ the type is AuthService
```

This is quite boring and doesn't show any benefits at all. _Yet_.

Let's add something more interesting to the code, for instance how about fetching a list of our favourite movies
from the same API and logging them to the console?

We'll need a `MovieService`, a `Logger` and some root entry point of our mini-app that will execute everything:

```typescript
interface MovieService {
  fetchMovies(authToken: string): Promise<readonly string[]>
}

const movieService = injectable(
  token('API_URL')<string>(),
  (apiUrl): MovieService => ({
    async fetchMovies(authToken: string): Promise<readonly string[]> {
      const response = await fetch(`${apiUrl}/movies?token=${authToken}`)
      return await response.json()
    },
  })
)

interface Logger {
  log(...args: readonly unknown[]): void
}

const logger = injectable((): Logger => console)

interface EntryPoint {
  (login: string, password: string): Promise<void>
}

const entryPoint = injectable(
  authService,
  movieService,
  logger,
  (authService, movieService): EntryPoint =>
    async (login, password): Promise<void> => {
      const token = await authService.authorize(login, password)
      const movies = await movieService.fetchMovies(token)
      logger.log(movies)
    }
)
```

Now that we have "designed" our mini-app, it's time to run it!

```typescript
const run = entryPoint({ API_URL: 'https://my-api.com' })
await run('John Doe', 'qweqwe')
// logs "'The Lord of the Rings', 'Star Wars'" to the console
```

Okay, now here's a lot to discuss.

First, we define a `MovieService` interface and its implementation `movieService` that requires the same `API_URL`
that was required by `authService` before.
The implementation takes auth token in arguments and sends it to the API via query parameter.

Next, we define a simple `Logger` interface with a simple implementation logging to console.

After that, we define the entry point of our mini-app.
It depends on `AuthService`, `MovieService` and `Logger` and is a simple async function returning void.

Finally, we "run" the computation of our entry point passing in login and password.

> Both `token` and `injectable` return `Injectable` so we can pass them to
> other `injectable` calls as dependencies.

Much better, our entry point is now completely unaware of the API_URL!
However, its implementation is still tightly coupled to implementations of the services and the logger.
Where's the IoC?

The trick is that `injectable` function can take additional first argument `name` that allows overrides for default implementations.
Let's see how it works. We'll need to add names to all our services and to the logger:

```typescript
const authService = injectable(
  'AUTH_SERVICE',
  token('API_URL')<string>(),
  (apiUrl): AuthService => ({...})
)

const movieService = injectable(
  'MOVIE_SERVICE',
  token('API_URL')<string>(),
  (apiUrl): MovieService => ({...})
)

const logger = injectable('LOGGER', (): Logger => console)
```

Now we can override anything we need:

```typescript
const testAuthService: AuthService = {
  authorize: () => Promise.resolve('ADMIN_TOKEN'),
}
const testMovieService: MovieService = {
  fetchMovies: () => Promise.resolve(['Twilight']),
}
const testLogger: Logger = { log: () => {} }

const run = entryPoint({
  AUTH_SERVICE: testAuthService,
  MOVIE_SERVICE: testMovieService,
  LOGGER: testLogger,
  API_URL: '',
})

await run('', '') // logs "['Twilight']"
```

The most important thing is that all dependencies of `entryPoint` are statically type checked.
If we add something extra or forget to add required dependency, TypeScript throws in _compile time_.

So, to summarize:

1. > `injectable` combines IoC and automatic DI by allowing to move replaceable parts of the code to dependencies
   > and by allowing to add default implementations for those dependencies
   > so that we are never forced to manually register them in the app root.

2. > `injectable` implements automatic DI by bubbling up all nested dependencies up to the root computation implicitly.

3. > all dependencies of `entryPoint` are _statically_ type checked, if we pass something that is not required
   > or forget to pass something that is required, TypeScript throws in _compile time_.

## Design

### Dependencies

As mentioned above, at the core of `@injectable-ts` lies the concept of computations or, in other words,
functions from dependencies to values:

```typescript
export interface Injectable<Tree extends UnknownDependencyTree, Value> {
  (tree: Flatten<Tree>): Value
}
```

Dependencies of a computation are encoded as a tree structure each leaf of which
holds dependency name, its type and its dependencies.

A computation, as described above, is a pure function that takes dependencies as an argument and produces some value.
As dependencies in `Injectable` interface type signature are encoded as a tree,
it wouldn't be very convenient to pass them as an argument directly in a form of tree.

Thus, we convert the tree into a simple `Record` that maps all dependency names to their types.
This convertor is called `Flatten` and it's intentionally unavailable in the public API of the library,
as it's an implementation detail.

Using `Injectable` interface we can build infinite dependency graphs.

### Combining injectables

If we have several dependant computations we can combine them into a single computation
that will implicitly forward all child's dependencies:

```typescript
const a = token('a')<string>()
const b = injectable(a, (a) => `${a} b`)
const c = injectable(a, (a) => `${a} c`)
const d = injectable(b, c, (b, c) => `${b} ${c} d`)
```

In the code example above, `d` requires `a` token to be provided:

```typescript
d({ a: 'foo' }) // returns "foo b foo c d"
```

This is possible thanks to TypeScript's powerful type system that allows product types (`&`).

If we have a computation `a = aDependencies -> aValue` and computation `b = bDependencies -> bValue`,
we can build a new computation `c = aDependencies & bDependencies -> f(vValue, bValue)` where `f` is the
"projection function" (the last argument to `injectable`).

If the first argument to `injectable` is a `PropertyKey` (a string, a number or a symbol), then `injectable`
adds itself to the dependency graph as an optional dependency so that it can be overridden by the caller:

```typescript
const a = token('a')<string>()
const b = injectable('b', a, (a) => `${a} b`)
const c = injectable(b, (b) => `${b} c`)

c({ a: 'a', b: 'override!' }) // returns "override! c"
```

### Advanced overrides

As seen above, even if we want to completely replace implementation of `b`, at the time of this writing,
it's technically impossible to change the type of flattened dependencies on-the-fly
(e.g. remove `a` from dependencies, as `b` is fully replaced).

However, there is a solution - `provide`.

`provide` takes a list of keys of available dependencies and "splits" the computation into 2 nested computations:

1. the "outer" computation that takes all dependencies but passed to `provide`
2. the "inner" computation that takes only dependencies passed to `provide`

```typescript
const a = token('a')<string>()
const b = injectable('b', a, (a) => `${a} b`)
const c = injectable(b, (b) => `${b} c`)
const outer = provide(c)<'b'>()
const inner = outer({}) // empty object here as there are no dependencies left
inner({ b: 'override!' }) // no 'a' required, returns "override! c"
```

The example above might seem awkward, but it makes more sense when used with another `injectable` call:

```typescript
const a = token('a')<string>()
const b = injectable('b', a, (a) => `${a} b`)
const c = injectable(b, (b) => `${b} c`)

const d = injectable(provide(c)<'b'>(), (getC) => getC({ b: 'override!' })) // same result as above
```

Such technique may be really useful when we want to override some part of our dependency graph on-the-fly
with some dependency that is known only in runtime.
