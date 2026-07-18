# easyid-domain

The **domain layer** for the easyID platform — a pure Python package.

Entities, value objects and pure business rules live here and nowhere else.
The FastAPI service (`apps/api`) is the sole runtime consumer. The web app
never imports this package; it consumes the domain only through the HTTP
wire contract in `@easyid/types`.

## Why Python

The business domain executes on the backend. The API is Python. Putting the
domain in TypeScript would force every invariant to be reimplemented (or
worse, skipped) on the server. See
[`docs/adr/0003-domain-is-a-python-package.md`](../../docs/adr/0003-domain-is-a-python-package.md).

## Rules

- **Framework-independent.** No FastAPI, no SQLAlchemy, no I/O of any kind.
  Every function must be trivially unit-testable.
- **No Pydantic for entity modelling.** Pydantic models belong at the HTTP
  boundary in `apps/api` (and are mirrored for the web in `@easyid/types`).
- **Zero runtime dependencies.** Keep it that way. If a helper needs a
  third-party library, it probably belongs in the application or
  infrastructure layer of the API — not here.
- **Consumed only by `apps/api`.** The web tier does not depend on this
  package. Do not add TypeScript bindings.

## Layout

```
packages/domain/
├── pyproject.toml
├── src/easyid_domain/
│   ├── __init__.py          # re-exports kernel
│   └── kernel/              # FND-004 domain primitives (no business concepts)
│       ├── entity.py
│       ├── aggregate.py
│       ├── value_object.py
│       ├── domain_event.py
│       ├── result.py
│       ├── errors.py
│       ├── specification.py
│       ├── clock.py
│       └── identity.py
└── tests/
```

## Kernel (FND-004)

| Symbol | Notes |
| ------ | ----- |
| `Entity` | ABC; identity-based `==` / `hash`; immutable `id` |
| `AggregateRoot` | Pending domain events (`raise_event` / `collect_events`) |
| `ValueObject` | Frozen, value-based equality; `_validate()` hook |
| `DomainEvent` | Immutable; `kw_only` metadata (`event_id`, `occurred_at`) |
| `Result` / `ok` / `err` | Expected success/failure without exceptions |
| `DomainError` | Base; subclasses: `InvariantViolation`, `BusinessRuleViolation`, `InvalidValue` |
| | Context-specific rules (e.g. `DuplicateAbn`) subclass `BusinessRuleViolation` next to aggregates |
| `Specification` | Composable with `&` / `|` / `~` |
| `Clock` / `SystemClock` / `FixedClock` | Testable time |
| `Identifier` / `new_id` / `parse_id` | UUID seam (ready for UUIDv7) |

See [`docs/adr/0007-domain-kernel.md`](../../docs/adr/0007-domain-kernel.md).

## Local setup

```bash
# From packages/domain/
uv sync --dev
uv run pytest
uv run ruff check .
uv run mypy
```

The API pulls this package in as a path dependency
(`easyid-domain = { path = "../../packages/domain" }`), so a normal
`uv sync` from `apps/api/` also installs it.

## Contents

The kernel is in place. Business entities land in follow-up iterations
alongside their HTTP contracts in `@easyid/types` and the matching Pydantic
models under `apps/api/src/easyid_api/api/v1/`.
