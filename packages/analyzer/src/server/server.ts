// import fs from 'fs'
import path from 'path'
// import express from 'express'
// import { createServer as createViteServer } from 'vite'
import { getInjectableCore } from './injectable-ts-core'
import { buildGraph } from './graph'
import { newProject } from './project'

// const SELF = path.resolve(__dirname)

const PROJECT_ROOT =
  '/Users/raveclassic/WebstormProjects/dexscreener/ds/packages/util-network'
const PROJECT_TS_CONFIG = path.resolve(PROJECT_ROOT, 'tsconfig.lib.json')
// const INJECTABLE_TS_DECLARATION_FILE = path.resolve(
//   PROJECT_ROOT,
//   '../../node_modules/@injectable-ts/core/src/index.d.ts'
// )
//
// async function createServer() {
//   const app = express()
//
//   // Create Vite server in middleware mode and configure the app type as
//   // 'custom', disabling Vite's own HTML serving logic so parent server
//   // can take control
//   const vite = await createViteServer({
//     server: { middlewareMode: true },
//     appType: 'custom',
//   })
//
//   // use vite's connect instance as middleware
//   // if you use your own express router (express.Router()), you should use router.use
//   app.use(vite.middlewares)
//
//   app.use('*', async (req, res, next) => {
//     const url = req.originalUrl
//
//     try {
//       // 1. Read index.html
//       let template = fs.readFileSync(
//         path.resolve(SELF, '../../index.html'),
//         'utf-8'
//       )
//
//       // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
//       //    also applies HTML transforms from Vite plugins, e.g. global preambles
//       //    from @vitejs/plugin-react
//       template = await vite.transformIndexHtml(url, template)
//
//       // 3. Load the server entry. vite.ssrLoadModule automatically transforms
//       //    your ESM source code to be usable in Node.js! There is no bundling
//       //    required, and provides efficient invalidation similar to HMR.
//       const { render } = await vite.ssrLoadModule(
//         path.resolve(SELF, 'entry.tsx')
//       )
//
//       // 4. render the app HTML. This assumes entry-server.js's exported `render`
//       //    function calls appropriate framework SSR APIs,
//       //    e.g. ReactDOMServer.renderToString()
//       const appHtml = await render(url)
//
//       // 5. Inject the app-rendered HTML into the template.
//       const html = template.replace(`<!--ssr-outlet-->`, appHtml)
//
//       // 6. Send the rendered HTML back.
//       res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
//     } catch (e) {
//       // If an error is caught, let Vite fix the stack trace so it maps back to
//       // your actual source code.
//       vite.ssrFixStacktrace(e instanceof Error ? e : new Error(`${e}`))
//       next(e)
//     }
//   })
//
//   app.listen(5173)
// }
//
// void createServer()
const project = newProject(PROJECT_TS_CONFIG)

const core = getInjectableCore(project)
// const tokens = getTokenNodes(project, core)
//
// // console.info({
// // tokens: getTokenNodes(project, core),
// // })
// getInjectableNodes(project, core, tokens)
buildGraph(project, core)
