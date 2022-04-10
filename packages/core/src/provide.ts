import { Flatten, Injectable, UnknownDependencyTree } from './injectable'

type OmitInChildren<Children extends readonly UnknownDependencyTree[], Keys> = {
  readonly [Index in keyof Children]: OmitDependencies<Children[Index], Keys>
}

type Step<Tree extends UnknownDependencyTree, Keys> = {
  readonly type: Tree['type']
  readonly name: Tree['name']
  readonly optional: Tree['optional']
  readonly children: OmitInChildren<Tree['children'], Keys>
}

type OmitDependencies<Tree, Keys> = Tree extends UnknownDependencyTree
  ? Tree['name'] extends never
    ? Step<Tree, Keys>
    : Tree['name'] extends Keys
    ? never
    : Step<Tree, Keys>
  : never

export function provide<Dependencies extends UnknownDependencyTree, Value>(
  input: Injectable<Dependencies, Value>
) {
  return <Keys extends keyof Flatten<Dependencies>>(): Injectable<
      {
        readonly [Key in keyof OmitDependencies<
          Dependencies,
          Keys
        >]: OmitDependencies<Dependencies, Keys>[Key]
      },
      (innerDependencies: {
        readonly [Key in keyof Flatten<Dependencies> as Key extends Keys
          ? Key
          : never]: Flatten<Dependencies>[Key]
      }) => Value
    > =>
    (outerDependencies) =>
    (innerDependencies) =>
      // eslint-disable-next-line no-restricted-syntax
      input({ ...outerDependencies, ...innerDependencies } as never)
}
