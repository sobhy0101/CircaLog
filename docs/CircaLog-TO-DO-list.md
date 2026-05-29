# 🌙 CircaLog — TO-DO List

> Organized by version phase. Check off items as they are completed.
> Items marked 🔴 are blockers. Items marked 🟡 are dependencies.
> Items marked 🟢 are independent and can be started at any time.

---

## ⚙️ PHASE 0 — Project Setup

- [x] 🔴 Initialize React + Vite project
- [x] 🔴 Install and configure TailwindCSS
- [x] 🔴 Install Recharts
- [x] 🔴 Configure ESLint + Prettier
- [x] 🔴 Set up project folder structure
- [x] 🔴 Create GitHub repository
- [x] 🔴 Connect GitHub repo to Vercel for auto-deployment, it is currently assigned the domain name <https://circalog.vercel.app/>
- [x] 🟢 Set up Vercel Analytics and Speed Insights
- [x] 🟢 Write `.gitignore`
- [x] 🟢 Write `README.md`
- [x] 🟢 Write `LICENSE` (MIT)
- [x] 🟢 Create `.env.local` template (`.env.example`)
- [x] 🟢 Set up Supabase project (tables, RLS policies)
- [x] 🟢 Configure PWA manifest (`manifest.json`)
- [x] 🟢 Configure Vite PWA plugin (service worker)

---

## 🧠 PHASE 0.5 — Circadian Engine

> The mathematical core of CircaLog. All downstream features (history,
> actogram, insights, exports, sync) depend on these pure functions
> producing consistent results. Build and test this layer **before**
> finalizing the IndexedDB schema — otherwise migrations have to be
> rewritten later.
>
> *This phase was independently recommended by three AI reviewers (Gemini,
> ChatGPT, Grok) in May 2026, each arriving at the same conclusion: the
> circadian logic is the product — the UI is secondary. Their full reviews
> are archived in `docs/archive/reviews/` and serve as the rationale if
> this architecture is ever questioned by a collaborator or clinician.*

### 📐 Foundational Decisions (decide before writing code)

- [x] 🔴 Decide and document timezone strategy
       (UTC timestamps + IANA timezone name per entry; field names: sleepStartUtc,
       wakeUtc, ianaTimezone; rationale and full decision in docs/timezone-strategy.md)
- [x] 🔴 Decide and document cycle-number storage strategy
       (store but treat as derived; gapless 1-based sequence; re-assign after every
       insert, back-fill, delete, and start-time edit; full decision in
       docs/cycle-number-strategy.md)
- [ ] 🔴 Define TypeScript interfaces for the domain model
       - `SleepEntry`, `Cycle`, `SessionType`, `Interruption`, `Medication`, etc.
       - Lives in `src/lib/circadian/types.ts`
       - Framework-independent, database-independent

### 🧪 Test Infrastructure

- [ ] 🔴 Install and configure Vitest
- [ ] 🔴 Build test fixtures in `src/lib/circadian/__fixtures__/`
       - Sanitized historical sleep data from Mahmoud's own records
         (the strongest real-world test corpus available — supersedes any synthetic data)
       - Synthetic edge cases: timezone switches, DST transitions, long awake periods,
         back-fill scenarios, fragmented nights, nap-into-main-sleep drift

### 🔧 Pure Utility Functions (all in `src/lib/circadian/`)

- [ ] 🔴 `normalizeSleepSpan(entry)` — overnight + timezone + DST normalization
- [ ] 🔴 `detectSessionType(durationMs, gapMs)` — returns `'main'` | `'nap'`
- [ ] 🔴 `assignCycleNumber(entries)` — assigns/recomputes cycle numbers (idempotent; runs after every back-fill)
- [ ] 🔴 `calculateDrift(entries)` — minutes-per-cycle drift rate
- [ ] 🔴 `estimateFreeRunningPeriod(entries)` — linear regression on sleep onset times; returns `'pending'` until 14+ entries
- [ ] 🔴 `groupEntriesByCycle(entries)` — grouping helper for chart and history rendering
- [ ] 🔴 `detectFragmentation(entry)` — flags fragmented sleep sessions
- [ ] 🔴 `calculateRollingAverages(entries, windowDays)` — rolling 7/30-day stats

