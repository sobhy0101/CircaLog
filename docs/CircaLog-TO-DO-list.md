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
- [x] 🔴 Define TypeScript interfaces for the domain model
       (SleepEntry, Cycle, SessionType, QualityRating, InterruptionType,
       MedicationTiming, Interruption, Medication, FreeRunningPeriodResult,
       DriftResult, RollingAverages — all in src/lib/circadian/types.ts)

### 🧪 Test Infrastructure

- [x] 🔴 Install and configure Vitest
- [x] 🔴 Build test fixtures in `src/lib/circadian/__fixtures__/`
       - Sanitized historical sleep data from Mahmoud's own records
         (the strongest real-world test corpus available — supersedes any synthetic data)
       - Synthetic edge cases: timezone switches, DST transitions, long awake periods,
         back-fill scenarios, fragmented nights, nap-into-main-sleep drift

### 🔧 Pure Utility Functions (all in `src/lib/circadian/`)

- [x] 🔴 `normalizeSleepSpan(entry)` — overnight + timezone + DST normalization
- [x] 🔴 `detectSessionType(durationMs, gapMs)` — returns `'main'` | `'nap'`
- [x] 🔴 `assignCycleNumber(entries)` — assigns/recomputes cycle numbers (idempotent; runs after every back-fill)
- [x] 🔴 `calculateDrift(entries)` — minutes-per-cycle drift rate
- [x] 🔴 `estimateFreeRunningPeriod(entries)` — linear regression on sleep onset times; returns `'pending'` until 14+ entries
- [x] 🔴 `groupEntriesByCycle(entries)` — grouping helper for chart and history rendering
- [x] 🔴 `detectFragmentation(entry)` — flags fragmented sleep sections
- [x] 🔴 `calculateRollingAverages(entries, windowDays)` — rolling 7/30-day stats

### ✅ Verification

- [x] 🔴 Vitest test suite passes against both fixture sets (real history + synthetic edge cases)
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
       - Note: used `<link>` in HTML instead of CSS `@import` — parallel loading, not render-blocking
       - Weight pruning deferred to performance pass (full axis loaded until UI is designed)
       - Token naming fix (CC_TASK_Phase1_FontTokenFix.md): original tokens `--font-family-display` /
         `--font-family-body` were renamed to `--font-heading` / `--font-sans` to follow Tailwind v4
         convention (`--font-{name}` → utility `font-{name}`). `--font-sans` overrides Tailwind's
         default sans stack so Inter applies to `body` automatically via Tailwind's preflight.
         All page files updated from `font-display` → `font-heading`.
       (Fonts decided — see `docs/CircaLog_DevPlan_QA.md` → Typography section)
- [x] 🟢 Build dark/light mode toggle
       (useTheme hook with THEME_KEY export, ThemeToggle component with SVG icons,
       mounted temporarily in AppShell.tsx; FOUC comment updated to reference THEME_KEY)
- [x] 🟢 Design app logo / splash screen
       (Brand logo SVG + PWA icons already generated under `public/images/brand/`.
       Remaining: review splash screen coverage on Android; design branded splash if needed.)
### 🌐 Landing Page (circalog.app root)

- [x] 🟢 Design and build coming soon page
- [x] 🟢 App name + tagline
- [x] 🟢 "Get notified at launch" email capture (optional, simple)

### 🏠 App Shell & Navigation

- [x] 🟡 Build base app shell (bottom tab bar + side drawer layout)
- [x] 🟡 Build bottom tab bar: `[ Log ] [ Chart ] [ History ] [ Insights ]`
- [x] 🟡 Add bottom padding for Android/iOS system navigation bars
- [x] 🟡 Build side drawer (hamburger icon top-left)
- [x] 🟡 Populate drawer links: Settings, Reports, Export, About,
       Privacy Policy, Terms & Conditions, Dark Mode Toggle
       (move `ThemeToggle` here from its temporary placement in `AppShell.tsx`)

### ♿ Accessibility Implementation

> The Ongoing section has an audit task, but audits find problems after the
> fact. These are the implementation items that must be built in from the
> start. A health app used by people who are often cognitively impaired by
> sleep deprivation has a higher accessibility obligation than most.

- [x] 🟡 ARIA labels on all interactive elements that lack visible text
       (icon-only buttons, the sync pill, the tab bar icons, the actogram
       toggle buttons, the drawer close button, the quality rating stars)
- [x] 🟡 Keyboard navigation — full Tab order through all interactive elements
       on every screen; no keyboard traps except intentional modals/drawers
- [x] 🟡 Focus traps in modals and the side drawer
       When the drawer or a confirmation dialog is open, Tab must cycle within
       it and not reach elements behind it. Focus must return to the trigger
       element when closed.
- [x] 🟢 Screen reader support — test with TalkBack (Android) and VoiceOver (iOS)
       Ensure all status changes (sync state, import progress, form errors) are
       announced; live regions (`aria-live`) where appropriate.
- [ ] 🟡 Minimum tap target size — 44×44 px on all tappable elements
       Audit the tab bar icons, the quality star buttons, the filter chips,
       and the actogram range toggle buttons. Applies especially to elements
       used when the patient is drowsy.
- [ ] 🟢 Keyboard shortcuts on desktop (Tab to navigate, Enter to submit forms,
       Escape to close drawers/modals, arrow keys in the quality rating)
       Desktop PWA users should not need to reach for the mouse.

### 🛏️ Sleep Log — Core

> **Architecture note — two-step timer flow (decided Jun 2026):**
>
> The original single-tap "Start Sleep" timer only captures `sleepStartUtc`.
> `bedTimeUtc` is already an optional field in `SleepEntry` (defined in
> Phase 0.5 — no schema migration needed) but the UI never captures it.
>
> Sleep Onset Latency (the gap between lying down and actually falling
> asleep) is clinically significant for Non-24 patients and their doctors,
> and is already tracked in the CircaLog Daily Tracker spreadsheet.
>
> The timer screen must be redesigned as a two-step flow:
>
> **Step 1 — "In Bed?" button:**
> - User taps when getting into bed
> - Records `bedTimeUtc`
> - A visible elapsed-time counter starts: "In bed for Xh Ym"
> - A second button appears: "Going to Sleep?"
>   (disabled for a short grace period to prevent accidental double-tap)
>
> **Step 2 — "Going to Sleep?" button:**
> - User taps when actually closing their eyes to sleep
> - Records `sleepStartUtc`
> - Sleep Onset Latency displayed: "Fell asleep after Xh Ym"
> - Session enters "Sleeping…" state; "Wake Up" button appears as before
>
> **State persistence:**
> The state between Step 1 and Step 2 (and between Step 2 and Wake Up)
> must survive app close/reopen. Persist the in-progress session to
> `localStorage` or as a draft `SleepEntry` in IndexedDB so that closing
> the app mid-session does not lose the bedtime.
>
> **Manual entry form:**
> The back-fill form already has an optional Bed Time field (implemented).
> When both Bed Time and Sleep Start are filled, Sleep Onset Latency is
> auto-calculated and displayed inline. `bedTimeUtc` being optional means
> all historical entries without it remain valid.

