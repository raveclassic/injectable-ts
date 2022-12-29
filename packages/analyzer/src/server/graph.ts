import { Project, Node, ts, CallExpression } from 'ts-morph'
import { InjectableCore } from './injectable-ts-core'
import {
  NormalizedGraph,
  NormalizedGraphNode,
} from '../shared/domain/entities/normalized-graph-node/normalized-graph-node'

interface IDMap extends Map<Node<ts.Node>, string> {}

let idCounter = 0
function getNextId(): string {
  return `${idCounter++}`
}

function visitTokenNode(
  node: Node<ts.Node>,
  graph: NormalizedGraph,
  ids: IDMap
): NormalizedGraphNode | undefined {
  const parent = node.getParent()

  if (!Node.isCallExpression(parent)) return
  // "token('name')" or "token('name')<type>()"

  const grandParent = parent.getParent()
  if (!Node.isCallExpression(grandParent)) return
  // "token('name')<type>()"

  const grandParentDeclaration = grandParent.getParent()
  if (!Node.isVariableDeclaration(grandParentDeclaration)) return
  // "variable = token('name')<Type>()"

  const [tokenTypeTree, tokenType] = grandParent
    .getReturnType()
    .getTypeArguments()
  if (tokenTypeTree === undefined || tokenType === undefined) return

  // return type is a form of "Injectable<Tree, Type>"
  const nameSymbol = tokenTypeTree.getProperty('name')
  if (nameSymbol === undefined) return
  // TokenTypeTree has "name" property

  const valueDeclaration = nameSymbol.getValueDeclaration()
  if (!valueDeclaration) return
  // "name" property is a declaration, so we can get its resolved type

  const tokenName = nameSymbol.getTypeAtLocation(valueDeclaration).getText()

  const identifier = grandParentDeclaration

  const graphNode: NormalizedGraphNode = {
    kind: 'token',
    id: getNextId(),
    name: tokenName,
    file: node.getSourceFile().getFilePath(),
    type: tokenType.getText(),
    identifier: identifier.getNameNode().getText(),
  }

  ids.set(identifier, graphNode.id)
  graph[graphNode.id] = graphNode

  return graphNode
}

function visitTokens(
  project: Project,
  core: InjectableCore,
  graph: NormalizedGraph,
  ids: IDMap
): void {
  for (const node of core.token.findReferencesAsNodes()) {
    visitTokenNode(node, graph, ids)
  }
}

function visitInjectable(
  node: Node<ts.Node>,
  graph: NormalizedGraph,
  ids: IDMap
): NormalizedGraphNode | undefined {
  const parent = node.getParent()

  if (!Node.isCallExpression(parent)) return
  // "injectable(...dependencies, f)" or "injectable(name, ...dependencies, f)"

  const grandParentDeclaration = parent.getParent()
  if (!Node.isVariableDeclaration(grandParentDeclaration)) return
  // "variable = injectable(...dependencies, f)"
  // or
  // "variable = injectable(name, ...dependencies, f)"

  const identifier = grandParentDeclaration

  // node has already been visited
  if (ids.has(identifier)) return

  const [name, dependencies] = getInjectableArguments(parent)

  const graphNode: NormalizedGraphNode = {
    kind: 'injectable',
    name,
    id: getNextId(),
    file: parent.getSourceFile().getFilePath(),
    // type: 'WUT',
    identifier: identifier.getNameNode().getText(),
    dependencyIds: [],
  }

  for (const dependency of dependencies) {
    if (Node.isIdentifier(dependency)) {
      for (const definition of dependency.getDefinitionNodes()) {
        const id = ids.get(definition)
        if (id !== undefined) {
          // already processed, most likely a token
          // add to dependencies
          graphNode.dependencyIds.push(id)
        }
      }
    }
  }

  ids.set(identifier, graphNode.id)
  graph[graphNode.id] = graphNode

  return graphNode
}

const visitInjectables = (
  project: Project,
  core: InjectableCore,
  graph: NormalizedGraph,
  ids: IDMap
): void => {
  for (const node of core.injectable.findReferencesAsNodes()) {
    visitInjectable(node, graph, ids)
  }
}

function getInjectableArguments(
  injectable: CallExpression<ts.CallExpression>
): [name: string | undefined, dependencies: readonly Node<ts.Node>[]] {
  const nodeArguments = injectable.getArguments()
  // remove projection function from arguments first
  const injectableDependencies = nodeArguments.slice(
    0,
    nodeArguments.length - 1
  )
  if (injectableDependencies.length === 0) return [undefined, []]

  const [nameOrDependency, ...dependencies] = injectableDependencies
  const nameOrDependencyType = nameOrDependency.getType()
  if (nameOrDependencyType.isStringLiteral()) {
    return [nameOrDependencyType.getText(), dependencies]
  }

  return [undefined, injectableDependencies]
}

export function buildGraph(
  project: Project,
  core: InjectableCore
): NormalizedGraph {
  const ids = new Map<Node<ts.Node>, string>()

  const graph: NormalizedGraph = {}

  visitTokens(project, core, graph, ids)
  visitInjectables(project, core, graph, ids)

  return graph
}
