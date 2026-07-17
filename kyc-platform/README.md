# Sentinel — AI Compliance Officer

A production-quality demo of an **Australian Tranche 2 KYC platform** built for
accountants, lawyers and real estate agencies. Sentinel positions the product
as an **AI Compliance Officer**: it reads every uploaded document, flags what's
missing, drafts a risk-weighted recommendation and produces an audit-ready
report — all without ever touching a real identity API.

The demo is a workflow prototype. There is **no authentication, no billing, no
third-party services, no OCR, no LLM calls**. Every AI response is simulated by
a deterministic, heuristic-driven engine so the flow tells a coherent story on
every run.

## Screens

| # | Route | What it demonstrates |
|---|---|---|
| 1 | `/` | Landing dashboard — KPI metric cards, AI copilot banner, "ready for review" list, recent activity timeline, high-risk client grid |
| 2 | `/clients/new` | Create-client form built with React Hook Form + validation, entity picker, industry/country/segment selection, reviewer assignment |
| 3 | `/clients/[id]/upload` | Drag-and-drop uploader with animated per-file progress, auto-classification, suggested checklist |
| 4 | `/clients/[id]/analysis` | AI analysis with rotating progress messages, animated confidence ring, findings by section |
| 5 | `/clients/[id]/officer` | Hero AI Compliance Officer view: overall status, risk rationale, recommendations with "Why?" explainer panels, reviewer sign-off dialog |
| 6 | `/clients/[id]/report` | Beautifully typeset, printable compliance report (browser print → PDF) |

Supporting surfaces: `/clients`, `/reviews`, `/insights`, `/policies`,
`/settings`, `/support`.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Turbopack**
- **TailwindCSS v4** with a custom CSS-first design token system
- **shadcn/ui-style primitives** on top of **Radix UI**
- **Framer Motion** for micro-interactions
- **Lucide** icons
- **React Hook Form** for the create-client form
- **Sonner** for toasts
- **nanoid** for id generation

State lives in a lightweight React context (`src/lib/store.tsx`) backed by
`localStorage` so the demo survives refreshes. Seed data in `src/lib/seed.ts`
gives the dashboard a realistic book of business on first load. The simulated
AI lives in `src/lib/ai.ts` and produces analysis output deterministically
from the client profile and document names.

## Design language

- Palette: `#2563EB` primary, `#14B8A6` accent, plus semantic warning / danger / success.
- Type: **Inter** with tight tracking; **JetBrains Mono** for tabular numerics.
- Radii: soft, generous (`12–20px`). Shadows: layered and subtle.
- Motion: springs on hover, fades and slides on mount, no bouncy over-animation.
- Full **light + dark** themes with a segmented topbar toggle.
- Print CSS renders the report on A4 with no app chrome.

## Running

```bash
cd kyc-platform
npm install
npm run dev
```

Open http://localhost:3000. The homepage auto-hydrates with seed data — hit
"New client" to walk through the entire flow.

### One-click desktop shortcut

Prefer a double-click? An installer that drops a launcher on your Desktop
ships with the app. See [`desktop-shortcut/README.md`](./desktop-shortcut/README.md).

```bash
# macOS + Linux
bash kyc-platform/desktop-shortcut/install-desktop-shortcut.sh

# Windows
powershell -ExecutionPolicy Bypass -File kyc-platform\desktop-shortcut\install-desktop-shortcut.ps1
```

## Project structure

```
desktop-shortcut/                     # One-click launchers for macOS, Windows, Linux
src/
├── app/
│   ├── (app)/                       # Authenticated app shell (sidebar + topbar)
│   │   ├── page.tsx                 # Dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx             # Client list
│   │   │   ├── new/                 # Create client
│   │   │   └── [id]/                # Client detail + flow
│   │   │       ├── upload/
│   │   │       ├── analysis/
│   │   │       ├── officer/
│   │   │       └── report/
│   │   ├── reviews/, insights/, ...
│   ├── globals.css                  # Design tokens + theme
│   └── layout.tsx
├── components/
│   ├── ui/                          # Button, Card, Input, Dialog, etc.
│   ├── layout/                      # Sidebar, Topbar, PageHeader
│   ├── onboarding/                  # StepIndicator, DocumentDropzone
│   └── brand/                       # Logo
└── lib/
    ├── ai.ts                        # Simulated AI engine
    ├── seed.ts                      # Seed clients & activity
    ├── store.tsx                    # In-memory + localStorage store
    ├── reviewers.ts
    └── types.ts
```

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # eslint
```
