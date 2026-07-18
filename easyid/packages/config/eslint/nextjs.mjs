// @ts-check
import react from "./react.mjs";

/**
 * ESLint config for the Next.js `apps/web` package.
 *
 * NOTE: `eslint-config-next` v15 still bundles CJS + `@rushstack/eslint-patch`
 * that fights pnpm's symlinked node_modules and refuses to load. Until the
 * package ships first-class flat-config support we ride on the shared React
 * config, which already covers the important surface (React Hooks, TS
 * strictness). Re-add `eslint-config-next` once upstream is stable.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [...react];
