---
name: project-circalog
description: "Core facts about the CircaLog project — purpose, stack, architecture, and current V1 build status"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2d6e0e0b-f344-40a8-9cac-dfc7d12e02c8
---

CircaLog is an open-source, offline-first Progressive Web App (PWA) for people living with **Non-24-Hour Sleep-Wake Disorder (Non-24)** and other circadian rhythm disorders. It tracks, visualizes, and understands sleep *drift* — rather than imposing a neurotypical sleep model.

**Why:** Mainstream sleep apps assume night sleep + morning wake. For ~3M Non-24 patients, this is useless or actively misleading. CircaLog is purpose-built for continuous circadian drift.

**How to apply:** Frame all design and feature decisions around the core user: someone whose sleep cycle drifts around the clock continuously. Prioritize the Actogram visualization and drift-aware data modeling over conventional "sleep score" or bedtime-based UX.

## Tech Stack
- Framework: React + Vite
- Styling: TailwindCSS
- Charts: Recharts
- Local Storage: IndexedDB via Dexie 4.x
- Cloud DB: Supabase (PostgreSQL)
- Auth: Google Sign-In (optional)
- Hosting: Vercel
- Serverless: Vercel Functions (V1) → Cloudflare Workers (V2+)
- Updates: PWA Service Worker (silent auto-update)

## Architecture
Local-first: fully functional offline (IndexedDB), optional Google Sign-In to sync to Supabase cloud. Data lives on device first.

## Key URLs
- `circalog.app` — landing page (V1 coming soon, V2+ marketing)
- `circalog.app/log` — the PWA app (permanent URL)
- `circalog.app/log/import` — CSV import
- `circalog.app/log/export` — JSON backup export
- `circalog.app/log/restore` — JSON backup restore

## V1 Build Status (as of 11 Jun 2026)

**Completed:**
- Phase 0 — Project setup, Vercel/Supabase/PWA config
- Phase 0.5 — Full circadian engine (normalizeSleepSpan, detectSessionType, assignCycleNumber, calculateDrift, estimateFreeRunningPeriod, groupEntriesByCycle, detectFragmentation, calculateRollingAverages) + Vitest suite
- Sleep log UI — timer flow, manual entry, back-fill, edit, soft-delete
- History view — sortable, filterable entry list; Session Detail page (`/log/history/:entryId`)
- **Actogram chart** — Recharts ComposedChart with inverted Y axis (00:00 at top), one ReferenceArea per sleep block, dynamic yMax, time range toggle (1W / 2W / 1M / 3M / 6M / 1Y / All), custom tooltip overlay, horizontal scroll, dark/light theme support
- **Auth (moved into V1 for data resilience)** — optional Google Sign-In via Supabase OAuth, `useAuth` hook, `GoogleSignInButton`, `UserAvatar`, auth zone in SideDrawer, toast notifications for sign-in/sign-out/errors. See [[project-auth-system]].
- **CSV import** — imports from CircaLog Daily Tracker spreadsheet; preview table; gate checks (online + Supabase + signed-in); duplicate skip; interruption mapping; return-path after OAuth redirect
- **Data Resilience (Phase 1)** — JSON backup export (`/log/export`), JSON restore with Merge/Replace modes (`/log/restore`), `migrateBackup()` schema migration handler (`SCHEMA_VERSION = 1`), Dexie schema at v3
- **Insights view** — drift rate, rolling averages (7-day / 30-day), free-running period estimate (pending until 14+ entries), longest/shortest sessions, total sessions, streak

**Remaining in V1:**
- Supabase sync service: IndexedDB → Supabase on connect
- PWA icon/manifest verification + Android splash screen

**V2** adds: push notifications, PDF/CSV reports, doctor report, medication log, Android widget.
**V3** adds: multi-user, full marketing site, public open-source release.

## Design Language
Dark mode default, light/dark toggle. "Clinical + cosmic" aesthetic — dark charcoal with purple/violet accents, subtle night sky elements. Bottom tab bar: Log / Chart / History / Insights. Hamburger drawer for secondary features.

## Recharts gotcha (actogram)
Custom XAxis ticks that need extra props (e.g. a lookup map) must use a factory function pattern — `makeXTick(lookup)` returns a closure whose prop type contains only Recharts-native fields. Passing extra required props directly on the tick component type causes a TS contravariance error against `TickProp<XAxisTickContentProps>`.

## Backup schema design notes
- `SCHEMA_VERSION` (in `src/utils/backupSchema.ts`) and Dexie version are separate counters. Dexie version = IDB store structure. SCHEMA_VERSION = SleepEntry shape in backup files.
- Increment SCHEMA_VERSION only on breaking SleepEntry changes (renames, removals). Additive changes (new optional fields) do not require a bump.
- `bulkPut` is used directly in restore (not `createEntry`) to preserve original `id` values — essential for duplicate detection and Supabase sync correctness.