### ✅ Verification

- [ ] 🔴 Vitest test suite passes against both fixture sets (real history + synthetic edge cases)
       with zero failures before Phase 0.5 is considered complete

---

## 🚀 V1 — Core MVP

### 🌐 Routing

- [x] 🔴 Set up React Router
- [x] 🔴 Create route: `/log` → main PWA app
- [x] 🔴 Create route: `/` → coming soon landing page

### 🎨 Design System

- [x] 🟢 Define CSS variables / Tailwind theme tokens
       (circa-bg/surface/surface-raised, circa-border/border-strong,
       circa-accent/accent-subtle/accent-light, circa-text-primary/secondary/muted —
       dark + light mode, @variant dark, FOUC script, ComingSoon.tsx migrated)
- [x] 🟢 Integrate Google Fonts — Exo 2 (variable weight) and Inter (variable):
       - Added preconnect hints to `index.html` (fonts.googleapis.com + fonts.gstatic.com)
       - Added `<link rel="stylesheet">` tags in `index.html` for both fonts (full variable axis, display=swap)
       - Defined `--font-family-display` and `--font-family-body` tokens in `@theme inline` in `index.css`
       - Note: used `<link>` in HTML instead of CSS `@import` — parallel loading, not render-blocking
       - Weight pruning deferred to performance pass (full axis loaded until UI is designed)
       (Fonts decided — see `docs/CircaLog_DevPlan_QA.md` → Typography section)
- [ ] 🟢 Build dark/light mode toggle:
       - `useTheme` hook (reads/writes `localStorage` key `circalog-theme`)
       - Export `THEME_KEY = 'circalog-theme'` as a named constant from `useTheme.ts`
       - Update FOUC script comment in `index.html` to reference `THEME_KEY` in `useTheme.ts`
       - `ThemeToggle` component
       - Mount temporarily in `AppShell.tsx` for testing (will move to side drawer in the App Shell task below)
       (FOUC script is in the token task above; this task is the reactive UI layer)
- [ ] 🟢 Design app logo / splash screen
       (Brand logo SVG + PWA icons already generated under `public/images/brand/`.
       Remaining: review splash screen coverage on Android; design branded splash if needed.)

### 🌐 Landing Page (circalog.app root)

- [ ] 🟢 Design and build coming soon page
- [ ] 🟢 App name + tagline
- [ ] 🟢 Brief description of what CircaLog is and who it's for
- [ ] 🟢 "Get notified at launch" email capture (optional, simple)
- [ ] 🟢 Link to `/log` for early access

### 🏠 App Shell & Navigation

- [ ] 🟡 Build base app shell (bottom tab bar + side drawer layout)
- [ ] 🟡 Build bottom tab bar: `[ Log ] [ Chart ] [ History ] [ Insights ]`
- [ ] 🟡 Add bottom padding for Android/iOS system navigation bars
- [ ] 🟡 Build side drawer (hamburger icon top-left)
- [ ] 🟡 Populate drawer links: Settings, Reports, Export, About,
       Privacy Policy, Terms & Conditions, Dark Mode Toggle
       (move `ThemeToggle` here from its temporary placement in `AppShell.tsx`)

### 🛏️ Sleep Log — Core

- [ ] 🔴 Design sleep log data model (IndexedDB schema)
       (Derives from Phase 0.5 TypeScript interfaces — do not finalize
       until the Circadian Engine is stable)
- [ ] 🔴 Build IndexedDB service with full CRUD (create, read, update, delete) from day 1
       (Edit/delete capability must exist before serious testing — junk test data
       accumulates otherwise. Consider Dexie.js once Phase 0.5 query patterns are
       clear; defer that decision until then.)
- [ ] 🔴 Build manual time entry form (both start and wake)
       (Manual entry first — it stress-tests the data model faster than the timer
       flow and unblocks back-fill of historical data)