- [x] 🔴 Design sleep log data model (IndexedDB schema)
       (Derives from Phase 0.5 TypeScript interfaces — do not finalize
       until the Circadian Engine is stable)
- [x] 🔴 Build IndexedDB service with full CRUD (create, read, update, delete) from day 1
       (Edit/delete capability must exist before serious testing — junk test data
       accumulates otherwise. Consider Dexie.js once Phase 0.5 query patterns are
       clear; defer that decision until then.)
- [x] 🔴 Build manual time entry form (both start and wake)
       (Manual entry first — it stress-tests the data model faster than the timer
        flow and unblocks back-fill of historical data)
- [x] 🟢 Fix date format in manual entry form — display DD/MM/YYYY
       (`<input type="date">` displays in the OS locale format, which shows MM/DD/YYYY
        on en-US devices. Add a visible DD/MM/YYYY label above the date field showing
        the currently selected value, so the correct date is always unambiguous,
        regardless of the browser's native picker format.)
- [x] 🔴 Build "Start Sleep" one-tap timer screen
- [x] 🔴 Build "Wake Up" completion screen
- [ ] 🔴 Redesign timer screen: replace single "Start Sleep" button with two-step flow
       "In Bed" → elapsed-time counter → "Going to Sleep" (see architecture note above)
       This is a rework of the existing timer screen, not a new screen.
       The Wake Up screen needs a small companion change — see item below.
- [ ] 🔴 Persist in-progress timer session across app close/reopen
       Between "In Bed?" and "Going to Sleep?", and between "Going to Sleep?" and
       "Wake Up", the partial session state must survive a browser close.
       Use `localStorage` for the active-session draft (not IndexedDB — simpler
       and fast enough for a single in-progress record).
- [x] 🟡 Add Bed Time field to the manual back-fill entry form
       Optional field, appears before Sleep Start.
       When both Bed Time and Sleep Start are filled, calculate and display
       Sleep Onset Latency inline (e.g., "Onset latency: 23 min").
       `bedTimeUtc` is already defined in `SleepEntry` — no schema change needed.
       (Already implemented in `ManualEntryForm.tsx` and `SessionDetailPage.tsx`)
- [ ] 🟡 WakeUpScreen: show "In Bed" time read-only above the editable "Fell Asleep" field
       After the two-step redesign, `bedTimeUtc` is captured intentionally in Step 1.
       The Wake Up form must display it for review before saving:
         "In bed: 11:00 PM  →  Fell asleep: 11:34 PM  →  Onset: 34 min"
       "In bed" time is read-only here (it was recorded on purpose; History edit covers
       corrections). "Fell asleep" remains editable as it is today.
       When `sleepStartUtc` equals `bedTimeUtc` (user didn't edit it), show "Onset: 0 min"
       with a subtle prompt: "Did you fall asleep immediately?" — so the user is nudged
       to correct it if they forgot to tap "Going to Sleep" separately.
- [x] 🟡 Required fields: sleep start, wake time, quality rating (1–5)
- [x] 🟡 Optional fields toggle:
       - Notes (free text)
       - Dreams / Nightmares (yes/no + text)
       - Interruptions (count + type: bathroom/thirst/hunger/pain/other)
       - Medication taken (before/during/after, yes/no)
- [x] 🟡 Wire `detectSessionType` from Phase 0.5 into the save path (Main Sleep ≥3h vs. Nap <3h)
- [x] 🟡 Wire `assignCycleNumber` from Phase 0.5 into the save path
- [x] 🟡 Display both calendar date AND cycle number on each entry
       (Shown on every History View entry card: cycle badge + local date + local times)
- [x] 🟢 Back-fill past entries (date/time picker for historical input)
       (Re-runs `assignCycleNumber` across the affected range after insert)
- [x] 🟢 Edit existing sleep entries — user-facing form (CRUD layer already exists from above)
       (ManualEntryForm in edit mode, pre-fills all fields from existing SleepEntry)
- [x] 🟢 Delete sleep entries — confirmation dialog UX (CRUD layer already exists from above)
       (Soft delete via DeleteConfirmDialog; cycle numbers renumber automatically)
- [x] Session Detail Page + Clickable Cards in History View (V2 candidate — not a blocker for V1, but a strong UX improvement)
       (SessionDetailPage component; route `/log/history/:entryId`)

### 📋 History View

> Built **before** the actogram — it is the debugging console for the
> sleep log data. Chart bugs become tractable when the raw entries are
> visible in a sortable, filterable list.
>
> *Note: the first two items below were completed as part of Batch C
> (Sleep Log Core), not a separate Batch D session. CC built the History
> View alongside Edit/Delete rather than deferring it.*

- [x] 🔴 List view of all past sleep entries
- [x] 🔴 Show: cycle number, calendar date, start time, wake time,
       duration, quality rating, session type (sleep/nap)
- [x] 🟡 Filter by: session type (All / Main Sleep / Nap) and quality rating (All / ★–★★★★★)
       (Collapsible filter panel opened via header icon button; dot indicator when
       active; "N of M sessions" subtitle; "Clear" button resets filters.
       Note: date range filter deferred — not included in V1 build.)
- [x] 🟢 Sort by: Newest (default) / Oldest / Rating ↑ / Rating ↓
       (Compact button row always visible above the entry list)

### 📊 Visualization — Actogram

- [x] 🔴 Build actogram component using Recharts
       - Y axis: time of day (00:00 – 23:59, or extended for >24h sessions)
       - X axis: cycle number (primary) + calendar date (secondary)
       - Sleep blocks rendered as vertical bars/bands
       - Nap blocks visually distinct from main sleep (opacity or color)
- [x] 🔴 Build time range toggle: `[ 1W ] [ 1M ] [ 3M ] [ 6M ] [ 1Y ] [ All ]`
       - Default: 1W
       - Toggling changes visible range only — no data is hidden
- [x] 🟡 Tooltip on hover/tap showing session details
       (Part of the core build — the chart is unreadable on mobile without it)
- [x] 🟡 Basic touch navigation: horizontal pan/swipe
       (Part of the core build — required for mobile readability)
- [x] 🟡 Render actogram in dark and light themes correctly
- [x] 🟡 Handle empty state (no data yet — prompt to log first sleep)
- [x] 🟢 Pinch-to-zoom (V2 candidate; basic pan is sufficient for V1)

### 🔐 Auth & Cloud Sync

> Moved into V1 so that real patient data can be imported and used safely.
> IndexedDB alone is not sufficient — it can be evicted by the browser at
> any time, and the patient's PC is unstable. Data must land in Supabase
> immediately on import. Nothing in this section should be built after the
> CSV import below.

- [x] 🔴 Implement optional Google Sign-In (Required for data resilience)
- [x] 🔴 Connect Supabase auth to Google OAuth
- [x] 🟢 Show sign-in success toast notification
- [x] 🟢 Show signed-out toast notification
- [x] 🟢 Show error toast notification (sign-in / sign-out failures)
- [x] 🔴 Build sync service: IndexedDB → Supabase on connect
- [x] 🟡 Handle sync conflicts (local wins by default — first-time sync scenario)
- [x] 🟡 Show sync status indicator in UI
- [x] 🟢 Fix sync pill — add distinct offline state
       (Currently shows "Synced" while offline because the flush cycle completes
        before re-enqueue. Pill must detect `navigator.onLine === false` and show
        a neutral "Saved — Offline" state instead. Separate from "Pending sync" —
        offline is expected; pending while online is not.)
- [x] 🟢 Allow sign-out (data remains local)
- [ ] 🟡 Auth token refresh error handling
       If the Supabase session expires mid-use (token refresh fails), the app
       must not silently drop sync writes or crash. Detect the expired session,
       prompt the user to re-authenticate, and queue any pending writes for
       retry after sign-in is restored.
- [ ] 🟡 Supabase sync write rejection handling
       If Supabase rejects a write (RLS violation, quota exceeded, network timeout),
       the entry must remain in the `syncQueue` with a visible retry state rather
       than being silently discarded. The sync status indicator must reflect this.
- [ ] 🟢 Multi-device offline conflict resolution — design decision required
       "Local wins" covers the first-time sync scenario (device A has data, Supabase
       does not). The distinct scenario: Device A and Device B both modify the same
       entry while offline, then both sync. Last-write-wins on `updatedAt` is the
       simplest resolution. Document the chosen strategy explicitly before implementing
       sync for multi-device users. At minimum, no data should be silently discarded.

### 🔒 Security

> These items must be addressed before the app is shared with anyone beyond
> the developer. A health app that stores years of sleep and medication data
> is a high-value target for privacy violations.

- [ ] 🔴 Supabase RLS policy audit — verify before any external user accesses the app
       Confirm that no authenticated user can read, write, update, or delete
       another user's rows in any table (`sleep_entries`, `sync_queue`,
       `profiles`, and all future tables). Test this manually: sign in as User A,
       attempt to query User B's data by ID. Must return empty or error.
- [ ] 🟡 Input sanitization on all free-text fields
       Fields: session notes, dream notes, interruption notes, medication names,
       meal names, drink log notes. Sanitize before writing to IndexedDB and
       before inserting into Supabase. At minimum: strip leading/trailing whitespace,
       enforce a reasonable max length per field, reject null bytes.
       XSS risk is low in a PWA (no server-rendered HTML), but stored values
       are later rendered in components — sanitize defensively.
- [ ] 🟢 Dependency security audit — run `npm audit` and resolve high/critical findings
       before external release. Add this to the pre-release checklist.
       Dependabot (already enabled on GitHub) is the ongoing gate; this task is
       the point-in-time clean sweep before V1 goes public.

### 📥 Data Import

- [x] ✅ Import sleep log from CSV
       - Accepts CSV exported from the CircaLog Daily Tracker spreadsheet
         (`C:\Users\sobhy\OneDrive\CircaLog-Daily-Tracker.xlsx`)
       - Column mapping: Date, Bed Time, Sleep Start, Wake Time, Quality,
         Notes, Had Dreams, Interruptions
       - Preview table before confirming import
       - Skips duplicate entries (matched by sleepStartUtc)
       - Requires active Google Sign-In and Supabase sync before import
         is permitted — data must land in Supabase immediately, not only
         in local IndexedDB
       - Runs `assignCycleNumber` across all entries after import completes

### 💡 Insights View

- [x] 🟡 Average sleep duration (rolling 7-day and 30-day)
- [x] 🟡 Average drift per cycle (how many minutes later per cycle)
- [x] 🟡 Longest and shortest sleep sessions
- [x] 🟡 Total sleep sessions logged
- [x] 🟡 Current streak (consecutive days with at least one log)
- [x] 🟢 Free-running period estimate
       - Requires minimum 14 days of data
       - Calculated via linear regression on sleep onset times
       - Show "Pending — log 14+ days to unlock" until threshold is met
       - Display prominently once available
- [ ] 🟢 Predicted next sleep window
       Once the free-running period estimate is available, use it to project
       the next expected sleep onset time forward from the last logged session.
       Display as: "Next predicted sleep onset: ~[date] at [time]" with a
       confidence note ("based on your X-day average cycle of Yh Zm").
       This is arguably the most practically useful output the engine produces
       for the patient's daily planning. Show "Pending" until the free-running
       period threshold is met (same 14-session gate).

### 🔧 PWA & Deployment

- [x] 🔴 Configure Vite PWA plugin (Workbox service worker)
- [x] 🔴 Silent auto-update on new deployments
- [x] 🟡 Verify PWA icons are wired into the manifest (all sizes for Android, iOS, PWA)
       (Icons already generated under `public/images/brand/` — this is configuration verification)
- [x] 🟡 Verify Android splash screen coverage; design branded splash if needed
- [x] 🟡 App installable on Android (add to home screen — verify after icons are wired)
- [x] 🟢 Offline fallback page
- [ ] 🔴 `vercel.json` SPA rewrite rule — redirect all routes to `index.html`
       **Live user-visible bug.** Direct navigation to any `/log/*` route (bookmark,
       browser refresh, shared link) currently returns a Vercel 404.
       Verify this rule is in place and covers all client-side routes including
       `/log/history/:entryId`. This is the highest-priority unchecked V1 item.
- [ ] 🟢 iOS PWA meta tags in `index.html`
       (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`,
       `apple-mobile-web-app-title`) — Safari ignores the web manifest for these;
       they must be set as explicit `<meta>` tags
- [ ] 🟢 `<meta name="theme-color">` in `index.html`
       Controls the browser chrome / status bar color on Android Chrome and iOS Safari.
       Set to the dark background token by default; update when the light theme is active.
- [ ] 🟢 PWA App Manifest shortcuts
       Long-press the home screen icon to expose quick-action shortcuts:
       "In Bed" (opens the timer at Step 1) and "Wake Up" (opens the wake screen).
       Defined in `manifest.json` under the `shortcuts` key.

### 🛟 Data Resilience

> IndexedDB can be evicted by browser storage cleanup. Export/import is
> the safety net before cloud sync arrives in V2 — for a tool tracking
> months or years of personal health data, this is not optional.

- [x] 🔴 Export all data as JSON (manual backup)
       (`src/pages/log/ExportPage.tsx` at route `/log/export`. Drawer "Export"
        button wired to this route. Task: `tasks/CC_TASK_Phase1_DataResilience.md`)
- [x] 🔴 Restore from JSON backup (merge-vs-replace prompt, preview counts)
       (`src/pages/log/RestorePage.tsx` at route `/log/restore`. New "Restore Backup"
        drawer entry added. Task: `tasks/CC_TASK_Phase1_DataResilience.md`)
- [x] 🟡 Schema migration handler (for when the engine model evolves)
       (`src/utils/backupSchema.ts` — `SCHEMA_VERSION = 1` constant +
        `migrateBackup()` with a chain-based `if (version < N)` pattern, so future
        migrations append without restructuring the function.
        Task: `tasks/CC_TASK_Phase1_DataResilience.md`)
- [x] 🟢 Populate `profiles` table in Supabase on first sign-in
       (Confirmed complete 11 Jun 2026 — both accounts present in Supabase:
        `sobhy0101@gmail.com` (Mahmoud Sobhy) and `circalog.app@gmail.com` (CircaLog).
        Current columns: id, email, full_name, created_at, updated_at.
        Schema extension for Doctor Report deferred — see V2 Reports & Export below.)
- [ ] 🟡 Verify backup integrity before applying restore
       Currently the restore flow previews entry counts and prompts merge-vs-replace,
       but does not validate whether the JSON file is structurally valid before
       applying it. Add a pre-restore validation step: check schema version,
       confirm required fields are present on a sample of entries, reject obviously
       malformed files before any data is touched.
- [ ] 🟢 Storage quota warning — monitor `navigator.storage.estimate()`
       Safari aggressively evicts IndexedDB under storage pressure with no warning.
       On app load, check the estimated quota usage. If usage exceeds 70% of the
       estimated quota, display a persistent (non-dismissible) banner prompting the
       user to export a JSON backup immediately. Repeat check on every app open.

### 🐞 App Debugging & Logging

> These items ensure the app fails gracefully, that errors are diagnosable,
> and that the developer has visibility into what the app is doing in
> production. None of these require a third-party service.

- [ ] 🔴 React Error Boundary — wrap the app shell
       If the circadian engine or any component throws an unhandled error, the app
       currently shows a blank white screen with no recovery path. The Error Boundary
       must catch the error, display a calm recovery screen (with a Reload button
       and a way to copy the error message), and prevent the whole app from going dark.
- [ ] 🟢 Structured console logging — define log levels
       Gate `debug` and `info` output behind `import.meta.env.DEV` so they are
       stripped from production builds. `warn` and `error` always emit.
       Establish a consistent format: `[CircaLog][module] message — {context}`.
- [ ] 🟢 Debug mode in Settings (developer-only; hidden unless unlocked)
       Unlock via a tap sequence on the version number or `?debug=true` URL param.
       When active, display: app version, build timestamp, IndexedDB entry counts,
       sync queue depth, last successful sync time.
       Include a manual "Flush sync queue" button and a "Clear all local data" button
       (double-confirmed — this is destructive and irreversible).
- [ ] 🟢 Error reporting to user — on unhandled errors caught by the Error Boundary,
       offer a one-tap "Copy error details" button, so the user can paste into an
       email to `circalog.app@gmail.com`. No third-party service required.
- [ ] 🟢 Production error tracking — evaluate options when real users exist
       Sentry free tier vs. Vercel's built-in error tracking. Defer until the app
       is shared externally and the volume of errors justifies the setup cost.

### Change Log

- [x] 🟢 In-app changelog modal — show on first load after update (UX polish, not a blocker for V1 functionality)
- [x] 🟢 GitHub Release — add a release on GitHub marking the latest version 0.1.0

---

## 🔧 V2 — Enhanced Features

### 🔔 Notifications

- [ ] Request push notification permission (gracefully)
- [ ] Bedtime reminder: configurable lead time (default 30–60 min)
- [ ] Reminder to log sleep after extended wake period
- [ ] Cycle drift alert (configurable threshold)
- [ ] Fragmented sleep flag notification
- [ ] Ensure notifications are free (PWA Web Push — no cost)

### 📤 Reports & Export

> **Architecture decisions — decided 11 Jun 2026:**
>
> **Patient data split (privacy-first):**
> The `profiles` table currently stores only `full_name` and `email`.
> Additional patient details needed for the Doctor Report are split into
> two tiers to avoid GDPR / data minimization risk:
>
> **Tier A — stored in `profiles` (low-risk, already there):**
> - `full_name` ✅
> - `email` ✅
>
> **Tier B — entered in the PDF export dialog only, never persisted to
> IndexedDB or Supabase (ephemeral collection):**
> - Date of birth
> - Phone number (some clinics require it to link records)
> - Treating doctor's name
> - Diagnosis / condition label (e.g. "Non-24-Hour Sleep-Wake Disorder")
> - Report notes (free-text context the patient wants the doctor to see)
>
> Rationale: date of birth, phone number, and health conditions are
> "special category" personal data under GDPR. Ephemeral collection
> (data lives only in browser memory during PDF generation, never written
> to any database) avoids the compliance obligations of storing them:
> no right-to-erasure workflow, no Data Protection Officer threshold risk,
> no breach surface. The user types these fields once per export.
>
> **Optional middle path (decide at build time, not now):**
> A `localStorage`-backed "remember these details" checkbox could let the
> user opt in to having Tier B fields pre-filled on their device only —
> never synced to Supabase. This is acceptable under GDPR because data
> that never leaves the user's own device is not processed by Anthropic
> or by the CircaLog backend. Decide this when building the export dialog.
>
> **`profiles` schema extension:**
> No `profiles` columns need to be added for V2. Tier B fields are
> entered at export time. If the optional localStorage pre-fill is
> implemented, those values live in the browser only and never touch
> Supabase. The `profiles` table requires no migration for Doctor Report.

- [x] Create `/log/reports` route and `ReportsPage` stub — wire "Reports"
       drawer button to this route. Can be a placeholder ("Reports — coming
       soon") until the Doctor Report PDF work begins; the button must not
       remain a dead button in the meantime.
- [ ] Weekly sleep summary (auto-generated)
- [ ] Monthly sleep summary
- [ ] Export as CSV (all fields)
- [ ] Export as PDF (formatted health report)
- [ ] Doctor report: one-tap PDF
       - Actogram chart (rendered to canvas, embedded in PDF)
       - Free-running period (or "Pending" if < 14 days of data)
       - Average cycle length and drift rate
       - Medication compliance summary (once V2 medication log exists)
       - Caffeine intake summary (once V2 drinks log exists)
       - **Export dialog collects Tier B patient details (see above):**
         date of birth, phone number, treating doctor's name,
         diagnosis/condition label, free-text report notes
       - All Tier B fields are optional — report generates without them
       - Tier B fields are never saved to IndexedDB or Supabase
       - Consider optional `localStorage` pre-fill checkbox (decide at
         build time)
- [ ] Web Share API integration
       Allow the user to share a sleep summary or an actogram screenshot via
       the native OS share sheet (WhatsApp, email, messaging apps).
       Use `navigator.share()` with `navigator.canShare()` feature detection;
       fall back to "Copy to clipboard" on unsupported browsers.
       Primary use case: sending informal data to a doctor without generating
       a full PDF report.
- [ ] 🟢 Export & Import hub pages (consolidation — do after PDF, CSV export, and additional import types exist)
       Consolidate drawer entries into two hub pages:
       `/log/export` hub (JSON backup, CSV, PDF, Doctor Report, Verify backup) and
       `/log/import` hub (CSV import, JSON restore, Verify import). Currently, the
       drawer has three separate entries: "Export" → ExportPage (JSON only),
       "Import" → ImportPage (CSV only), "Restore Backup" → RestorePage (JSON only).
       These collapse into two hub entries once there is enough content to justify them.

### 🩺 Health Tracking (Optional Fields)

- [ ] Light exposure field (none / indoor / outdoor / bright)
- [ ] Physical activity level (none / light / moderate / intense)
- [ ] Headache / pain level (0–10 scale)
- [ ] Mood / energy upon waking (1–5 scale)
- [ ] All fields optional, off by default, toggleable in Settings

### ⚙️ Settings Page

- [x] Create `/log/settings` route and `SettingsPage` component
- [x] Wire "Settings" drawer button to `/log/settings`
       (This page is the container for the Caffeine reference table, Medication
        Library, and Meal Library listed in their respective V2 sections below.
        Build the shell now; each sub-section populates it as it is built.)

### ☕ Drinks Log

> Caffeine timing is medically relevant to sleep onset — a coffee at 3 PM
> still has half its stimulant effect at 8–10 PM due to caffeine's ~5–7 hour
> half-life. For Non-24 patients fighting delayed sleep timing, and for any
> patient whose doctor needs accurate context, this is signal, not noise.
>
> Alcohol affects sleep architecture. Protein shakes affect satiety and
> indirectly sleep quality. Juice can carry sugar load and sometimes caffeine.
> Water intake is relevant for hydration and, for patients with conditions
> affecting nocturia (e.g. enlarged prostate), can correlate with sleep
> fragmentation patterns.
>
> The goal is to give a sleep specialist a complete picture — not just the
> sleep log, but the context surrounding it.

- [ ] Drinks log — data model (`DrinkLogEntry` in `src/lib/circadian/types.ts`)
       - Date (DD/MM/YYYY)
       - Time (HH:MM)
       - Drink type: Coffee / Tea / Energy Drink / Protein Shake / Juice /
         Alcohol / Water / Other
       - Caffeine estimate: auto-calculated from drink type; manual override
         available
       - Size: Small / Regular / Large / Custom (oz and ml input)
- [ ] Settings — Caffeine reference table
       (default mg values per drink type per size; user-editable)
- [ ] IndexedDB store: `drink_log_entries`
- [ ] Supabase table: `drink_log_entries`
- [ ] Quick-entry UX for water (high logging frequency — needs low friction)
- [ ] Insights — caffeine curve overlay
       - Optional overlay on the actogram or timeline view
       - Shows estimated active caffeine level across the day
       - Calculated from logged drinks using standard ~5–7 hour half-life model
- [ ] Doctor report integration (V2 reports task)
       - Include caffeine intake summary in the one-tap PDF
       - Correlate drink timing with sleep onset latency where data permits

### 💊 Medication & Meal Log

> Designed around the Non-24 reality: clock-based medication schedules
> break when your sleep cycle rotates. A patient who wakes at 5 PM has
> already missed two anchor points and must reason about food gaps, sleep
> gaps, and the next valid window simultaneously.
>
> The model uses four linked tables/stores: a one-time-configured
> **medication library** and **meal library**, plus a daily
> **dose log** and **meal log**. On the logging screen the user taps
> from a pre-populated list — no typing drug names on a phone.
>
> Full TypeScript types are in `src/lib/circadian/types.ts`:
> `MedicationDefinition`, `MealDefinition`, `DoseLogEntry`, `MealLogEntry`.
> Supabase tables and IndexedDB stores share the same four names.

- [ ] Settings — Medication Library screen
       - Add / edit / deactivate medications
       - Fields: name, scheduled times (multi-value HH:MM), window ± minutes
       - Food relationship: `with_food` | `after_food` | `before_food` | `independent`
       - Food gap (minutes before/after eating)
       - Min gap before sleep onset (minutes)
       - Missed-dose policy: `skip` | `take_late` | `ask`
       - `isActive` toggle (retire without losing history)
- [ ] Settings — Meal Library screen
       - Add / edit / deactivate meal slots (e.g. "Breakfast", "Lunch", "Dinner")
       - Optional typical clock-time hint per slot (UI hint only — never used
         for compliance calculations because Non-24 makes fixed meal times
         irrelevant)
- [ ] Daily dose log — auto-generation
       - Create a `DoseLogEntry` row (status: `missed`) for every scheduled
         dose at the start of each day; update to `taken`/`skipped` on user
         action
       - This produces a compliance record, not just a list of taken doses
- [ ] Daily meal log — quick entry
       - User picks a `MealDefinition` from their library and records actual
         eat time; the engine uses this as the food anchor for dose
         compliance checks
- [ ] GERD safety window — "Safe to Sleep After" indicator
       Doctor's order: minimum 4 hours between last meal and sleep start.
       After a meal is logged, surface a live status showing: time elapsed
       since last meal, time remaining until the window opens, and a
       red/yellow/green indicator (red = < 2h, yellow = 2–4h, green = ≥ 4h).
       This mirrors the spreadsheet dashboard logic and is one of the most
       practically urgent features for this patient's daily routine.
       Surface on: the Log screen (when the user initiates sleep logging),
       the Insights view, and optionally as a push notification
       (tie into the Notifications section above when it is built).
- [ ] Logging screen integration
       - When waking, show a pre-populated list of today's due/overdue doses
       - Tap a medication → enter actual time taken (or mark skipped)
       - Optional free-text note per dose
       - Meal log entry accessible from the same screen
- [ ] Insights — compliance view
       - Taken / missed / skipped counts per medication over 7-day and 30-day
         windows
       - Highlight doses taken outside their food-gap rule (warning, not
         blocking)
       - Link dose compliance data to sleep quality correlation
- [ ] Doctor report integration (V2 reports task)
       - Include medication compliance summary in the one-tap PDF
       - Show which doses were missed, when, and against which scheduled time

### 📚 Educational Resources

- [x] "About CircaLog" page at `/log/about` — wire "About" drawer button
       (App version, open-source attribution, contact/support link.
        Distinct from the "About Non-24" educational content below.)
- [x] "About Non-24" section in side drawer
- [ ] Brief explanation of Non-24, free-running period, actograms
- [ ] Curated links to reputable resources (NIH, Sleep Foundation, etc.)

### 📖 Help & Onboarding

> New users — including the patient themselves returning after a long break —
> need orientation. The actogram, cycle numbers, and free-running period are
> not self-explanatory. This section ensures the app can be understood
> without reading documentation.

- [ ] 🟡 First-use onboarding flow — display on first launch when the database is empty
       - Medical disclaimer acceptance gate (see Policies below) — user must
         acknowledge the disclaimer before the onboarding flow proceeds.
         Store acceptance flag in `localStorage` alongside the onboarding-seen flag.
       - What CircaLog tracks and why
       - What a cycle number is (not a calendar day)
       - Why the actogram drifts diagonally
       - A brief walkthrough of the four tabs (Log / Chart / History / Insights)
       - Dismissible and skippable after disclaimer is acknowledged; re-accessible
         from the Help page
       - Must not appear again after dismissal (store a flag in `localStorage`)
- [ ] 🟢 In-app Help page at `/log/help` — wire a "Help" drawer button
       - FAQ: "How do I log a sleep session?", "What is the 'In Bed' button for?",
         "What is a cycle number?", "Why does my free-running period say Pending?",
         "How do I export my data?", "What does the actogram show?"
       - Link back to the first-use onboarding flow ("Show intro again")
- [ ] 🟢 Contextual "?" tooltips on complex UI elements
       - Free-running period label in Insights
       - Drift rate label in Insights
       - Predicted next sleep window in Insights
       - Cycle number badge on entry cards
       - Actogram axes labels
       - Sleep Onset Latency display on the timer screen
       Tapping a "?" opens a one-sentence explanation in a small popover.
       No modal — the explanation must be readable inline without losing context.
- [ ] 🟢 Glossary page (or collapsible section within Help)
       Definitions: Non-24, free-running period, circadian cycle, actogram,
       sleep onset latency, drift rate, nap vs. main sleep.

### 😴 Sleep Debt Tracker

- [ ] User-configurable sleep target (default: 8 hours)
- [ ] Display cumulative sleep debt / surplus
- [ ] Note in UI that Non-24 makes standard targets approximate

### 📃 Policies

- [x] Privacy Policy page — decide: internal route `/log/privacy` or external
       hosted URL; then wire the "Privacy Policy" drawer button accordingly
- [ ] Create the content of the Privacy Policy — must be done before sharing the app externally
       Key points to cover:
       - Data collection: what data is collected (sleep entries, drink logs, dose logs, etc.), how it is stored (IndexedDB + Supabase), and that Tier B patient details for the Doctor Report are never stored.
       - Data use: how the data is used (personal logging, PDF generation), and that it is not sold or shared with third parties.
       - User rights: how users can export their data, delete their account, and contact support.
       - Security measures: encryption in transit, RLS policies, input sanitization.
       - Contact information: how to reach out with questions or concerns about privacy.
- [x] Terms & Conditions page — same decision; wire the "Terms & Conditions"
       drawer button
- [ ] Create the content of the Terms & Conditions — must be done before sharing the app externally
       Key points to cover:
       - User responsibilities: providing accurate data, not sharing accounts, etc.
       - App limitations: CircaLog is a personal logging tool, not a medical device; it does not provide medical advice or diagnosis.
       - Liability disclaimer: users use the app at their own risk; the developers are not liable for any consequences of using the app.
       - Intellectual property: ownership of the app and its content, user-generated content policies if applicable.
       - Changes to terms: how users will be notified of changes to the terms and conditions.
- [ ] Medical disclaimer — display on first use and in the About page
       "CircaLog is not a medical device and does not provide medical advice.
       It is a personal logging tool. Always consult a qualified healthcare
       provider for diagnosis and treatment decisions."
       Must appear: (1) as an acceptance gate in the onboarding flow (see Help
       & Onboarding above — the two items are explicitly linked), (2) in the
       About page, (3) referenced in the Terms & Conditions.
       Required before sharing the app with anyone beyond the developer.
- [ ] Account deletion — GDPR right to erasure
       User-initiated: delete Supabase auth record, delete all rows across
       all Supabase tables belonging to the user, clear local IndexedDB.
       Requires double confirmation ("This cannot be undone").
       Surface in Settings under a clearly labelled "Danger Zone" section.
- [ ] Cookie Policy page (if applicable — only if using cookies beyond what's needed for basic auth/session management)
- [ ] Data Retention Policy page (if applicable — only if storing user data beyond what's needed for core functionality, which is unlikely given the current IndexedDB + Supabase model)
- [ ] Accessibility Statement page
- [ ] Open Source License page (if any third-party libraries with specific licenses are used beyond MIT)

---

## 🌍 V3 — Public Launch

### 🌐 Domain & Infrastructure

- [ ] Purchase `circalog.app` domain
       Prerequisite for: full marketing page, Play Store listing URL, Google Search
       Console real-domain property. Purchase only when the app is otherwise ready for public launch.

### 🔍 SEO & Discoverability

> CircaLog has two categories of publicly indexable content: the landing
> page at `/`, and the public app pages (`/log/about`, `/log/help`,
> `/log/educational-resources`, `/log/privacy`, `/log/terms`, etc.).
> Private app routes — Log, Chart, History, Insights, Settings, Export,
> Import — must not appear in search results; they are personal screens
> with no public content. The goal here is that when CircaLog is shared
> or searched, it presents correctly: in Google results, in link previews
> on WhatsApp/X/LinkedIn, and in browser/OS UI chrome.

- [ ] 🟢 `<meta name="description">` — describe CircaLog as an app, ≤160 characters
       (this tag lives in `index.html` and applies to all routes in the SPA;
       write it to describe the app itself, not the landing page specifically)
- [ ] 🟢 Open Graph meta tags in `index.html`
       (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
       — controls link preview appearance on WhatsApp, X, LinkedIn, iMessage, etc.
- [ ] 🟢 Twitter Card meta tags in `index.html`
       (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- [ ] 🟢 Social preview image — design and export a 1200×630 px OG image
       (`public/images/brand/og-image.png`); reference it in both OG and Twitter tags
- [ ] 🟢 `robots.txt` — allow crawling of `/` and public app pages
       (`/log/about`, `/log/help`, `/log/educational-resources`, `/log/privacy`,
       `/log/terms`, etc.); disallow all other `/log/*` routes (Chart, History,
       Insights, Settings, Export, Import have no indexable content)
- [ ] 🟢 `sitemap.xml` — list all publicly indexable URLs: the landing page at `/`
       and the public app pages (`/log/about`, `/log/help`,
       `/log/educational-resources`, `/log/privacy`, `/log/terms`, etc.);
       submit to Google Search Console
- [ ] 🟢 Google Search Console — add property for `circalog.app`, verify ownership,
       submit sitemap. Set up only after the domain is purchased — GSC properties
       are domain-specific and data does not transfer; setting up under
       `circalog.vercel.app` produces data that is permanently abandoned when
       the real domain goes live.
- [ ] 🟢 Security headers in `vercel.json`
       (`Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy`,
       `Permissions-Policy`, `X-Content-Type-Options: nosniff`)
       — important for a health app; prevents clickjacking and data leakage
- [ ] ⚪ Google Analytics (GA4) — **UNDETERMINED**
       Dedicated planning session required before implementation.
       Vercel Analytics already provides page views and web vitals.
       GA4 adds funnel analysis and audience data but introduces GDPR obligations
       (cookie consent banner, privacy policy update, data processing agreement).
       Do not implement until the tradeoffs have been evaluated in full.

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

### ⌚ Wearable Integration

> Automatic sleep detection from a wearable eliminates manual logging
> friction and produces more accurate onset/offset times than self-report.
> Samsung Galaxy Watch 7/8 and Garmin Venu 3 are the recommended targets
> based on their sleep data export compatibility.
>
> This is V3 scope — the manual logging and CSV import paths in V1/V2 are
> the foundation. Wearable import supplements them; it does not replace them.
> Patients without a compatible device must always have a fully functional
> manual path.

- [ ] Research and decide on the integration approach
       Options: Samsung Health export file (JSON/CSV), Garmin Connect IQ data export,
       Google Fit API, or a direct Bluetooth/SDK path. Evaluate data availability,
       export granularity (onset time, wake time, duration, sleep stages if available),
       and whether the integration requires a companion app or can run entirely in-browser.
- [ ] Map wearable sleep session fields to `SleepEntry` — decide what to autofill
       vs. what to prompt the user to confirm (quality rating cannot come from the
       wearable; the user must still rate each session)
- [ ] Build wearable import UI — similar to the CSV import flow:
       connect / authorize, preview mapped sessions, confirm, import
- [ ] Handle conflicts between manually-logged entries and wearable entries
       for the same time window (merge vs. prefer-wearable vs. prefer-manual)
- [ ] Supabase table / IndexedDB store extension if wearable-specific fields
       (e.g., sleep stages, HRV, SpO₂) need to be stored beyond the core `SleepEntry`

### Marketing

- [ ] Full marketing landing page at `circalog.app`
- [ ] App moves to `circalog.app/log` (already planned)
- [ ] Screenshots, feature highlights, testimonials

---

## ⚡ Performance

> Do this phase after all V1/V2/V3 feature development is complete, and the
> UI is stable. Premature optimization causes rework — especially font pruning,
> which breaks typography if done before all weights are finalized.
>
> The Lighthouse audit in "Ongoing / Always" is a quick health check to run
> throughout development. This section is the deep optimization pass done once,
> before public launch.

### 🔤 Fonts

- [ ] Font weight pruning (deferred from initial font integration)
       Both Exo 2 and Inter are currently loaded with their full variable axis.
       Once the UI is fully stable, audit every used weight across the codebase,
       then prune the Google Fonts URL to only those weights
       (e.g., Inter 400, 500, 600; Exo 2 600, 700).
       Reduces the font payload on slow connections.
       Do not do this before the UI design is settled — premature pruning breaks typography.

### 📦 Bundle

- [ ] Bundle size audit — run `rollup-plugin-visualizer` (or equivalent) on the
       production build to map the size of every dependency.
       Confirm Recharts, Dexie, and the circadian engine are the expected
       top contributors. Flag any unexpectedly large transitive dependency.
- [ ] Code splitting — lazy-load every route except the Log tab.
       The Log tab is the first screen authenticated users see; everything else
       (Chart, History, Insights, Import, Export, Settings, Reports, etc.) can
       load on demand via `React.lazy()` and `Suspense`.
       Goal: the initial JS bundle should contain only what is needed to render
       the Log tab. Verify with the bundle visualizer after implementing.

### 🎨 Rendering

- [ ] Actogram performance with 500+ entries
       The actogram renders one `ReferenceArea` per sleep block in the DOM.
       At 500+ entries this can produce significant layout and paint work on
       low-end Android devices. Steps:
       - First, filter the visible blocks to only those in the active time range
         before passing them to Recharts (currently all blocks are passed, then
         clipped by the chart domain — this is wasteful).
       - Profile on a real Android device after that fix. If frame drops persist,
         evaluate a canvas-based renderer as a fallback for large datasets.
- [ ] History View virtualization
       The History list currently renders all entries in the DOM at once.
       With large datasets this degrades scroll performance and initial paint time.
       Evaluate `react-window` or a simpler pagination approach.
       Trigger: investigate if scroll performance degrades at 300+ entries.

### 🗄️ IndexedDB

- [ ] Profile IndexedDB reads under large datasets
       Most queries use `getAll()`, which loads the full dataset into memory
       on every operation. With 500+ entries, this is the most likely source
       of perceived sluggishness outside the actogram.
       Investigate:
       - Adding Dexie indexes for the most common read patterns
         (entries by date range, entries by session type)
       - Paginating the History View query instead of loading all entries at once
         (links with the virtualization task above)

### 📊 Core Web Vitals

- [ ] Measure and address Core Web Vitals on a real device
       - LCP: target under 2.5 s on mid-range Android
       - INP: target under 200 ms for all taps
       - CLS: target under 0.1; watch for shift from font-swap during load
         and from lazy-loaded images

---

## 🧪 Testing

> Structured pre-launch testing strategy. The Phase 0.5 Vitest suite covers
> the circadian engine. This section covers everything else across all layers.
>
> Items are ordered bottom-up: unit tests first, then integration, then
> end-to-end, then cross-device and stress. Each layer catches different
> bugs; none replaces the others.

### Unit Tests (Vitest)

- [ ] Hook coverage: `useSleepLog`, `useAuth`, `useSyncStatus`, `useTheme`
       Each hook has distinct state machines and side effects. Test each using
       Vitest + React Testing Library `renderHook`, covering all transitions
       (e.g. `useSleepLog`: no session → in-bed → sleeping → complete → saved).
- [ ] Utility coverage: `csvParser`, `migrateBackup` (schema migration chain),
       timezone helpers (`normalizeSleepSpan`, `utcToLocalDate`)
       The CSV parser already has known edge cases that caused production bugs
       (month-name dates, "Had Dreams" column variants, midnight crossover).
       These must have test cases — not just the happy path.
- [ ] IndexedDB service: `createEntry`, `updateEntry`, `deleteEntry`, `getAllEntries`
       Use `fake-indexeddb` to run these tests without a real browser.
       Verify that `assignCycleNumber` runs after every write and produces
       the correct sequence — including after back-fills and deletes.

### Integration Tests

- [ ] Sync service round-trip
       Write an entry to IndexedDB, flush the sync queue to Supabase, read the
       entry back from Supabase, and verify all fields match.
       Requires either a dedicated test Supabase project or a Supabase client
       mock that intercepts the database call and returns a realistic response.
- [ ] CSV import pipeline: parse → preview → confirm → verify entries in IndexedDB
       Test the full path including duplicate detection (re-importing the same
       file twice must not create duplicates) and cycle number assignment.
- [ ] JSON backup round-trip: export → restore Merge → restore Replace
       Verify entry counts and field values after each restore mode.
       Also test `migrateBackup()` with a synthetic backup at
       `SCHEMA_VERSION = 0` (or any version below current) to confirm the
       migration chain upgrades it correctly before restore.

### End-to-End Tests (Playwright)

- [ ] Timer flow: "In Bed" → "Going to Sleep" → "Wake Up" → verify in History
       Confirm the saved entry has the correct `bedTimeUtc`, `sleepStartUtc`,
       `wakeUtc`, and that Sleep Onset Latency is non-zero.
- [ ] Manual back-fill: open form → fill Bed Time + Sleep Start + Wake + Quality → save
       Verify the entry appears in History under the correct calendar date and
       cycle number.
- [ ] Edit an existing entry and verify cycle numbers recompute across all
       affected entries.
- [ ] Delete an entry and verify cycle numbers close the gap correctly.
- [ ] Export JSON → clear all data → restore JSON (Replace mode)
       Verify all entries are present, and field values match the original export.
- [ ] Sign in with Google → verify sync pill transitions to "Synced"
       → sign out → verify sync pill returns to unsigned-out state.

### Cross-Device Testing

- [ ] Android — Chrome PWA
       Install to home screen, verify PWA icons, test the complete timer flow,
       verify the sync pill, test offline mode (airplane mode during a session).
- [ ] iOS — Safari PWA
       Add to home screen, verify `apple-mobile-web-app-*` meta tags take
       effect (status bar style, title). Test the timer flow and offline mode.
       Safari is the most restrictive PWA environment and the most likely to
       surface edge cases in IndexedDB and service worker behavior.
- [ ] Desktop — Chrome, Firefox, Edge
       Verify keyboard navigation (Tab order through all interactive elements,
       Enter to submit forms, Escape to close drawer/modals).
       Verify the app layout holds at wide viewport widths without breaking.

### Stress Testing

- [ ] Seed the database with 500+ entries and verify:
       - Actogram renders and scrolls without frame drops on a mid-range Android device
       - History View filters and sorts without perceptible lag (< 300 ms)
       - Insights calculations (drift, rolling averages, free-running period)
         complete in under 500 ms
       - JSON export produces a valid file and completes without timing out
       - Cycle number recomputation after a bulk delete completes in under 1 s
       Use the existing Vitest fixture generators to seed the data programmatically.

### Offline Mode Testing

- [ ] Verify all core flows work with no network connection
       - Start Sleep / Wake Up flow saves to IndexedDB with no errors
       - History, Chart, and Insights load from local data only
       - Sync pill shows the "Offline" state, not "Synced" or "Pending"
       - Attempting to sign in while offline shows a clear error, not a blank state
       - No unhandled Promise rejections in the console during offline use

---

### Open Source

- [ ] Review codebase for any private/sensitive data
- [ ] Write `CONTRIBUTING.md`
- [ ] Write `CODE_OF_CONDUCT.md`
- [ ] Tag V1.0.0 release on GitHub
- [ ] Publish as public repository

### 🏪 Play Store

> Bubblewrap wraps the CircaLog PWA into a Trusted Web Activity (TWA) for
> distribution via the Google Play Store. One-time setup; no ongoing maintenance
> beyond keeping the app URL and asset links file in sync.

- [ ] Set up Bubblewrap (one-time local tool setup; requires Node.js + Java JDK)
- [ ] Configure TWA: package name, app title, theme color, launch URL (`circalog.app/log`)
- [ ] Generate Android APK / AAB (Android App Bundle)
- [ ] Create Google Play Developer account (one-time $25 USD registration fee)
- [ ] Write Play Store listing: title, short description, full description,
       screenshots (at least 2), feature graphic, content rating, privacy policy URL
- [ ] Verify Digital Asset Links (`/.well-known/assetlinks.json` on `circalog.app`)
       — required for the TWA to launch without a browser address bar
- [ ] Submit app bundle for Google Play review
- [ ] Publish to Play Store

---

## 🐛 Ongoing / Always

- [ ] Extend unit test coverage beyond the Phase 0.5 Circadian Engine
       (UI components, IndexedDB service, integration flows)
- [ ] CI/CD pipeline — GitHub Actions test gate on every push to `main`
       Currently, Vercel deploys on every push regardless of test results.
       A failing Vitest run can ship to production with no warning.
       **Priority has increased** since cloud sync is now live — a broken
       sync write or circadian engine error shipping to production risks
       data integrity for a real patient's health records.
       Add a GitHub Actions workflow that runs `npm run test` (Vitest) and
       blocks the deployment if any test fails. Target milestone: before the
       first external user is given access to the app.
- [ ] Test on Android (Chrome PWA)
- [ ] Test on iOS (Safari PWA — limited but functional)
- [ ] Test on PC (Chrome, Firefox, Edge)
- [ ] Accessibility audit (contrast, font sizes, tap targets) — do after
       the Accessibility Implementation section above is complete, not instead of it
- [ ] Performance audit (Lighthouse PWA score target: 95+)
- [ ] Keep dependencies updated
- [ ] Update changelog with every meaningful release
