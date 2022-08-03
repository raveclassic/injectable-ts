import { injectable, token } from '@injectable-ts/core'
// for real API requests
// import fetch from 'node-fetch'

export interface Logger {
  log(...args: readonly unknown[]): void
}

const logger = injectable('LOGGER', (): Logger => console)

export interface AuthService {
  authorize(login: string, password: string): Promise<string>
}

const authService = injectable(
  'AUTH_SERVICE',
  logger,
  token('API_URL')<string>(),
  (logger, apiUrl): AuthService => ({
    async authorize(login: string, password: string): Promise<string> {
      // emulate api
      return new Promise((resolve) => {
        logger.log(
          `request to ${apiUrl} with params login=${login}, password=${password}`
        )
        resolve('my-token')
      })

      /*
        if you want to connect real API:
        const response = await fetch(
          `${apiUrl}/authorize?login=${login}&password=${password}`
        )
        // eslint-disable-next-line no-restricted-syntax
        return (await response.json()) as Promise<string>
      */
    },
  })
)

export interface MovieService {
  fetchMovies(authToken: string): Promise<readonly string[]>
}

const movieService = injectable(
  'MOVIE_SERVICE',
  logger,
  token('API_URL')<string>(),
  (logger, apiUrl): MovieService => ({
    async fetchMovies(authToken: string): Promise<readonly string[]> {
      // emulate api
      return new Promise((resolve) => {
        logger.log(`request to ${apiUrl} with token=${authToken}`)
        resolve(['Twilight'])
      })

      /*
        if you want to connect real API:
        const response = await fetch(`${apiUrl}/movies?token=${authToken}`)
        // eslint-disable-next-line no-restricted-syntax
        return (await response.json()) as Promise<readonly string[]>
      */
    },
  })
)

export interface EntryPoint {
  (login: string, password: string): Promise<void>
}

export const entryPoint = injectable(
  authService,
  movieService,
  logger,
  (authService, movieService, logger): EntryPoint =>
    async (login, password): Promise<void> => {
      const token = await authService.authorize(login, password)
      const movies = await movieService.fetchMovies(token)
      logger.log(movies)
    }
)
