import {
  FunctionDeclaration,
  Project,
  SourceFile,
  VariableDeclaration,
} from 'ts-morph'
import { last } from '../shared/utils/array'

export interface InjectableTsReact {
  readonly useInjectable: FunctionDeclaration | VariableDeclaration
  readonly DependenciesProvider: FunctionDeclaration | VariableDeclaration
}

export function getInjectableReact(
  project: Project,
  pathToInjectableReact?: string
): InjectableTsReact {
  const react = findInjectableTSReactSourceFile(project)
  if (!react) throw new Error('Cannot find "@injectable-ts/react" module')

  const exports = react.getExportedDeclarations()

  const useInjectable = last(exports.get('useInjectable'))
  if (
    !(
      useInjectable instanceof FunctionDeclaration ||
      useInjectable instanceof VariableDeclaration
    )
  ) {
    throw new TypeError(
      `Cannot read "useInjectable" from "${react.getFilePath()}"`
    )
  }

  const DependenciesProvider = last(exports.get('DependenciesProvider'))
  if (
    !(
      DependenciesProvider instanceof FunctionDeclaration ||
      DependenciesProvider instanceof VariableDeclaration
    )
  ) {
    throw new TypeError(
      `Cannot read "DependenciesProvider" from "${react.getFilePath()}"`
    )
  }

  return {
    useInjectable,
    DependenciesProvider,
  }
}

function findInjectableTSReactSourceFile(
  project: Project
): SourceFile | undefined {
  for (const source of project.getSourceFiles()) {
    const importDeclaration = source.getImportDeclaration(
      '@injectable-ts/react'
    )
    if (importDeclaration) {
      return importDeclaration.getModuleSpecifierSourceFile()
    }
  }
}
