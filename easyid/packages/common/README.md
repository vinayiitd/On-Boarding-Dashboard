# @easyid/common

Cross-cutting utilities shared across the easyID monorepo — the stuff that
doesn't belong in `@easyid/types`, `@easyid/domain`, `@easyid/sdk`, or
`@easyid/ui`.

## What lives here

- **Assertions and guards** — `assert`, `assertNever`, `isDefined`.
- **Small pure helpers** — anything universally useful, framework-agnostic,
  and zero-dependency.

## What does NOT live here

- **Domain entities and rules** → `@easyid/domain`.
- **HTTP wire contracts** → `@easyid/types`.
- **HTTP client code** → `@easyid/sdk`.
- **React / UI components** → `@easyid/ui`.
- **Environment access** → the consuming app's `env.ts`.

If you find yourself adding a dependency to a heavy library here, it
probably belongs in a more specific package.

## Rules

- **Framework-independent.** No React, no Next.js, no Node-only APIs.
- **Zero runtime dependencies.** Only `@easyid/config`, `eslint` and
  `typescript` at dev time.
- **Every export documented with TSDoc.** This package is a shared vocabulary
  — misuse compounds across the codebase.

## Rationale

See
[`docs/adr/0002-introduce-packages-common.md`](../../docs/adr/0002-introduce-packages-common.md)
for why this package exists and what it explicitly is not.