- [ ] 🔴 Build "Start Sleep" one-tap timer screen
- [ ] 🔴 Build "Wake Up" completion screen
- [ ] 🟡 Required fields: sleep start, wake time, quality rating (1–5)
- [ ] 🟡 Optional fields toggle:
       - Notes (free text)
       - Dreams / Nightmares (yes/no + text)
       - Interruptions (count + type: bathroom/thirst/hunger/pain/other)
       - Medication taken (before/during/after, yes/no)
- [ ] 🟡 Wire `detectSessionType` from Phase 0.5 into the save path (Main Sleep ≥3h vs. Nap <3h)
- [ ] 🟡 Wire `assignCycleNumber` from Phase 0.5 into the save path
- [ ] 🟡 Display both calendar date AND cycle number on each entry
- [ ] 🟢 Back-fill past entries (date/time picker for historical input)
       (Re-runs `assignCycleNumber` across the affected range after insert)
- [ ] 🟢 Edit existing sleep entries — user-facing form (CRUD layer already exists from above)
- [ ] 🟢 Delete sleep entries — confirmation dialog UX (CRUD layer already exists from above)

### 📋 History View

> Built **before** the actogram — it is the debugging console for the
> sleep log data. Chart bugs become tractable when the raw entries are
> visible in a sortable, filterable list.

- [ ] 🔴 List view of all past sleep entries
- [ ] 🔴 Show: cycle number, calendar date, start time, wake time,
       duration, quality rating, session type (sleep/nap)
- [ ] 🟡 Filter by: date range, session type, quality rating
- [ ] 🟢 Sort by: most recent first (default) / oldest first

### 📊 Visualization — Actogram

- [ ] 🔴 Build actogram component using Recharts
       - Y axis: time of day (00:00 – 23:59, or extended for >24h sessions)
       - X axis: cycle number (primary) + calendar date (secondary)
       - Sleep blocks rendered as vertical bars/bands
       - Nap blocks visually distinct from main sleep (opacity or color)
- [ ] 🔴 Build time range toggle: `[ 1W ] [ 1M ] [ 3M ] [ 6M ] [ 1Y ] [ All ]`
       - Default: 1W
       - Toggling changes visible range only — no data is hidden
- [ ] 🟡 Tooltip on hover/tap showing session details
       (Part of the core build — the chart is unreadable on mobile without it)
- [ ] 🟡 Basic touch navigation: horizontal pan/swipe
       (Part of the core build — required for mobile readability)
- [ ] 🟡 Render actogram in dark and light themes correctly
- [ ] 🟡 Handle empty state (no data yet — prompt to log first sleep)
- [ ] 🟢 Pinch-to-zoom (V2 candidate; basic pan is sufficient for V1)

### 💡 Insights View

- [ ] 🟡 Average sleep duration (rolling 7-day and 30-day)
- [ ] 🟡 Average drift per cycle (how many minutes later per cycle)
- [ ] 🟡 Longest and shortest sleep sessions
- [ ] 🟡 Total sleep sessions logged
- [ ] 🟡 Current streak (consecutive days with at least one log)
- [ ] 🟢 Free-running period estimate
       - Requires minimum 14 days of data
       - Calculated via linear regression on sleep onset times
       - Show "Pending — log 14+ days to unlock" until threshold is met
       - Display prominently once available

### 🔧 PWA & Deployment

- [x] 🔴 Configure Vite PWA plugin (Workbox service worker)
- [x] 🔴 Silent auto-update on new deployments
- [ ] 🟡 Verify PWA icons are wired into the manifest (all sizes for Android, iOS, PWA)
       (Icons already generated under `public/images/brand/` — this is configuration verification)
- [ ] 🟡 Verify Android splash screen coverage; design branded splash if needed
- [ ] 🟡 App installable on Android (add to home screen — verify after icons are wired)
- [ ] 🟢 Offline fallback page
- [ ] 🟢 In-app changelog modal — show on first load after update
       (UX polish, not a blocker for V1 functionality)

### 🛟 Data Resilience

