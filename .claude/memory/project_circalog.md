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
- Framework: React + Vite
- Styling: TailwindCSS
- Charts: Recharts
- Local Storage: IndexedDB
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
