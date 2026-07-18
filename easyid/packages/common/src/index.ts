/**
 * @easyid/common
 *
 * Cross-cutting utilities shared across the easyID monorepo. Framework
 * independent, zero runtime dependencies. See
 * docs/adr/0002-introduce-packages-common.md for the scoping rules.
 */

/**
 * Runtime assertion. Narrows the type of `condition` to `true` for the
 * TypeScript compiler and throws an `Error` with `message` at runtime
 * when the condition is falsy.
 *
 * Prefer this over ad-hoc `if (!x) throw new Error(...)` — it makes the
 * assumption explicit and gets picked up by control-flow narrowing.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Exhaustiveness helper for `switch` statements over discriminated unions.
 * If the compiler ever routes a value here, the union grew a new variant
 * that the switch does not handle.
 *
 * @example
 * ```ts
 * switch (event.type) {
 *   case "created":  return handleCreated(event);
 *   case "updated":  return handleUpdated(event);
 *   default:         return assertNever(event);
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

/**
 * Type guard for "not null and not undefined". Handy in `.filter()` chains
 * so the resulting array type drops the nullish members.
 *
 * @example
 * ```ts
 * const emails = users.map((u) => u.email).filter(isDefined);
 * //    ^? string[]
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
