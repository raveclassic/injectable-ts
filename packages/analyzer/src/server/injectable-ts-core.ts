import {
  FunctionDeclaration,
  Project,
  SourceFile,
  VariableDeclaration,
} from 'ts-morph'
import { last } from '../shared/utils/array'

export interface InjectableCore {
  readonly token: FunctionDeclaration | VariableDeclaration
  readonly injectable: FunctionDeclaration | VariableDeclaration
  readonly provide: FunctionDeclaration | VariableDeclaration
}

export function getInjectableCore(
  project: Project,
  pathToInjectableCore?: string
): InjectableCore {
  const core =
    pathToInjectableCore !== undefined
      ? project.getSourceFile(pathToInjectableCore)
      : findInjectableTSCoreSourceFile(project)
  if (!core) throw new Error(`Cannot find "@injectable-ts/core" module`)

  const exports = core.getExportedDeclarations()

  const token = last(exports.get('token'))
  if (
    !(
      token instanceof FunctionDeclaration ||
      token instanceof VariableDeclaration
    )
  ) {
    throw new TypeError(`Cannot read "token" from "${core.getFilePath()}"`)
  }

  const provide = last(exports.get('provide'))
  if (
    !(
      provide instanceof FunctionDeclaration ||
      provide instanceof VariableDeclaration
    )
  ) {
    throw new TypeError(`Cannot read "provide" from "${core.getFilePath()}"`)
  }

  const injectable = last(exports.get('injectable'))
  if (
    !(
      injectable instanceof FunctionDeclaration ||
      injectable instanceof VariableDeclaration
    )
  ) {
    throw new TypeError(`Cannot read "injectable" from "${core.getFilePath()}"`)
  }

  return {
    token,
    provide,
    injectable,
  }
}

function findInjectableTSCoreSourceFile(
  project: Project
): SourceFile | undefined {
  for (const source of project.getSourceFiles()) {
    const importDeclaration = source.getImportDeclaration('@injectable-ts/core')
    if (importDeclaration) {
      return importDeclaration.getModuleSpecifierSourceFile()
    }
  }
}
