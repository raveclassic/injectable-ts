import { AuthService, MovieService, Logger, entryPoint } from './app'

jest.spyOn(global.console, 'log')

describe('@injectable-ts/core-example', () => {
  it('mock auth, movie services and logger in movie app', async () => {
    const testAuthService: AuthService = {
      authorize: () => Promise.resolve('ADMIN_TOKEN'),
    }
    const testMovieService: MovieService = {
      fetchMovies: () => Promise.resolve(['Twilight']),
    }
    const testLogger: Logger = { log: console.log }

    const run = entryPoint({
      AUTH_SERVICE: testAuthService,
      MOVIE_SERVICE: testMovieService,
      LOGGER: testLogger,
      API_URL: '',
    })

    await run('', '')
    expect(console.log).toHaveBeenCalledWith(['Twilight'])
  })
})
