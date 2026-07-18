# ADR-0001: Consolidate the domain layer into `packages/domain`

- **Status:** Accepted (language / consumer model superseded by
  [ADR-0003](./0003-domain-is-a-python-package.md))
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** —
- **Superseded by:** ADR-0003 (for the "TypeScript shared across web +
  API" framing only — the consolidation into `packages/domain` still
  stands)

## Context

The bootstrap iteration shipped two nominally separate domain layers:

- `apps/api/src/easyid_api/domain/` — a Python module intended to hold
  server-side entities and pure rules, per Clean Architecture.
- `packages/domain/` (`@easyid/domain`) — a TypeScript package intended
  to hold client-side entities and pure rules for the web tier.

Both were intentionally empty in the initial iteration — no business
entities had been modelled yet — but the split baked a permanent
assumption into the structure: that server-side and client-side domain
models would evolve independently and only meet at the HTTP wire.

That assumption is expensive in practice. It means:

- Every entity has to be redefined in two languages.
- Business invariants have to be enforced (and re-enforced) in two places.
- Refactors touch two layers instead of one.
- Contributors have to pick where each rule "really" lives, and reviewers
  have to enforce the split.

Because neither module has real content yet, this is the cheapest possible
moment to collapse the split.

## Decision

We consolidate the domain layer into a single package,
[`packages/domain`](../../packages/domain) (`@easyid/domain`), which is the
one source of truth for entities and pure business rules across the entire
monorepo. The API-local `apps/api/src/easyid_api/domain/` folder is
removed.

The API keeps three local layers — `api/`, `application/`, `infrastructure/`
— plus mirrored Pydantic wire models under `api/v1/`. Anything that would
have gone into the API's `domain/` now goes into `@easyid/domain`, with the
API consuming it through the HTTP contract in `@easyid/types` (mirrored
server-side as Pydantic models).

## Options considered

1. **Keep both domain layers separate (status quo).**
   - Pros: Textbook Clean Architecture on the API. No cross-language
     coupling.
   - Cons: Duplicate modelling forever. Invariants drift. Contributors have
     to decide on every entity whether it is "server-only", "client-only",
     or "shared", and the answer is almost always "shared".
2. **Consolidate into `packages/domain` (chosen).**
   - Pros: One source of truth. One place to enforce invariants. Refactors
     touch one layer. Zero risk of drift between the two "domains" that
     are actually the same domain.
   - Cons: Adds a cross-language coupling — the API must mirror shapes in
     Pydantic at the HTTP boundary. This is a coupling we already had via
     `@easyid/types`; consolidating the domain formalises it.
3. **Consolidate into the API, generate TS types from the OpenAPI spec.**
   - Pros: The service that owns persistence also owns the model. Web
     consumes generated types.
   - Cons: Business rules become invisible to the web tier — they only
     appear as validated shapes. Client-side logic that needs to reason
     about domain invariants (e.g., "is this document expired?") has to
     re-implement them anyway.

## Consequences

- **Positive:**
  - Single, canonical modelling location for business rules.
  - New contributors have one obvious answer to "where does this entity
    live?".
  - Refactors and reviews stay lightweight.
- **Negative / trade-offs:**
  - The API must mirror domain shapes as Pydantic at the HTTP boundary
    (`api/v1/*.py`). This is enforced by code review, not tooling, until
    an OpenAPI-driven generation step is added.
  - Contributors accustomed to a Python `domain/` folder on the API side
    have to unlearn the pattern.
- **Follow-ups:**
  - When the first real entity lands, add a lightweight lint / import-linter
    rule that forbids business rules living inside `apps/api/`.
  - Consider generating Pydantic mirrors from `@easyid/types` in a future
    iteration to eliminate manual drift risk.
- **Reversibility:**
  - Trivially reversible while `@easyid/domain` is empty. Cost grows with
    every entity added — reintroducing the split later would require
    duplicating each entity and choosing which module owns the invariants.

## References

- [`packages/domain/README.md`](../../packages/domain/README.md)
- [`apps/api/README.md`](../../apps/api/README.md)
- [`docs/architecture.md`](../architecture.md)
