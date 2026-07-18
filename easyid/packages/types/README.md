# @easyid/types

Shared TypeScript types for the easyID monorepo. Framework-agnostic (no React,
no Node-only APIs) so both the web app and the SDK can depend on it.

## What lives here

- HTTP contract types shared between web and api (e.g. `HealthStatus`,
  `ApiError`)
- Small, reusable primitives (`Result<T, E>`, `Brand<T, B>`, `IsoDateString`)

## What does **not** live here

- Business rules or entity behaviour — those go in the Python package
  `packages/domain` (`easyid_domain`)
- UI-facing types — those go with the component that owns them
- Fetching / caching logic — those go in `@easyid/sdk`

## Usage

```ts
import type { HealthStatus, Result } from "@easyid/types";
import { ok, err } from "@easyid/types";
```
