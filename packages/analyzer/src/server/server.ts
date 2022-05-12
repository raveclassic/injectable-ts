import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { createRequestHandler } from '@remix-run/express'
import * as TSM from 'ts-morph'
import { getInjectableCore } from './injectable-core'
import { buildGraphMap, getRoots } from './graph-node'

const PORT = 3000
const MODE = process.env['NODE_ENV']

const SELF = path.resolve(__dirname)
const ROOT = path.resolve(SELF, '../../')
const BUILD_DIR = path.resolve(ROOT, './build')
const PUBLIC_DIR = path.resolve(ROOT, './public')
const PUBLIC_BUILD_DIR = path.resolve(ROOT, './public/build')
const DEMO_TS_CONFIG = path.resolve(SELF, '../demo/tsconfig.json')
const INJECTABLE_CORE = path.resolve(SELF, '../../../core/src/index.ts')

const app = express()
app.use(express.static(PUBLIC_DIR, { maxAge: '1h' }))

const server = createServer(app)
const io = new Server(server)
io.on('connection', (socket) => {
  const project = new TSM.Project({
    tsConfigFilePath: DEMO_TS_CONFIG,
  })
  const core = getInjectableCore(project, INJECTABLE_CORE)
  const map = buildGraphMap(project, core)
  const roots = getRoots(map)
  socket.emit('GRAPHS', roots)
})

app.use(express.static(PUBLIC_BUILD_DIR, { immutable: true, maxAge: '1y' }))

app.all(
  '*',
  MODE === 'production'
    ? createRequestHandler({ build: require(BUILD_DIR) })
    : (req, res, next) => {
        purgeRequireCache()
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const build = require(BUILD_DIR)
        return createRequestHandler({ build, mode: MODE })(req, res, next)
      }
)

server.listen(PORT, () => {
  console.log(`Express server listening on`, server.address())
})

////////////////////////////////////////////////////////////////////////////////
function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key]
    }
  }
}
