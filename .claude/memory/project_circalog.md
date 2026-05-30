---
name: project-circalog
description: "Core facts about the CircaLog project — purpose, stack, architecture, and roadmap phase"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2d6e0e0b-f344-40a8-9cac-dfc7d12e02c8
---

CircaLog is an open-source, offline-first Progressive Web App (PWA) for people living with **Non-24-Hour Sleep-Wake Disorder (Non-24)** and other circadian rhythm disorders. It tracks, visualizes, and understands sleep *drift* — rather than imposing a neurotypical sleep model.

**Why:** Mainstream sleep apps assume night sleep + morning wake. For ~3M Non-24 patients, this is useless or actively misleading. CircaLog is purpose-built for continuous circadian drift.

**How to apply:** Frame all design and feature decisions around the core user: someone whose sleep cycle drifts around the clock continuously. Prioritize the Actogram visualization and drift-aware data modeling over conventional "sleep score" or bedtime-based UX.

## Tech Stack
- Framework: React 19 + Vite 8
- Styling: TailwindCSS v4 (Vite plugin — no PostCSS, no tailwind.config.js)
- Charts: Recharts v3
- Local Storage: IndexedDB
- Cloud DB: Supabase (PostgreSQL)
- Auth: Google Sign-In (optional)
- Hosting: Vercel
- Serverless: Vercel Functions (V1) → Cloudflare Workers (V2+)
- Updates: PWA Service Worker (silent auto-update)

## Installed Versions (Phase 0 — 2026-05-25, commit 7653772)
- Vite: ^8.0.12 (@vitejs/plugin-react ^6.0.1)
- React: ^19.2.6 / React DOM: ^19.2.6
- TypeScript: ~6.0.2
- TailwindCSS: ^4.3.0 / @tailwindcss/vite: ^4.3.0
- Recharts: ^3.8.1
- ESLint: ^10.3.0
- eslint-plugin-react-hooks: ^7.1.1
- eslint-plugin-react-refresh: ^0.5.2
- typescript-eslint: ^8.59.2
- prettier: ^3.8.3 / eslint-config-prettier: ^10.1.8
- @types/node: ^24.12.3 (included in template — not separately installed)

## Critical API Notes for Future Tasks
These versions differ from what common tutorials show — use these patterns:

**TypeScript 6:** `baseUrl` is deprecated and will error. Use `paths` alone:

```json
"paths": { "@/*": ["./src/*"] }
```

`./src/*` must be an explicit relative path (not `src/*`) when `baseUrl` is absent.

**ESLint 10 + react-hooks v7:** Plugin API changed. Use flat config style:

```js
reactHooks.configs.flat.recommended  // NOT reactHooks.configs.recommended.rules
reactRefresh.configs.vite            // NOT manual plugins + rules setup
```

**Vite 9 template:** Does NOT generate `src/vite-env.d.ts`. Vite client types
are declared via `"types": ["vite/client"]` in `tsconfig.app.json` instead.

**React import rule (`"jsx": "react-jsx"` + `"noUnusedLocals": true`):**

- `.tsx` files — do NOT add `import React from 'react'`. The JSX transform
  injects it automatically; the unused-locals rule will produce `TS6133` if
  the import is present.
- `.ts` files that call React APIs directly — use named imports:
  `import { useState } from 'react'` (preferred) or `import React from 'react'`
  with `React.useState`. Either compiles; named imports are consistent with the
  rest of the codebase.

## Architecture
Local-first: fully functional offline (IndexedDB), optional Google Sign-In to sync to Supabase cloud. Data lives on device first.

## Project Structure

```
C:\Projects\CircaLog\
  docs/          — project documentation (TO-DO list, DevPlan Q&A, etc.)
  src/
    assets/      — images, icons, fonts
    components/
      ui/        — primitive building-block components
    hooks/       — custom React hooks
    lib/
      db/        — IndexedDB service
      supabase/  — Supabase client (V2)
    pages/       — page-level components
    types/       — TypeScript type definitions
    utils/       — pure helper functions
  tasks/         — CC task files (untracked in git as of Phase 0)
  public/        — static assets (favicon.svg placeholder)
```

## Key URLs
- `circalog.app` — landing page (V1 coming soon, V2+ marketing)
- `circalog.app/log` — the PWA app (permanent URL)

## Roadmap Phase
Currently building **V1 (Core MVP)**:
- Sleep log with required + optional fields
- Actogram drift chart with time range toggle
- Nap auto-detection
- PWA manifest + service worker
- Local IndexedDB storage
- Continuous Vercel deployment from GitHub

**V2** adds: Google Sign-In, Supabase cloud sync, push notifications, PDF/CSV reports, doctor report, medication log, Android widget.
**V3** adds: multi-user, full marketing site, public open-source release.

## Design Language
Dark mode default, light/dark toggle. "Clinical + cosmic" aesthetic — dark charcoal with purple/violet accents, subtle night sky elements. Bottom tab bar: Log / Chart / History / Insights. Hamburger drawer for secondary features.
