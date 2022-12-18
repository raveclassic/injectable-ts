import { Project } from 'ts-morph'

export const newProject = (tsConfigFilePath: string): Project =>
  new Project({ tsConfigFilePath })