> IndexedDB can be evicted by browser storage cleanup. Export/import is
> the safety net before cloud sync arrives in V2 — for a tool tracking
> months or years of personal health data, this is not optional.

- [ ] 🔴 Export all data as JSON (manual backup)
- [ ] 🔴 Import JSON backup (manual restore, with merge-vs-replace prompt)
- [ ] 🟡 Schema migration handler (for when the engine model evolves)

---

## 🔧 V2 — Enhanced Features

### 🔐 Auth & Cloud Sync

- [ ] Implement optional Google Sign-In
- [ ] Connect Supabase auth to Google OAuth
- [ ] Build sync service: IndexedDB → Supabase on connect
- [ ] Handle sync conflicts (local wins by default)
- [ ] Show sync status indicator in UI
- [ ] Allow sign-out (data remains local)

### 🔔 Notifications

- [ ] Request push notification permission (gracefully)
- [ ] Bedtime reminder: configurable lead time (default 30–60 min)
- [ ] Reminder to log sleep after extended wake period
- [ ] Cycle drift alert (configurable threshold)
- [ ] Fragmented sleep flag notification
- [ ] Ensure notifications are free (PWA Web Push — no cost)

### 📤 Reports & Export

- [ ] Weekly sleep summary (auto-generated)
- [ ] Monthly sleep summary
- [ ] Export as CSV (all fields)
- [ ] Export as PDF (formatted health report)
- [ ] Doctor report: one-tap PDF including actogram chart,
       free-running period, average cycle length, drift rate

### 🩺 Health Tracking (Optional Fields)

- [ ] Light exposure field (none / indoor / outdoor / bright)
- [ ] Physical activity level (none / light / moderate / intense)
- [ ] Headache / pain level (0–10 scale)
- [ ] Mood / energy upon waking (1–5 scale)
- [ ] All fields optional, off by default, toggleable in Settings

### 💊 Medication Log

- [ ] Separate medication tracking section
- [ ] Log medication name, dose, timing (before/during/after sleep)
- [ ] Link medication entries to sleep sessions
- [ ] View correlation between medication and sleep quality

### 📚 Educational Resources

- [ ] "About Non-24" section in side drawer
- [ ] Brief explanation of Non-24, free-running period, actograms
- [ ] Curated links to reputable resources (NIH, Sleep Foundation, etc.)

### 😴 Sleep Debt Tracker

- [ ] User-configurable sleep target (default: 8 hours)
- [ ] Display cumulative sleep debt / surplus
- [ ] Note in UI that Non-24 makes standard targets approximate

---

## 🌍 V3 — Public Launch

### Multi-User Architecture

- [ ] Refactor data model for multi-tenancy
- [ ] User profiles and account management
- [ ] Caregiver / shared access (view-only link)

### Customization

- [ ] Customizable bottom tab bar (choose which features appear)
- [ ] Features not in tab bar move to side drawer automatically

### Android Widget

- [ ] One-tap Log Sleep / Wake widget for Android home screen
- [ ] Last sleep entry summary widget

### Marketing

- [ ] Full marketing landing page at `circalog.app`
- [ ] App moves to `circalog.app/log` (already planned)
- [ ] Screenshots, feature highlights, testimonials

### Open Source

- [ ] Review codebase for any private/sensitive data
- [ ] Write `CONTRIBUTING.md`
- [ ] Write `CODE_OF_CONDUCT.md`
- [ ] Tag V1.0.0 release on GitHub
- [ ] Publish as public repository

---

## 🐛 Ongoing / Always

- [ ] Extend unit test coverage beyond the Phase 0.5 Circadian Engine
       (UI components, IndexedDB service, integration flows)
- [ ] Test on Android (Chrome PWA)
- [ ] Test on iOS (Safari PWA — limited but functional)
- [ ] Test on PC (Chrome, Firefox, Edge)
- [ ] Accessibility audit (contrast, font sizes, tap targets)
- [ ] Performance audit (Lighthouse PWA score target: 95+)
- [ ] Keep dependencies updated
- [ ] Update changelog with every meaningful release
