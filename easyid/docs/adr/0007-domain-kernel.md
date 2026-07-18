# ADR-0007: Domain kernel primitives in `easyid_domain`

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** —
- **Superseded by:** —
- **Related:** [ADR-0003](./0003-domain-is-a-python-package.md)

## Context

FND-002/003 established the API bootstrap and persistence adapters. Before
the first business bounded context lands, the domain package needs a small
set of DDD building blocks so every aggregate speaks the same language for
identity, events, results, and time.

## Decision

Ship a **domain kernel** under `easyid_domain.kernel` (re-exported from
`easyid_domain`) containing only abstractions:

| Primitive | Role |
| --------- | ---- |
| `Entity` | Identity-based equality |
| `AggregateRoot` | Consistency boundary + pending `DomainEvent`s |
| `ValueObject` | Frozen, value-based equality + `_validate()` |
| `DomainEvent` | Immutable fact (`kw_only`, metadata fields) |
| `Result` / `Ok` / `Err` | Expected success/failure without exceptions |
| `DomainError` hierarchy | Domain invariants (`validation` / `conflict` / `invariant_violation`). Lookup misses are application-layer (`EntityNotFound`), not kernel errors. |
| `Specification` | Composable predicates (`&` / `|` / `~`) |
| `Clock` / `SystemClock` / `FixedClock` | Testable time |
| `Identifier` / `new_id` / `parse_id` | UUID identity seam (UUIDv7-ready) |

Constraints: pure Python 3.13, zero runtime deps, no SQLAlchemy / FastAPI /
Pydantic / I/O. No business concepts in this foundation.

## Options considered

1. **Copy-paste bases per bounded context.**
   - Pros: No shared package surface.
   - Cons: Divergent equality/event semantics; harder reviews.
2. **Pull in an external DDD library.**
   - Pros: Batteries included.
   - Cons: Dependency in the innermost layer; harder to keep pure.
3. **Small in-house kernel (chosen).**
   - Pros: Explicit, typed, owned; matches ADR-0003 purity rules.
   - Cons: We maintain it.

## Consequences

- **Positive:** Future entities subclass a known base; application code can
  rely on `Result` and `collect_events()` conventions.
- **Negative / trade-offs:** Kernel API is public — changes need care.
- **Follow-ups:** First business aggregate; optional UUIDv7 switch in
  `new_id()`.
- **Reversibility:** High while no business types depend on it; drops as
  aggregates appear.

## References

- [`packages/domain/src/easyid_domain/kernel/`](../../packages/domain/src/easyid_domain/kernel/)
- [`packages/domain/README.md`](../../packages/domain/README.md)
