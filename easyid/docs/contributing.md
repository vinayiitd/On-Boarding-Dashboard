# Contributing

Short version: work on a branch, keep PRs small, respect the layer boundaries,
ship green CI.

## Rules that CI enforces

- ESLint passes at zero warnings on TypeScript.
- `tsc --noEmit` passes on every workspace.
- Prettier's formatting matches the config.
- Ruff (lint + format) passes on the API.
- mypy passes on the API.
- Pytest passes on the API against a Postgres 17 service.
- Docker Compose builds without warnings.

## Rules that reviewers enforce

- **No upward imports across Clean Architecture layers.** See
  [architecture.md](./architecture.md).
- **New API endpoint = new SDK method + `@easyid/types` shape.** The frontend
  must never talk to the backend via a raw `fetch`.
- **Public functions carry docstrings / TSDoc.** Private helpers don't need
  them.
- **Feature flags for anything half-shipped.** No behind-the-scenes toggles
  buried in `if (process.env.…)`.

## Local pre-commit

Husky runs `lint-staged` on `git commit` — Prettier formats staged files
automatically. If Husky isn't installed (fresh clone), run:

```bash
pnpm install
```

Husky is set up as part of the `postinstall` hook.
