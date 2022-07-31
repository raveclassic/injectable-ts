---
title: core/src/token.ts
nav_order: 1
parent: Modules
---

## token overview

Added in v1.0.0-alpha.2

---

<h2 class="text-delta">Table of contents</h2>

- [core](#core)
  - [token](#token)
- [utils](#utils)
  - [TOKEN_ACCESSOR_KEY](#token_accessor_key)
  - [TokenAccessor (interface)](#tokenaccessor-interface)

---

# core

## token

Token

Some information here

**Signature**

```ts
export declare function token<Name extends PropertyKey>(name: Name)
```

**Example**

```ts
console.log(1)
```

Added in v1.0.0-alpha.2

# utils

## TOKEN_ACCESSOR_KEY

**Signature**

```ts
export declare const TOKEN_ACCESSOR_KEY: '@injectable-ts/core//TOKEN_ACCESSOR'
```

Added in v1.0.0-alpha.2

## TokenAccessor (interface)

**Signature**

```ts
export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name]
}
```

Added in v1.0.0-alpha.2
