/**
 * @easyid/domain
 *
 * The shared domain layer for the entire easyID monorepo. Entities, value
 * objects, and pure functions that model easyID's business rules live here
 * and nowhere else — both the web app and the API depend on this package
 * for their canonical view of the business.
 *
 * Rules:
 *  - Framework-independent. No React, no Next.js, no Node-only APIs, no I/O.
 *  - No dependency on `@easyid/sdk` or `@easyid/ui`.
 *  - HTTP wire types belong in `@easyid/types`; the API mirrors entities as
 *    Pydantic models at the HTTP boundary.
 *
 * See docs/adr/0001-consolidate-domain-into-packages-domain.md for the
 * rationale behind consolidating the domain here.
 *
 * ⚠️  This package is intentionally empty. Business entities will land in
 * follow-up iterations alongside their contracts in `@easyid/types`.
 */

export {};
