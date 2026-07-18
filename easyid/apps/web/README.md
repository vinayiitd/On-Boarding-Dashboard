# apps/web

Next.js 15 + React 19 web app for easyID.

## Stack

- **Next.js 15** App Router, `output: "standalone"`
- **React 19**, TypeScript strict
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.ts`)
- **shadcn/ui-style primitives** consumed from `@easyid/ui`
- **TanStack Query** for server-state
- **React Hook Form** + **Zod** for forms
- **Vitest** + Testing Library for unit tests
- **Playwright** for E2E tests

## Local setup

```bash
# From the workspace root
pnpm install
pnpm --filter @easyid/web dev
```

The app expects an API at `NEXT_PUBLIC_API_URL` (default
`http://localhost:8000`). Start it with:

```bash
cd ../api
uv run uvicorn easyid_api.main:app --reload
```

## Commands

```bash
pnpm dev              # http://localhost:3000
pnpm build            # production build (standalone output)
pnpm start            # serve the built app
pnpm lint             # next lint
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest (unit)
pnpm test:e2e         # playwright (E2E)
```

## Docker

Build from the **repository root** (the Dockerfile needs the workspace files):

```bash
docker build -t easyid/web -f apps/web/Dockerfile .
docker run --rm -p 3000:3000 easyid/web
```
