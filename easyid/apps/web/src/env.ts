/**
 * Typed access to environment variables.
 *
 * `NEXT_PUBLIC_*` vars are inlined by Next.js at build time. When one is
 * missing we fall back to a dev-friendly default rather than throwing — a
 * broken URL surfaces loudly the first time the SDK makes a request, which
 * is easier to diagnose than a hard build failure with no context.
 */

const DEFAULTS = {
  NEXT_PUBLIC_API_URL: "http://localhost:8000",
} as const;

function optional(name: keyof typeof DEFAULTS): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  return DEFAULTS[name];
}

export const env = {
  NEXT_PUBLIC_API_URL: optional("NEXT_PUBLIC_API_URL"),
} as const;
