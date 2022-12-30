export const last = <T>(input: readonly T[] | undefined): T | undefined =>
  input ? input[input.length - 1] : undefined
