import { Project, Node, ts } from 'ts-morph'
import * as TSM from 'ts-morph'
import { InjectableCore } from './injectable-core'

interface TokenNode {
  readonly kind: 'TokenNode'
  readonly name: string
  readonly reference: TSM.Node
  readonly type: unknown
  readonly parents: TSM.Node[]
}

interface InjectableNode {
  readonly kind: 'InjectableNode'
  readonly name?: string
  readonly type: unknown
  readonly reference: TSM.Node
  readonly dependencies: readonly TSM.Node[]
  readonly parents: TSM.Node[]
}

// interface ProvideNode {
//   readonly kind: 'ProvideNode'
//   readonly target: GraphNode
//   readonly keys: readonly PropertyKey[]
//   readonly parents: TSM.Node[]
// }

type GraphNode = TokenNode | InjectableNode /*| ProvideNode*/

export interface GraphMap extends ReadonlyMap<TSM.Node, GraphNode> {}

export function buildGraphMap(
  project: TSM.Project,
  injectableCore: InjectableCore
): GraphMap {
  const graphMap = new Map<TSM.Node, GraphNode>()
  fillTokenCalls(project, injectableCore, graphMap)
  fillInjectableCalls(project, injectableCore, graphMap)
  fillParents(graphMap)
  return graphMap
}

const getReferenceNode = (node: TSM.Node): TSM.Node => {
  const parent = node.getParentOrThrow()
  return TSM.Node.isReferenceFindable(parent) ? parent : node
}

const fillTokenCall = (
  call: TSM.CallExpression,
  out: Map<TSM.Node, GraphNode>
): void => {
  const injectableType = parseInjectableType(call)
  if (!injectableType) return

  const reference = getReferenceNode(call)

  const tokenNode: TokenNode = {
    kind: 'TokenNode',
    name: injectableType.name,
    type: injectableType.type,
    reference,
    parents: [],
  }
  out.set(reference, tokenNode)
}

const fillTokenCalls = (
  project: Project,
  core: InjectableCore,
  out: Map<TSM.Node, GraphNode>
): void => {
  for (const node of core.token.findReferencesAsNodes()) {
    const parent = node.getParent()

    if (!Node.isCallExpression(parent)) continue
    // is at least "token('name')"

    const grandParent = parent.getParent()
    if (!Node.isCallExpression(grandParent)) continue
    // is full "token('name')<type>()"

    fillTokenCall(grandParent, out)
  }
}

const fillInjectableCall = (
  call: TSM.CallExpression,
  core: InjectableCore,
  out: Map<TSM.Node, GraphNode>
): void => {
  const args = call.getArguments()

  const nameNode = getInjectableName(args[0], core)
  const dependenciesNodes = args.slice(
    nameNode !== undefined ? 1 : 0,
    args.length - 1
  )
  const dependencies = dependenciesNodes.map(resolveNode)

  const injectableType = parseInjectableType(call)
  if (!injectableType) return
  // return type is Injectable<DependenciesTree, Value>

  const reference = getReferenceNode(call)

  const injectableNode: InjectableNode = {
    kind: 'InjectableNode',
    name: injectableType.name === 'never' ? undefined : injectableType.name,
    type: injectableType.type,
    reference,
    dependencies: dependencies.slice(),
    parents: [],
  }

  out.set(reference, injectableNode)
}

const fillInjectableCalls = (
  project: Project,
  core: InjectableCore,
  out: Map<TSM.Node, GraphNode>
): void => {
  for (const node of core.injectable.findReferencesAsNodes()) {
    const parent = node.getParent()

    if (!Node.isCallExpression(parent)) continue
    // is "injectable(['name'], ...dependencies, f)"

    fillInjectableCall(parent, core, out)
  }
}

const fillParents = (map: GraphMap): void => {
  for (const [reference, node] of map.entries()) {
    if (node.kind === 'InjectableNode') {
      for (const dependency of node.dependencies) {
        const dependencyNode = map.get(dependency)
        if (dependencyNode) {
          dependencyNode.parents.push(reference)
        }
      }
    }
  }
}

const getInjectableName = (
  node: Node<ts.Node> | undefined,
  core: InjectableCore
): Node<ts.Node> | undefined => {
  if (node) {
    const type = node.getType()
    if (type.getSymbol() !== core.Injectable) {
      return node
    }
  }
  return undefined
}

interface InjectableType {
  readonly name: string
  readonly type: string
}
const parseInjectableType = (
  expression: TSM.CallExpression
): InjectableType | undefined => {
  const [tokenTypeTree, tokenType] = expression
    .getReturnType()
    .getTypeArguments()
  if (tokenTypeTree === undefined || tokenType === undefined) return

  // type is "Injectable<DependenciesTree, Value>"
  const nameSymbol = tokenTypeTree.getProperty('name')
  if (nameSymbol === undefined) return
  // DependenciesTree has "name" property

  const declaration = nameSymbol.getDeclarations()[0]
  if (!declaration) return
  // "name" property is a declaration, so we can get its resolved type

  const tokenName = nameSymbol.getTypeAtLocation(declaration).getText()

  return {
    name: tokenName,
    type: tokenType.getText(),
  }
}

const resolveNode = (node: TSM.Node): TSM.Node =>
  TSM.Node.isIdentifier(node) ? node.getDefinitionNodes()[0] ?? node : node

export function getRoots(map: GraphMap): readonly TSM.Node[] {
  const roots: TSM.Node[] = []
  for (const [reference, node] of map.entries()) {
    if (node.parents.length === 0) {
      roots.push(reference)
    }
  }
  return roots
}
