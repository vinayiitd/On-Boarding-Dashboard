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
├── pyproject.toml          # hatchling + ruff + mypy + pytest
├── src/easyid_domain/      # the importable package
│   └── __init__.py
└── tests/
```

## Local setup

```bash
# From packages/domain/
uv sync --dev
uv run pytest
uv run ruff check .
uv run mypy
```

The API pulls this package in as an editable path dependency
(`easyid-domain = { path = "../../packages/domain", editable = true }`),
so a normal `uv sync` from `apps/api/` also installs it.

## Contents

Currently empty by design. Business entities land in follow-up iterations
alongside their HTTP contracts in `@easyid/types` and the matching Pydantic
models under `apps/api/src/easyid_api/api/v1/`.
