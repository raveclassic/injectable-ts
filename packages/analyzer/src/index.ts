import path from 'path'
import { getInjectableCore } from './injectable-core'
import { buildGraphMap, getRoots } from './graph-node'
import * as TSM from 'ts-morph'

const SELF = path.resolve(__dirname)
const demoTSConfig = path.resolve(SELF, './demo/tsconfig.json')
const injectableCore = path.resolve(SELF, '../../core/src/index.ts')

async function run() {
  const project = new TSM.Project({
    tsConfigFilePath: demoTSConfig,
  })

  const core = getInjectableCore(project, injectableCore)

  const graph = buildGraphMap(project, core)
  const roots = getRoots(graph)

  const print = (reference: TSM.Node) => {
    const node = graph.get(reference)
    if (!node) throw new Error('Invalid graph')
    console.log(node.name, node.type)
    if (node.kind === 'InjectableNode') {
      console.log('dependencies')
      node.dependencies.map(print)
    }
  }
  for (const root of roots) {
    console.log('-------')
    print(root)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
