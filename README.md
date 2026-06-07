# 🌙 CircaLog (<https://circalog.vercel.app/>)

> A sleep tracking PWA built for humans whose bodies don't run on a 24-hour clock.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com) [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev) [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com) [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com) [![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com) [![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat&logo=googlechrome&logoColor=white)](https://web.dev/progressive-web-apps/) [![Offline First](https://img.shields.io/badge/Offline-First-0f172a?style=flat)](https://offlinefirst.org)

CircaLog is an open-source, offline-first Progressive Web App (PWA) designed specifically for people living with **Non-24-Hour Sleep-Wake Disorder (Non-24)** and other circadian rhythm disorders. Unlike every mainstream sleep app built for neurotypical sleep patterns, CircaLog tracks, visualizes, and understands the *drift* — the defining feature of your condition, not a flaw in your data.

---

## Why CircaLog Exists

Every mainstream sleep app assumes you sleep at night and wake in the morning. For the estimated 3 million people living with Non-24, this assumption makes those apps useless, or worse, actively misleading.

CircaLog was built from the ground up for people whose sleep cycle drifts continuously around the clock. It speaks your language:

**Cycles, not calendar days. Actograms, not bedtime scores.**

---

## Features

### 🛏️ Sleep Logging
- One-tap start/stop sleep timer, or full manual time entry
- Required fields: sleep start time, wake time, quality rating (1–5)
- Optional fields: notes, dreams/nightmares, interruptions (nocturia, thirst,
  hunger, pain, other), medication taken (before/during/after sleep)
- Automatic nap detection (sessions under 3 hours = nap)
- Back-fill past entries going back weeks or months
- Correct night-anchor dating: sessions that cross midnight (e.g. bed at
  23:10 May 31, asleep at 00:37 June 1) are displayed under the night they
  started, not the calendar date of sleep onset — because that is how
  patients and doctors think about sleep

### 📊 Visualization
- **Actogram** — the primary chart. A diagonal drift visualization showing
  your sleep band shifting over time, exactly as sleep researchers view Non-24
  data. Time of day on the Y axis, cycle number and calendar date on the X axis.
- Time range toggle: `[ 1W ]  [ 2W ]  [ 1M ]  [ 3M ]  [ 6M ]  [ 1Y ]  [ All ]`
- Each entry displays both **calendar date** and **cycle number** simultaneously
- Free-running period estimation, displayed automatically after 14+ days of data
  using linear regression on sleep onset times

### 🔔 Smart Alerts
- Anomaly detection for significant cycle drift
- Flags for unusually short or fragmented sleep sessions
- Bedtime reminder notifications based on predicted sleep window
- Configurable lead time for reminders (default: 30–60 minutes)

### 📤 Export & Reports
- Weekly and monthly health summaries
- Export as CSV and PDF
- In-app changelog with version history
- Subtle logging streak counter for motivation

### 🎨 Design
- Dark mode by default, user-selectable light/dark toggle
- Clinical + cosmic aesthetic — clean, data-forward UI with subtle
  night sky elements
- Color palette: dark charcoal with purple/violet accents
- Bottom tab bar (Log / Chart / History / Insights) + hamburger side drawer
  for secondary features (Settings, Reports, Export, About, Privacy, etc.)
- Accessible: high contrast, legible typography, mobile-first layout
- Proper bottom padding for Android and iOS system navigation bars

### 🔐 Auth & Storage
- Fully functional offline without login (IndexedDB local storage)
- Optional Google Sign-In to enable cloud sync and backup
- Local-first architecture: data lives on device, syncs to cloud when connected

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Framework          | React 19 + Vite 8                               |
| Language           | TypeScript 6                                    |
| Styling            | TailwindCSS 4                                   |
| Charts             | Recharts 3                                      |
| Local Storage      | IndexedDB                                       |
| Cloud Database     | Supabase (PostgreSQL)                           |
| Authentication     | Google Sign-In (optional)                       |
| Hosting            | Vercel                                          |
| Serverless         | Vercel Functions (V1) → Cloudflare Workers (V2+)|
| Updates            | PWA Service Worker (silent auto-update)         |

---

## URL Structure

| URL                    | Content                                              |
|------------------------|------------------------------------------------------|
| `circalog.app`         | Landing page / coming soon (V1) → marketing page (V2+) |
| `circalog.app/log`     | The PWA app — permanent, never changes               |

---

## Roadmap

### V1 — Core MVP
- Sleep log with required + optional fields
- Actogram drift chart with time range toggle
- Nap auto-detection
- Dark/light mode with user toggle
- PWA manifest + service worker (offline support + auto-update)
- Local IndexedDB storage
- Coming soon landing page at root domain
- Continuous Vercel deployment from GitHub

