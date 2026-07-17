# Workspace

## Projects

### easyID — Company landing page

Single-file HTML landing page for **easyID · Where Compliance Matters**.
Presents the company vision and mission, and includes a demo section with
a one-click launcher for the Sentinel product below.

- File: [`easyid.html`](./easyid.html)
- Just open it directly in any modern browser — no build step needed.

### Sentinel — AI Compliance Officer (easyID's first product)

Production-quality Next.js demo of an Australian Tranche 2 KYC platform for
accountants, lawyers and real estate agencies. Full onboarding flow: create
client → pick document types, upload files, capture identity fields →
AI Compliance Officer recommendation → printable compliance report. See
[`kyc-platform/README.md`](./kyc-platform/README.md).

```bash
cd kyc-platform && npm install && npm run dev
```

The **Launch Sentinel demo** button on the easyID landing page opens
`http://localhost:3000` — start the dev server first.

### Standalone HTML dashboards

- [`index.html`](./index.html) — Onboarding analytics dashboard.
- [`itinerary.html`](./itinerary.html) — New Zealand South Island 11-day family itinerary dashboard with an interactive route map, day-by-day timeline, and family-friendly hotel picks.

Open either file directly in a modern browser; no build step is required.
The itinerary map uses OpenStreetMap tiles via CARTO and Leaflet.js from a CDN.
