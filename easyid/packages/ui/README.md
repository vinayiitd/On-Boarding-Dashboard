# @easyid/ui

Design tokens and shadcn-style primitives shared across easyID's web surfaces.

## What lives here

- `styles.css` — the design token layer. Imported once from
  `apps/web/src/app/globals.css`. Uses Tailwind v4's CSS-first `@theme` syntax;
  there is no `tailwind.config.ts`.
- `components/*` — headless-ish primitives built on Radix (Button, Card, etc.
  will be added over time).
- `lib/utils.ts` — the `cn()` helper wrapping `clsx` and `tailwind-merge`.

## Usage

In your web app:

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";
@import "@easyid/ui/styles.css";
```

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@easyid/ui";
```

## Design principles

- Tokens over hard-coded colours. Every colour references a CSS custom property
  so themes (light / dark / brand overrides) work without touching components.
- Primitives, not screens. This package must never depend on the SDK, domain, or
  business types. Screens live in `apps/web`.
