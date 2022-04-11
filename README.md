# INJECTABLE-TS

Purely-functional strictly-typed IoC/DI for TypeScript.

## Overview

This project aims at providing lightweight inversion of control (IoC) and dependency injection (DI) tooling for large JavaScript/TypeScript applications.

## Motivation

While concepts of IoC and DI are not new and there are multiple implementations of them available for JavaScript and TypeScript,
most of them are built around the concept of a single container with all registered dependencies (or multiple containers).

While such approach might work for some projects, it still introduces tight coupling in the code.
We have to either manually register all dependencies in such container (which can be quite tedious),
or delegate it to a framework which will register them automatically on a single _global_ container which makes the code not portable.

While the issues above might seem synthetic, there's still another major downside of such approach -
there is no way to _statically_ check whether all required dependencies are actually registered on the container.
If any of requested dependencies is missing, container throws in runtime which makes the code impure and indeterminate.

So, the goals of this project are to:

- provide a purely-functional solution for automatic IoC/DI
- provide compile-time guarantees that all required dependencies are always available for the caller.

## Structure

The project is split into several packages, and you can find documentation for them in the corresponding readme files.

- [@injectable-ts/core](./packages/core/README.md) - the main package containing building blocks for the IoC/DI
- [@injectable-ts/react](./packages/react/README.md) - bindings for React for better integration with the core
- more coming soon

## Development

The project is entirely written in [TypeScript](https://www.typescriptlang.org/) and composed with [nx](https://nx.dev/).
