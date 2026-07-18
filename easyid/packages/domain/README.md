# @easyid/domain

Framework-independent domain layer for the client tier. Holds entities, value
objects and pure functions that model easyID's business rules — nothing here may
depend on React, Next.js, the SDK, or any I/O library.

## Rules

- No `import "react"` — anywhere.
- No `import "next"` — anywhere.
- No fetching, no I/O — a domain function must be trivially unit-testable.
- Depend on `@easyid/types` for shared HTTP contract types.
- Do **not** depend on `@easyid/sdk` or `@easyid/ui`.

## Relationship with the API domain

The FastAPI service has its own domain layer under
`apps/api/src/easyid_api/domain/` following Clean Architecture. The two are
distinct — the client-side domain models what the browser needs to reason about,
while the server-side domain models the source of truth. Both must agree on the
shape of data they exchange (defined in `@easyid/types`).

## Contents

Currently empty by design. Business entities land in follow-up iterations
alongside their API counterparts.
