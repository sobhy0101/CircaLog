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
- [ ] 🟢 Integrate Google Fonts — Exo 2 (Semibold 600) and Inter (variable):
       - Add preconnect hints to `index.html`
       - Add `@import` in `index.css` and define font-family tokens in `@theme inline`
       (Fonts decided — see `docs/CircaLog_DevPlan_QA.md` → Typography section)
- [ ] 🟢 Build dark/light mode toggle:
       - `useTheme` hook (reads/writes `localStorage` key `circalog-theme`)
       - Export `THEME_KEY = 'circalog-theme'` as a named constant from `useTheme.ts`
       - Update FOUC script comment in `index.html` to reference `THEME_KEY` in `useTheme.ts`
       - `ThemeToggle` component
       - Wire into `App.tsx` / side drawer
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

### 🛏️ Sleep Log — Core

- [ ] 🔴 Design sleep log data model (IndexedDB schema)
- [ ] 🔴 Build IndexedDB service (CRUD operations)
- [ ] 🔴 Build "Start Sleep" one-tap timer screen
- [ ] 🔴 Build "Wake Up" completion screen
- [ ] 🔴 Build manual time entry form (both start and wake)
- [ ] 🟡 Required fields: sleep start, wake time, quality rating (1–5)
- [ ] 🟡 Optional fields toggle:
       - Notes (free text)
       - Dreams / Nightmares (yes/no + text)
       - Interruptions (count + type: bathroom/thirst/hunger/pain/other)
       - Medication taken (before/during/after, yes/no)
- [ ] 🟡 Auto-detect session type: Main Sleep (≥3h) vs. Nap (<3h)
- [ ] 🟡 Assign cycle number to each entry
- [ ] 🟡 Display both calendar date AND cycle number on each entry
- [ ] 🟢 Back-fill past entries (date/time picker for historical input)
- [ ] 🟢 Edit existing sleep entries
- [ ] 🟢 Delete sleep entries (with confirmation dialog)

### 📊 Visualization — Actogram

- [ ] 🔴 Build actogram component using Recharts
       - Y axis: time of day (00:00 – 23:59, or extended for >24h sessions)
       - X axis: cycle number (primary) + calendar date (secondary)
       - Sleep blocks rendered as vertical bars/bands
       - Nap blocks visually distinct from main sleep (opacity or color)
- [ ] 🔴 Build time range toggle: `[ 1W ] [ 1M ] [ 3M ] [ 6M ] [ 1Y ] [ All ]`
       - Default: 1W
       - Toggling changes visible range only — no data is hidden
- [ ] 🟡 Render actogram in dark and light themes correctly
- [ ] 🟡 Handle empty state (no data yet — prompt to log first sleep)
- [ ] 🟢 Tooltip on hover/tap showing session details
- [ ] 🟢 Pinch-to-zoom or swipe navigation on mobile

### 📋 History View

- [ ] 🟡 List view of all past sleep entries
- [ ] 🟡 Show: cycle number, calendar date, start time, wake time,
       duration, quality rating, session type (sleep/nap)
- [ ] 🟡 Filter by: date range, session type, quality rating
- [ ] 🟢 Sort by: most recent first (default) / the oldest first

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
- [ ] 🔴 In-app changelog modal (show on first load after update)
- [ ] 🟢 App installable on Android (add to home screen)
- [ ] 🟢 Offline fallback page
- [ ] 🟢 App icons (all sizes for Android, iOS, PWA)
- [ ] 🟢 Splash screen

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

- [ ] Write unit tests for core data logic (cycle numbering, drift calc)
- [ ] Test on Android (Chrome PWA)
- [ ] Test on iOS (Safari PWA — limited but functional)
- [ ] Test on PC (Chrome, Firefox, Edge)
- [ ] Accessibility audit (contrast, font sizes, tap targets)
- [ ] Performance audit (Lighthouse PWA score target: 95+)
- [ ] Keep dependencies updated
- [ ] Update changelog with every meaningful release