### V2 — Enhanced
- Google Sign-In + Supabase cloud sync
- Push notifications + configurable bedtime reminders
- Free-running period calculation display
- Weekly + monthly PDF and CSV reports
- Doctor report (one-tap PDF with actogram included)
- Medication log linked to sleep patterns
- Android home screen widget (log + summary)
- Educational resources about Non-24
- Sleep debt tracker

### V3 — Public Launch
- Multi-user / multi-tenant architecture
- Tab bar customization
- Full marketing landing page
- Public open-source release
- Potential integrations (Google Health Connect, etc.)

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended; required by Vite 8)
- npm

### Installation

```bash
git clone https://github.com/sobhy0101/CircaLog.git
cd CircaLog
npm install
npm run dev
```

### Available Scripts

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # TypeScript check + production bundle
npm run lint      # Run ESLint
npm run format    # Format src/**/*.{ts,tsx,css} with Prettier
npm run preview   # Preview the production build locally
```

### Supabase CLI

These commands are only needed for V2+ cloud sync work. The app runs
fully offline without them.

```bash
supabase login                                    # Authenticate with the Supabase CLI
supabase init                                     # Initialize Supabase in the project (creates supabase/ directory)
supabase link --project-ref iarozmvqcsrkdgytqzws # Link to the CircaLog Supabase project
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

---

## Implementation Notes

These are decisions made during development that are not obvious from the
code alone. Captured here so contributors and future maintainers don't
rediscover them the hard way.

### Sync Status Indicator

The sync status indicator is a **tab shape** anchored to the top edge of
the viewport (`top-0`, `rounded-b-xl`, `border-x border-b`), not a
floating pill. This was a deliberate design choice: pills are used
throughout the UI (quality picker, session type badges) and a pill-shaped
status indicator was visually indistinct. The tab shape reads as
*infrastructure* rather than *content* — it belongs to the chrome of the
app, not to any page.

Five states are implemented: `synced` (grey) / `syncing` (amber, rotating
icon) / `pending` (purple, pulsing red dot) / `error` (red) / `offline`
(neutral, cloud-off icon). The `offline` state is detected via
`navigator.onLine` (read on mount) and `window` `online`/`offline` events
(subscribed in a `useEffect`). It is distinct from `pending` — offline is
expected and not alarming; pending while online is not.

The `navigator.onLine` guard in `syncService.ts` (`pushEntry` and
`flushQueue`) prevents the "Syncing… → Synced" flicker that occurred
because `flushQueue` was running, failing silently, and re-queuing entries
into a briefly-empty queue. With the guard in place, no push is attempted
while offline, so the queue stays non-empty and the tab correctly shows
`offline` until connectivity is restored.

### Auth Toast Notifications

Toast notifications (sign-in success, sign-out, errors) are positioned at
`bottom-20` — 80px from the bottom — to clear the 64px tab bar with
breathing room. They use `w-[90%] max-w-sm` to prevent long display names
(e.g. "Welcome, Mahmoud Sobhy!") from wrapping to more than two lines on
narrow screens. The icon and message text are centered (`justify-center`)
with the dismiss button absolutely positioned at `right-3` so it does not
disrupt the centering.

### Date Input Display

`<input type="date">` renders in the browser's OS locale format. On
en-US devices this shows `MM/DD/YYYY`, which is ambiguous for users who
expect `DD/MM/YYYY`. A `formatDisplayDate()` helper in
`ManualEntryForm.tsx` renders the selected date as `DD Mon YYYY`
(e.g. `07 Jun 2026`) below each date input. This format is unambiguous
regardless of locale. The label only renders when the field has a value,
and each date input is wrapped in a `<div className="flex-1">` with
`items-start` on the parent flex row so the adjacent time input does not
stretch to match the date+label height.

### `navigator.onLine` Reliability

`navigator.onLine === true` means "not definitely offline" — it does not
guarantee the server is reachable. Captive portals, DNS failures, or a
down Supabase instance all return `onLine: true` while pushes fail. The
`navigator.onLine` guard in `syncService.ts` catches the obvious case
(airplane mode / no adapter); the `try/catch` in `pushEntry` catches
subtler failures and queues the entry for retry. Both layers are needed.

---

## Contributing

CircaLog is open-source. Contributions are especially welcome from people
living with Non-24, DSPD, or other circadian rhythm disorders — because
the best people to build this tool are the ones who need it.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## A Note on the Name

*Circa* — from Latin: "approximately," "around."
*Log* — a record, a diary, a history.

**CircaLog:** an approximate record of time, for people who live
approximately outside of it.

---

*Built with 🌙 for the sleepless, the drifting, and the uncounted.*
