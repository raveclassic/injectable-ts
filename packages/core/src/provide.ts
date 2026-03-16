import { Flatten, Injectable } from './injectable'

/**
 * Simplified tree after omitting dependencies.
 * Instead of recursively walking the tree to remove nodes,
 * we just store the new flatDeps directly via Omit — O(1) instead of O(tree depth).
 */
interface OmittedTree<OriginalTree, Keys> {
  readonly flatDeps: Omit<
    OriginalTree extends { readonly flatDeps: infer F } ? F : never,
    Keys & PropertyKey
  >
}

interface ProvideFn {
  <Dependencies, Value>(
    input: Injectable<Dependencies, Value>
  ): <Keys extends keyof Flatten<Dependencies>>() => Injectable<
    OmittedTree<Dependencies, Keys>,
    (innerDependencies: {
      readonly [Key in keyof Flatten<Dependencies> as Key extends Keys
        ? Key
        : never]: Flatten<Dependencies>[Key]
    }) => Value
  >
}
export const provide: ProvideFn = /* @__NO_SIDE_EFFECTS__ */
  (input) => () => (outerDependencies) => (innerDependencies) =>
    // eslint-disable-next-line no-restricted-syntax
    input({ ...outerDependencies, ...innerDependencies } as never)
