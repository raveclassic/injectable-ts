import * as TSM from 'ts-morph'
import { FunctionDeclaration, Project } from 'ts-morph'

export interface InjectableCore {
  readonly token: FunctionDeclaration
  readonly injectable: FunctionDeclaration
  readonly provide: FunctionDeclaration
  readonly Injectable: TSM.Symbol
}

const last = <T>(input: readonly T[] | undefined): T | undefined =>
  input ? input[input.length - 1] : undefined

export const getInjectableCore = (
  project: Project,
  pathToInjectableCore: string
): InjectableCore => {
  const core = project.getSourceFile(pathToInjectableCore)
  if (!core) throw new Error(`Cannot read "${pathToInjectableCore}"`)

  const exports = core.getExportedDeclarations()

  const token = last(exports.get('token'))
  if (!TSM.Node.isFunctionDeclaration(token)) {
    throw new Error(`Cannot read "token" from "${pathToInjectableCore}"`)
  }

  const provide = last(exports.get('provide'))
  if (!TSM.Node.isFunctionDeclaration(provide)) {
    throw new Error(`Cannot read "provide" from "${pathToInjectableCore}"`)
  }

  const injectable = last(exports.get('injectable'))
  if (!TSM.Node.isFunctionDeclaration(injectable)) {
    throw new Error(`Cannot read "injectable" from "${pathToInjectableCore}"`)
  }

  const InjectableExport = last(exports.get('Injectable'))
  if (!TSM.Node.isInterfaceDeclaration(InjectableExport)) {
    throw new Error(`Cannot read "Injectable" from "${pathToInjectableCore}"`)
  }
  const Injectable = InjectableExport.getSymbolOrThrow()

  return {
    token,
    provide,
    injectable,
    Injectable,
  }
}
