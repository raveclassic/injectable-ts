import { Flatten, Injectable, UnknownDependencyTree } from './injectable'

type RunOmitInChildren<
  Children extends readonly UnknownDependencyTree[],
  Keys
> = {
  readonly [Index in keyof Children]: RunOmitDependencies<Children[Index], Keys>
}

type RunOmitDependencies<Tree, Keys> = Tree extends UnknownDependencyTree
  ? Tree['name'] extends Keys
    ? never
    : {
        readonly type: Tree['type']
        readonly name: Tree['name']
        readonly optional: Tree['optional']
        readonly children: RunOmitInChildren<Tree['children'], Keys>
      }
  : never

export declare function provide<
  Dependencies extends UnknownDependencyTree,
  Value
>(
  input: Injectable<Dependencies, Value>
): <Keys extends keyof Flatten<Dependencies>>() => Injectable<
  {
    readonly [Key in keyof RunOmitDependencies<
      Dependencies,
      Keys
    >]: RunOmitDependencies<Dependencies, Keys>[Key]
  },
  (innerDependencies: {
    readonly [Key in keyof Flatten<Dependencies> as Key extends Keys
      ? Key
      : never]: Flatten<Dependencies>[Key]
  }) => Value
>
