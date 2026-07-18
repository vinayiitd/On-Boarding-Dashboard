# @easyid/config

Shared configuration for TypeScript and ESLint used by every package in the
monorepo. Prettier configuration lives at the repository root
(`.prettierrc.json`) because Prettier does not currently support workspace
extension.

## Contents

- `tsconfig/base.json` — base TS config, extends the repo-root
  `tsconfig.base.json`. Enables the strict flag family and modern module
  resolution.
- `tsconfig/nextjs.json` — for `apps/web`. Adds the Next.js plugin and DOM libs.
- `tsconfig/react-library.json` — for React libraries in `packages/` (currently
  `@easyid/ui`).
- `eslint/base.mjs` — TypeScript + Prettier-compatible flat config.
- `eslint/react.mjs` — adds React and React Hooks rules.
- `eslint/nextjs.mjs` — layers `eslint-config-next` on top of the React config.

## Usage

TypeScript:

```jsonc
// package's tsconfig.json
{
  "extends": "@easyid/config/tsconfig/react-library.json",
  "include": ["src/**/*"],
  "exclude": ["dist"],
}
```

ESLint (flat config):

```js
// package's eslint.config.mjs
import config from "@easyid/config/eslint/react";
export default config;
```
