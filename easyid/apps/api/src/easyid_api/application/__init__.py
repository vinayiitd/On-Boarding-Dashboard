"""
Application layer.

Use cases and orchestration live here, split CQRS-lite style:

- `commands/` — writes (create / update / delete / transitions)
- `queries/`  — reads (list / get / search / projections)
- `ports.py`  — abstract interfaces the application needs from the outside

Rules:

- Every tenant-scoped handler takes a `TenantContext` as an explicit
  argument. The API resolves it once in `api/deps.py`; handlers never
  re-resolve or trust a raw client-supplied tenant id.
- This layer depends on the shared domain package (`easyid_domain` in
  `packages/domain`) and on ports; it never imports from
  `infrastructure/` or `api/` directly.
"""
