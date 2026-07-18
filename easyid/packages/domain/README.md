# @easyid/domain

The **shared domain layer** for the entire easyID monorepo. Entities, value
objects and pure functions that model easyID's business rules live here and
nowhere else — the web app and the API both depend on this package for their
canonical view of the business.

## Rules

- **Framework-independent.** No `import "react"`, no `import "next"`, no
  Node-only APIs, no I/O of any kind. Every function must be trivially
  unit-testable.
- **No SDK, no UI.** Do not depend on `@easyid/sdk` or `@easyid/ui`. The
  domain does not know how it is served or displayed.
- **Wire types live elsewhere.** HTTP request/response shapes belong in
  `@easyid/types`. Domain entities are richer than wire types (behaviour +
  invariants) and may look different.
- **Consumed cross-language.** The FastAPI service mirrors these entities as
  Pydantic models at the HTTP boundary; keep entity shapes stable and
  well-documented so both sides can stay in sync.

## Where this used to live

Before this iteration, the API kept its own `apps/api/src/easyid_api/domain/`
folder. It was consolidated here so the platform has a single source of
truth for business rules. See
[`docs/adr/0001-consolidate-domain-into-packages-domain.md`](../../docs/adr/0001-consolidate-domain-into-packages-domain.md).

## Contents

Currently empty by design. Business entities land in follow-up iterations
alongside their HTTP contracts in `@easyid/types`.
