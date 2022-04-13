# @injectable-ts/core

This package contains the building blocks for IoC/DI.

## Overview

The main idea of the library stands on primitive building blocks - computations.
A computation is just a function taking some dependencies (or none) and returning some value.

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

The first thing that catches your eye is that API url is hardcoded.
That's not an option, and we'd like to configure the instance of the service.
We have several options:

- pass the url together with login and password - doesn't make the API very friendly
- turn the service constant (`authService`) to a constructor (`newAuthService`) that would take the url in arguments - slightly better but we have to create a global instance somewhere in the root of the app and always reference that instance everywhere in the code
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
`@injectable-ts/core` ships a special function `token` to require everything we need.
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

Let's add something more to the code, for instance how about fetching a list of our favourite movies
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

The trick is that `injectable` function can take additional first argument `name` that allows overrides of "default" implementations.
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
