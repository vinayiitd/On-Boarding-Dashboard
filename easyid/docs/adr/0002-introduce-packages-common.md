# ADR-0002: Introduce `packages/common` for cross-cutting utilities

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** —
- **Superseded by:** —

> Note: references below to `@easyid/domain` as a TypeScript package
> describe the state at the time this ADR was written. That package was
> later removed and replaced by the Python package `easyid-domain` — see
> [ADR-0003](./0003-domain-is-a-python-package.md). The scoping rationale
> for `@easyid/common` is unchanged.

## Context

The bootstrap iteration ships four TypeScript packages with clearly-scoped
responsibilities: `@easyid/types` (HTTP wire contracts), `@easyid/domain`
(entities + rules — see ADR-0001), `@easyid/sdk` (HTTP client),
`@easyid/ui` (design system).

A predictable set of utilities does not fit any of those buckets:

- Runtime assertions (`assert`, `assertNever`).
- Type guards (`isDefined`, `isNonEmptyString`, …).
- Small pure helpers used by two or more of the above packages.

Without a home, these leak into whichever package needs them first —
usually `@easyid/domain` or `@easyid/sdk` — which forces the other
consumers to either duplicate the helper or take on an unwanted
dependency.

## Decision

We introduce a new workspace package,
[`packages/common`](../../packages/common) (`@easyid/common`), as the home
for framework-independent, zero-runtime-dependency utilities that are
useful across the monorepo but do not belong in a more specific package.

The package ships with a deliberately tiny initial surface — `assert`,
`assertNever`, `isDefined` — to establish the pattern without pre-emptively
inflating the API.

## Options considered

1. **Add utilities into `@easyid/types` or `@easyid/domain`.**
   - Pros: No new package.
   - Cons: Muddies the responsibility of the host package. `@easyid/types`
     becomes a mixed bag of types and behaviour; `@easyid/domain` picks up
     helpers unrelated to any business rule.
2. **Introduce `packages/common` (chosen).**
   - Pros: Clear home for cross-cutting concerns. Prevents accidental
     upward dependencies between the specific packages. Each specific
     package stays narrowly scoped.
   - Cons: One more package to maintain and one more `workspace:*` link
     for each consumer.
3. **Ship utilities per-app under `apps/*/src/lib/`.**
   - Pros: No shared package at all.
   - Cons: Duplicate implementations across web and any future service or
     app. Impossible to share via `@easyid/sdk` or `@easyid/domain`.

## Consequences

- **Positive:**
  - `@easyid/types`, `@easyid/domain`, `@easyid/sdk`, `@easyid/ui` stay
    narrowly scoped.
  - Contributors have an obvious answer for "where does this tiny helper
    go?".
  - Assertions and guards become a shared vocabulary rather than
    codebase-specific one-offs.
- **Negative / trade-offs:**
  - The package can become a dumping ground if we do not enforce the
    scoping rules in its README. Reviewers must push back on additions
    that belong in a more specific package.
  - Zero-dependency constraint may occasionally push us to keep a helper
    slightly less ergonomic than it could be with a library.
- **Follow-ups:**
  - Add a lint rule (or `dependency-cruiser` graph check) forbidding
    `@easyid/common` from importing any other `@easyid/*` package, to lock
    in its position at the bottom of the dependency graph.
  - Revisit scope after the first three features ship — split into
    `@easyid/asserts`, `@easyid/guards`, etc. if the surface grows past
    ~two dozen exports.
- **Reversibility:**
  - Cheap to reverse — inline the helpers into consumers and drop the
    package. Cost grows linearly with the number of exports.

## References

- [`packages/common/README.md`](../../packages/common/README.md)
- [ADR-0001](./0001-consolidate-domain-into-packages-domain.md) — set the
  precedent for narrow, single-purpose packages.
