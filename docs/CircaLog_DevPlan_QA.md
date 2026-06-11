<!-- Markdown ignore - MD0032 -->

# 🌙 CircaLog — Development Planning Q&A

**Sleep Tracking PWA for Non-24-Hour Sleep-Wake Disorder, any circadian rhythm disorder or sleep disorder**
*Answer each question to help shape the app's architecture, features, and experience.*

---

## 🧭 SECTION 1: Core Purpose & Scope

---

**Q1. What is the single most important thing CircaLog should do for you every day?**

- A) Log sleep and wake times as quickly as possible
- B) Visualize how my sleep cycle is drifting over time
- C) Alert me when my cycle has shifted by a significant amount
- D) Help me communicate my condition to doctors with data exports
- E) All of the above equally

Answer: E. All of the above equally.

---

**Q2. Who is the primary intended user of CircaLog?**

- A) Only me (personal tool, private use)
- B) Me now, but potentially other Non-24 patients in the future
- C) Me, but I want a caregiver/spouse to also have access
- D) Eventually a public product for sleep disorder patients broadly

Answer: Build for myself first (A), but architect it as if B+C+D are coming in future phases.

---

**Q3. What is the minimum viable version you want working first?**

- A) Just the sleep log: start time, end time, quality rating
- B) Log + a basic drift chart showing the shift over weeks
- C) Log + chart + push notifications for reminders
- D) Full-featured app from day one (log, charts, reminders, export)

Answer: A and B.

---

**Q4. Should CircaLog eventually become a product you could share or monetize?**

- A) No, this is purely a personal health tool
- B) Maybe later, but that's not a priority now
- C) Yes — I want to design it with a public launch in mind
- D) Yes, and I'd like to integrate it with Pals Tours' tech stack or Auto Machina somehow

Answer: C.

---

## 📱 SECTION 2: Platform & Technical Foundation

---

**Q5. Which devices will you use CircaLog on most?**

- A) Primarily my phone (Android)
- B) Primarily my PC / laptop
- C) Both phone and PC equally
- D) Phone mostly, PC for data review

Answer: D.

---

**Q6. How important is offline-first functionality to you?**

- A) Critical — I must be able to log sleep with zero internet
- B) Important, but occasional offline is fine
- C) Nice to have, but I'm usually online
- D) Not important at all

Answer: C.

---

**Q7. Where should CircaLog's data be stored?**

- A) Locally on-device only (most private)
- B) Synced to my Google Drive (you already have 2TB)
- C) A cloud database (e.g., Supabase, Firebase)
- D) Hybrid: local first, background sync to cloud
- E) I want to self-host a backend on my Ubuntu VM (10.0.0.12)

Answer: D, with a preference for local-first and if there is internet connection we sync to Supabase later.

---

**Q8. Should CircaLog have a backend server at all in V1?**

- A) No — pure client-side PWA, no server
- B) Yes — a lightweight Node/Express or Python API
- C) Yes — serverless functions (e.g., Vercel Functions, Cloudflare Workers)
- D) Undecided — depends on features needed

Answer: C, with Vercel Functions at first then maybe Cloudflare Workers for the better long-term choice if I ever go public.

---

**Q9. What technology stack are you most comfortable maintaining?**

- A) HTML + CSS + Vanilla JS (no framework)
- B) React (you use VS Code, comfortable with modern JS)
- C) Vue.js
- D) Any — I'll learn what the project needs
- E) I want to minimize code complexity; simplest stack wins

Answer: React + Vite + TailwindCSS + Recharts.

---

**Q10. Which database/storage option feels right for your needs?**

- A) IndexedDB (browser-native, offline, no server)
- B) SQLite via a local backend
- C) Supabase (Postgres in the cloud, you're already connected)
- D) Firebase Firestore
- E) JSON files synced to Google Drive

Answer: C, with a local IndexedDB fallback for offline use.

---

## 🌙 SECTION 3: Sleep Logging Experience

---

**Q11. How would you prefer to log a sleep session?**

- A) Tap "Start Sleep" when going to bed, tap "Wake Up" in the morning
- B) Enter both times manually after waking up
- C) Either method — I want both options
- D) Voice input or a widget shortcut outside the app

Answer: C.

---

**Q12. What data should be required for each sleep log entry?**

- A) Sleep start time and wake time only (minimum)
- B) Start, wake, and a quality rating (1–5 stars or emoji)
- C) Start, wake, quality, and a short notes field
- D) Start, wake, quality, notes, medication taken (yes/no), light exposure level
- E) I want to customize which fields I track

Answer: B are the required fields, with the following optional fields:

- Notes
- Dreams/Nightmares
- Interruptions (bathroom / thirst / hunger / pain / other)
- Medication taken | Before, during, after sleep (yes/no)

---

**Q13. How should CircaLog handle "naps" vs. "main sleep"?**

- A) Treat all sleep equally; no distinction needed
- B) Tag each entry as Main Sleep or Nap
- C) Automatically detect naps based on duration (e.g., < 3 hours = nap)
- D) I don't nap — ignore this distinction

Answer: C.

---

**Q14. Should the app support logging past sleep sessions (back-filling)?**

- A) Yes, I want to enter data going back weeks or months
- B) Yes, but only a few days back is enough
- C) No — only real-time or same-day entries
- D) I want to import data from another app (Apple Health, Google Fit, etc.)

Answer: A, with the ability to import from other health apps later if possible.

---

### 📥 Supplementary: CSV Import Architecture

*Decided 08 Jun 2026 — built to migrate real patient data from the
CircaLog Daily Tracker spreadsheet into the app before medication and
food logging features are complete.*

**The case for CSV import**

The CircaLog Daily Tracker spreadsheet (`CircaLog-Daily-Tracker.xlsx`)
was used as a bridge logging tool while V1 was in development. It
captures sleep, medication, and food data together. When the app reaches
a usable state, the sleep log data needs to be migrated in without manual
re-entry. Import also serves future users who may be arriving from other
CSV-exporting sleep trackers.

**Route and entry point**

- Route: `/log/import` (full page inside AppShell, bottom tab bar visible)
- Entry: Side Drawer → More → Import (visible to all users regardless of
  sign-in state)
- Sign-in gate: the Import page itself shows `GoogleSignInButton` when the
  user is not signed in. Import requires an active connection and a signed-in
  account because all imported entries are synced to Supabase immediately.

**New files created**

| File | Purpose |
|---|---|
| `src/utils/csvParser.ts` | Pure TypeScript parser — no React, no side effects. Takes PapaParse row objects and returns `ParsedRow[]` (ok or error per row). |
| `src/hooks/useImport.ts` | React state machine for the import flow. Manages gate checks, row-by-row processing, progress, and result. |
| `src/pages/log/ImportPage.tsx` | Full-page UI component. Four phases: idle (file picker), parsed (preview table), importing (progress), done (result). |

**Modified files**

| File | Change |
|---|---|
| `src/lib/supabase/syncService.ts` | Added `checkSupabaseReachable()` — lightweight connectivity check used by the import gate. |
| `src/App.tsx` | Added `/log/import` route inside the `/log` block. |
| `src/components/layout/SideDrawer.tsx` | Added Import entry in the More section. |

**CSV format expected**

Exported from the CircaLog Daily Tracker spreadsheet via the prompt in
`docs/CircaLog-Daily-Tracker-Spreadsheet.md`. Column headers:

`Date`, `Bed Time`, `Sleep Start`, `Wake Time`, `Sleep Onset Latency`,
`Sleep Duration`, `Time in Bed`, `Session Type`, `Quality`, `Had Dreams?`,
`Dream Notes`, `Interruptions`, `Notes`, `Cycle Number`

- Date format: `DD-MM-YYYY`
- Time format: `HH:MM` (24-hour)
- Parsed by PapaParse (`papaparse@5.5.3`) with `header: true`

**Midnight crossover logic**

1. If `Sleep Start` time < `Bed Time` (lexicographic HH:MM comparison),
   sleep start date = `Date` + 1 day.
2. If `Wake Time` < `Sleep Start` time, wake date = sleep start date + 1 day.

This correctly handles sessions that begin after midnight, sessions that
span two calendar days, and sessions that span three calendar days.

**Interruption mapping**

Free-text interruption values are mapped to structured `Interruption[]`
objects rather than appended to `notes`, so they remain queryable for
future Insights features:

| Raw value | Maps to |
|---|---|
| Empty / `"N/A"` / `"none"` | `undefined` |
| Contains `pee`, `peed`, `bathroom`, `toilet`, `loo` | `{ type: 'bathroom', note: originalText }` |
| Anything else | `{ type: 'other', note: originalText }` |

The original text is always preserved in `note`. See
`docs/SleepEntry-Field-Guide.md` for the full entry guide.

**Pre-import gate (three checks, in order)**

1. `navigator.onLine` — must be true
2. `checkSupabaseReachable()` — lightweight Supabase query must succeed
3. User must be signed in (`user !== null`)

If any check fails, the gate error is displayed with a Retry button.
Import does not proceed until all three pass.

**Duplicate detection**

Before calling `createEntry()` for a row, `useImport` checks whether an
entry with the same `sleepStartUtc` already exists in IndexedDB. If it
does, the row is skipped and counted as a duplicate. Re-importing the same
file is always safe.

**Post-import sync**

After all rows are processed, `flushQueue()` is called once to push any
entries that ended up in the sync queue. If the flush fails, the result
screen shows a `SYNC_ERR_503` message with the support email address. The
data is always saved to IndexedDB regardless of sync outcome.

**Navigation safety**

Navigating away mid-import shows a confirmation dialog ("Leaving now will
stop the import. Any sessions already processed will be kept."). The user
can stay or leave. Partially completed imports are safe to retry because
duplicates are skipped.

**Return path after sign-in**

`GoogleSignInButton` on ImportPage passes `returnPath="/log/import"` to
`signInWithGoogle()`. The path is written to `sessionStorage` before the
OAuth redirect (which destroys React state) and consumed on the
`SIGNED_IN` event in `useAuth`, navigating back to `/log/import`
automatically. See Implementation Notes in `README.md` for the full
mechanism.

---

### 🔒 Supplementary: JSON Backup Export / Restore Architecture

*Decided 11 Jun 2026 — Data Resilience Phase 1. Implements the offline
safety net before Supabase sync is available to all users.*

**Why JSON backup is needed**

IndexedDB can be silently evicted by the browser — during low-disk
cleanup, when the user clears site data, or after a browser reinstall.
For a patient tracking months or years of data, this is a real risk.
Supabase sync is the long-term answer but requires Google Sign-In.
JSON export/restore is the signed-out safety net that works for every
user regardless of auth state.

**Route and entry points**

- `/log/export` — JSON backup download page (Side Drawer → "Export")
- `/log/restore` — JSON backup restore page (Side Drawer → "Restore Backup")
- Both pages are accessible without sign-in

**New files created**

| File | Purpose |
|---|---|
| `src/utils/backupSchema.ts` | `SCHEMA_VERSION = 1` constant, `CircaLogBackup` type, `migrateBackup()` function |
| `src/hooks/useExport.ts` | React hook — reads all active IDB entries, serialises to JSON, triggers browser download |
| `src/hooks/useRestore.ts` | React hook — 5-phase state machine for the restore flow |
| `src/pages/log/ExportPage.tsx` | Export UI — entry count on mount, download button, success/error feedback |
| `src/pages/log/RestorePage.tsx` | Restore UI — all 5 phases rendered |

**Modified files**

| File | Change |
|---|---|
| `src/lib/db/db.ts` | Dexie schema bumped to version 3 (no store changes; housekeeping) |
| `src/App.tsx` | Added `/log/export` and `/log/restore` routes |
| `src/components/layout/SideDrawer.tsx` | Existing "Export" button wired; "Restore Backup" entry added after "Import" |

**Backup file format**

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-06-11T14:23:00.000Z",
  "appVersion": "0.0.0",
  "entryCount": 42,
  "entries": [ ...SleepEntry objects... ]
}
```

- Only **active** entries are exported — soft-deleted entries are
  intentionally excluded (the user deleted them; restoring them would
  be surprising and wrong).
- Filename pattern: `circalog-backup-YYYY-MM-DD.json`. The `sv`
  (Swedish) locale is used with `toLocaleDateString('sv')` because it
  always produces `YYYY-MM-DD` regardless of the device's locale
  settings — the most portable way to get ISO-style local dates.

**Restore state machine**

```txt
idle → parsing → previewing → restoring → done
                                        ↘ error (any phase)
```

- **parsing** — `file.text()` → `JSON.parse` → `migrateBackup()`
- **previewing** — shows `entryCount`, `newCount`, `duplicateCount`
  (duplicates matched by `id`); user chooses Merge or Replace
- **restoring** — writes to IDB and renumbers cycle numbers
- **done** — shows `restoredCount`; button to View sleep history

**Merge vs Replace**

- **Merge** — `bulkPut` only entries whose `id` is not already in IDB.
  Existing data is untouched. `restoredCount = newCount`.
- **Replace** — fetches all IDB entries (including soft-deleted) via
  `db.sleepEntries.toArray()`, calls `hardDeleteEntry(id, null)` for
  each (Supabase step skipped when user is null), then `bulkPut` all
  backup entries. `restoredCount = backup.entries.length`.

Both modes end with a full `assignCycleNumber` pass over all IDB
entries to ensure cycle numbers are correct after the mutation.

**Why `bulkPut` instead of `createEntry`**

`createEntry` generates a new `crypto.randomUUID()` for each entry,
which would lose the original `id` values. Preserving ids is essential
for duplicate detection on future restores and for Supabase sync
correctness (the server uses `id` as the primary key). Direct
`db.sleepEntries.bulkPut()` is the correct tool here.

**Schema migration handler**

`migrateBackup(raw: unknown): CircaLogBackup` in `backupSchema.ts`:

- Validates the basic shape (object, `schemaVersion` number, `entries`
  array) and throws descriptive errors on invalid input.
- If `schemaVersion > SCHEMA_VERSION`, throws — user must update the
  app before restoring a newer backup.
- If `schemaVersion === SCHEMA_VERSION`, returns the backup with
  `entryCount` patched to `entries.length` (trust the array, not the
  stored count).
- If `schemaVersion < SCHEMA_VERSION`, runs a chain of `if (version < N)`
  blocks to patch the data forward. Currently empty — `SCHEMA_VERSION`
  starts at 1, so no prior version exists. Future migrations are appended
  as new `if` blocks without restructuring the function.

**Two-version-counter design**

The Dexie version number and `SCHEMA_VERSION` are separate counters that
track different things:

- **Dexie version** — IndexedDB store structure changes (indexes,
  stores added/removed). Consumers: Dexie's migration engine.
- **SCHEMA_VERSION** — the shape of `SleepEntry` in backup files
  (field renames, type changes, removals). Consumers: `migrateBackup()`.

They will diverge over time. Increment `SCHEMA_VERSION` only when a
**breaking** change is made to `SleepEntry` (renames, removals, type
changes). Additive changes (new optional fields) do not require a bump.

---

**Q15. How should "days" be defined in the app, given Non-24 has no fixed day?**

- A) Use calendar dates (standard clock days)
- B) Use "sleep cycles" as the unit instead of calendar days
- C) Both — show calendar date AND cycle number
- D) Let me configure this manually

Answer: C, with the option to toggle between calendar date and cycle number in the UI. When we design the UI, we can show both the calendar date and the cycle number for each sleep entry, so users can clearly understand how my sleep is drifting in both contexts without confusion, which is my strongest suit as a designer.

---

## 📊 SECTION 4: Visualization & Analytics

---

**Q16. Which chart or visualization is most important to you?**

- A) A timeline/Gantt chart showing each sleep block over weeks
- B) A circular 24-hour clock showing where sleep falls each day
- C) A line graph showing how my sleep onset time shifts day by day
- D) A heatmap (like GitHub's contribution graph) showing sleep coverage
- E) Multiple views — I want to switch between them

Answer: E. The default visualization would be a diagonal drift chart — time of day on the Y axis, cycle number or calendar date on the X axis — where you can see the sleep band slowly sliding downward (or upward) across weeks. This is sometimes called an actogram, and it's what sleep researchers actually use for Non-24 and circadian rhythm disorders.

---

**Q17. What time range should the default view cover?**

- A) Last 7 days
- B) Last 30 days
- C) Last 90 days
- D) Custom date range picker
- E) Show everything since I started using the app

Answer: Defaults to 1 week (1W), with a segmented toggle allowing the
user to switch between:

[ 1W ] [ 1M ] [ 3M ] [ 6M ] [ 1Y ] [ All ]

Inspired by Google Calendar's view switcher. Each view shows the same actogram/drift chart at different zoom levels. No data is ever hidden — only the visible range changes.

---

**Q18. Should CircaLog calculate and display your estimated "free-running period"?**
*(Non-24 cycles are typically 24.5–25.5 hours; yours may differ.)*

- A) Yes — this is essential data I want to track
- B) Yes, but only after enough data is collected (e.g., 14+ days)
- C) Nice to have, but not urgent
- D) No — I'll calculate this manually or with a doctor

Answer: B. This is a key metric for understanding my Non-24 cycle, but it requires at least 2 weeks of data to calculate accurately. We need to display to the user that this metric is "pending" until enough data is collected, and then show it prominently once available. It can be calculated using a simple linear regression on the sleep onset times to estimate the average cycle length

---

**Q19. Should the app generate health summaries or reports?**

- A) Yes — a weekly summary of sleep stats (average duration, drift amount)
- B) Yes — a monthly report I can share with my doctor (PDF export)
- C) Both weekly + monthly
- D) No reports needed — the charts are enough

Answer: C.

---

**Q20. Should the app flag anomalies or patterns automatically?**

- A) Yes — alert me when my cycle drifts by more than X hours
- B) Yes — flag unusually short or fragmented sleep sessions
- C) Yes — both types of alerts
- D) No automatic flagging; I'll analyze data myself

Answer: C.

---

## 🔔 SECTION 5: Notifications & Reminders

---

**Q21. What kind of push notifications do you want?**

- A) Reminder to log my sleep after I've been awake for a while
- B) Reminder to go to sleep based on my predicted cycle
- C) Alerts about significant cycle drift
- D) All of the above
- E) No notifications — I'll open the app manually

Answer: D. Only if it does not incur expenses for me.

---

**Q22. How should the app predict your next sleep window?**

- A) Based on a fixed offset from my last wake time (e.g., +16 hours)
- B) Using a rolling average of my recent cycle lengths
- C) A simple algorithm based on my historical free-running period
- D) I don't want predictions — just tracking

Answer: C.

---

**Q23. Do you want a "bedtime reminder" notification?**

- A) Yes — remind me 30–60 minutes before my predicted sleep time
- B) Yes, but let me configure the lead time
- C) Only if I'm severely behind my expected schedule
- D) No reminders

Answer: A and B. I want a bedtime reminder that notifies me 30–60 minutes before my predicted sleep time, and I also want the ability for other users to configure the lead time for this reminder in the app settings. This way, I can adjust it based on how much time I need to wind down before bed, which is important for managing my Non-24 sleep schedule effectively.

---

## 🎨 SECTION 6: Design & User Experience

---

**Q24. What is the most important UX quality for CircaLog?**

- A) Speed — logging should take under 10 seconds
- B) Clarity — data should be immediately understandable
- C) Beauty — I want an app I enjoy opening every day
- D) Accessibility — large text, high contrast (important given your health conditions)
- E) All are important; don't sacrifice any

Answer: E. All are important, but if I had to prioritize, it would be: 1) Clarity, 2) Speed, 3) Accessibility, 4) Beauty. The app must be easy to understand at a glance, allow for quick logging, be accessible for my visual needs, and have an aesthetic that makes me want to use it daily.

---

**Q25. What visual theme should CircaLog have?**

- A) Dark mode always (sleep app — dark is essential)
- B) Light mode always
- C) Auto — follows system dark/light setting
- D) User-selectable (toggle in settings)

Answer: D. I want a user-selectable theme toggle in the settings that allows me to switch between dark mode and light mode, with dark mode as the default since it's a sleep-related app.

---

**Q26. What aesthetic direction fits CircaLog best?**

- A) Clinical / medical — clean, data-forward, minimal decoration
- B) Calm / organic — soft tones, nature-inspired, gentle UX
- C) Cosmic / celestial — space, stars, night sky imagery
- D) Brutalist / bold — strong typography, stark contrast, no fluff
- E) Glassmorphism / modern — frosted glass, blurs, depth

Answer: A and C. I want a blend of clinical/medical aesthetics for clarity and professionalism, combined with cosmic/celestial elements to evoke the night sky and the nature of sleep. This could mean a clean, data-focused UI with subtle starry backgrounds or moon phase icons to add a touch of whimsy without sacrificing readability.

---

**Q27. What color palette direction speaks to you?**

- A) Deep navy and midnight blue with soft gold accents
- B) Dark charcoal with purple/violet accents
- C) Near-black with teal/cyan highlights
- D) Dark indigo with warm amber/orange accents
- E) Monochrome — black, white, and one accent color only

Answer: B.
Dark charcoal: `#0F0F1E`
Purple/violet - Accents: `#6d28d9`, `#7c3aed`, `#8b5cf6`, `#a78bfa`,`#7c3aed`, `#8b5cf6`, `#a78bfa`

---

**Q28. How should the app's main navigation work?**

- A) Bottom tab bar (Log / Charts / History / Settings)
- B) Side drawer menu
- C) Single scrollable page — no tabs
- D) Minimal: just a home screen and a log button, everything else buried

Answer: A + B combined.
- Bottom tab bar for core features (Log, Chart, History, Insights)
- Side drawer via hamburger icon (top left) for secondary features
  (Settings, Reports, Export, Educational Resources, About, Privacy policy, Terms & conditions, Dark mode switcher, etc.)
- Bottom bar must have sufficient padding to clear system navigation bars for iOS, android, and Hawaii users.
- Tab bar customization planned for V2, not V1

---

**Q29. Should CircaLog have a name/logo on the splash or home screen?**

- A) Yes — a proper logo with the CircaLog name prominently displayed
- B) Yes — just the name in a nice font, no icon needed
- C) Minimal — just the app name subtly in a header
- D) No branding on the main screen — all I want is data

Answer: A and C.

---

## 🔐 SECTION 7: Privacy, Auth & Security

---

**Q30. Should CircaLog require any form of login or authentication?**

- A) No — open directly, no login
- B) PIN code or biometric lock only (local auth)
- C) Google Sign-In (to enable cloud sync)
- D) Email + password account
- E) Optional login — works offline without it, cloud features require it

Answer: C and E. I want to offer optional login via Google Sign-In to enable cloud sync and data backup, but the app should also work fully offline without requiring any authentication for users who prefer privacy and local-only storage.

---

**Q31. How sensitive do you consider your sleep data?**

- A) Very sensitive — I want end-to-end encryption
- B) Moderately sensitive — standard security is fine
- C) Not very sensitive — convenience over security
- D) I want a local-only mode with no data leaving my device

Answer: B.

---

**Q32. Should CircaLog allow data export?**

- A) Yes — export as CSV
- B) Yes — export as PDF health report
- C) Yes — both CSV and PDF
- D) Yes — also as JSON for developers/technical use
- E) No export needed

Answer: C.

---

## 🩺 SECTION 8: Health & Medical Integration

---

**Q33. Do you want to track medication or supplements alongside sleep?**

- A) Yes — log medications with each sleep session (e.g., melatonin, sleep aids)
- B) Yes — a separate medication log linked to sleep patterns
- C) Maybe in a future version, not V1
- D) No — keep the app focused on sleep only

Answer: B and C. I want to have a separate medication log that allows me to track what medications or supplements I'm taking, and then link that data to my sleep patterns for analysis. However, this feature can be planned for a future version (V2) after we have the core sleep logging and visualization features working in V1.

---

### 💡 Supplementary: Medication & Meal Tracking Architecture

*Decided 30 May 2026 — arose from observing that clock-based medication
schedules break when the sleep cycle rotates. Full rationale below.*

**The problem**

For a Non-24 patient, prescribed drug schedules ("10 AM / 4 PM / 10 PM")
are anchored to a clock that no longer aligns with their biological
readiness to eat or sleep. A patient who wakes at 5 PM has already missed
two dose windows and must simultaneously reason about food gaps, sleep
gaps, and the next valid window — unaided and every single day.
Free-text entry of drug names on a phone every session is not a viable UX
for a person in that state.

**Architectural decision**

The V2 medication system uses **four linked tables/stores**, not the
simple inline `Medication[]` array on `SleepEntry` (which is kept only as
a V1 legacy field and must not be extended):

| Store / Table | Purpose |
|---|---|
| `medication_definitions` | One-time-configured medication library per user. Each entry holds the drug name, scheduled times (HH:MM), acceptable window, food relationship, food gap, min gap before sleep, and missed-dose policy. |
| `meal_definitions` | User-defined meal slots (e.g. "Breakfast", "Lunch"). Picked from a list — not typed fresh each time. Optional typical clock-time hint (UI only; never used for compliance). |
| `dose_log_entries` | Daily dose record. A row is created automatically as `missed` for every scheduled dose; updated to `taken` or `skipped` when the user logs it. Produces a compliance record, not just a list of taken doses. |
| `meal_log_entries` | Actual meal times. The engine uses these as the food anchor for dose-compliance checks (e.g. "Metformin requires food; last meal was 4 hours ago — window is valid"). |

**On the logging screen:** the user taps a medication from a
pre-populated list and enters only the actual time taken (or marks it
skipped). No typing drug names.

**TypeScript types** — all in `src/lib/circadian/types.ts`:
`FoodRelationship`, `MissedDoseAction`, `DoseStatus`,
`MedicationDefinition`, `MealDefinition`, `DoseLogEntry`, `MealLogEntry`.

**IndexedDB and Supabase** use the same four store/table names.

**Doctor report (V2):** medication compliance summary (taken / missed /
skipped per drug, with scheduled vs. actual times) is included in the
one-tap PDF alongside the actogram.

---

**Q34. Should CircaLog track other health factors that affect sleep?**

- A) Light exposure (did you get sunlight / bright light?)
- B) Physical activity or step count
- C) Headache or pain level (relevant to your neuropathy/headaches)
- D) Mood/energy level upon waking
- E) All of the above
- F) None — sleep data only

Answer: E, but optional fields, not required in V1.

---

### ☕ Supplementary: Drinks Log

*Decided 02 Jun 2026 — arose from recognising that caffeine timing,
alcohol, and fluid intake are medically relevant context for a sleep
specialist and are not captured elsewhere in the app.*

**The case for logging drinks**

Caffeine has a half-life of ~5–7 hours. A coffee at 3 PM still has half
its stimulant effect at 8–10 PM. For a Non-24 patient already fighting
delayed sleep timing, late caffeine is a compounding factor that a sleep
specialist needs to see alongside the actogram. Alcohol disrupts sleep
architecture even when it does not delay onset. Protein shakes affect
satiety and indirectly sleep quality. Juice can carry sugar load and
sometimes caffeine (green tea variants, etc.). Water intake is relevant
for hydration and, for patients with conditions affecting nocturia (e.g.
enlarged prostate), correlates with sleep fragmentation patterns.

CircaLog is not just a sleep diary — it is a *sleep context* tracker.
A sleep specialist reviewing a full CircaLog report should see everything
contributing to the patient's sleep pattern, not just the sleep blocks
themselves.

**Data model — `DrinkLogEntry`**

To be added to `src/lib/circadian/types.ts`:

| Field | Type | Notes |
|---|---|---|
| `date` | `string` (DD/MM/YYYY) | Calendar date of the drink |
| `timeUtc` | `string` (ISO 8601) | Actual time in UTC |
| `ianaTimezone` | `string` | Entry's local timezone (matches SleepEntry convention) |
| `drinkType` | `DrinkType` enum | See enum values below |
| `caffeineEstimateMg` | `number \| null` | Auto-calculated from type+size; user-editable |
| `sizeCategory` | `'small' \| 'regular' \| 'large' \| 'custom'` | — |
| `customSizeOz` | `number \| null` | Populated when sizeCategory = 'custom' |
| `customSizeMl` | `number \| null` | Populated when sizeCategory = 'custom' |
| `notes` | `string \| null` | Optional free text |

**`DrinkType` enum values:**
`coffee`, `tea`, `energy_drink`, `protein_shake`, `juice`, `alcohol`, `water`, `other`

**Caffeine reference table**

Default mg estimates per type and size (user-editable in Settings):

| Drink Type | Small | Regular | Large |
|---|---|---|---|
| Coffee (espresso-based) | 63 mg | 126 mg | 189 mg |
| Coffee (filter/drip) | 95 mg | 140 mg | 200 mg |
| Tea (black) | 25 mg | 47 mg | 70 mg |
| Tea (green) | 15 mg | 28 mg | 45 mg |
| Energy drink | 80 mg | 160 mg | 240 mg |
| Protein shake | 0 mg | 0 mg | 0 mg |
| Juice | 0 mg | 0 mg | 0 mg |
| Alcohol | 0 mg | 0 mg | 0 mg |
| Water | 0 mg | 0 mg | 0 mg |

*Note: "Coffee" should be split into sub-types (espresso vs. filter) in
the Settings caffeine table — the default UX uses a single "Coffee" option
for logging speed, but the caffeine reference table can have two rows.*

**Storage**

- IndexedDB store: `drink_log_entries`
- Supabase table: `drink_log_entries`
- Both follow the same naming convention as the medication/meal stores.

**UX notes**

- Water logging is high-frequency — needs a one-tap shortcut (e.g. a
  dedicated "Water +" button) to avoid friction death.
- Caffeine estimate auto-fills from drink type + size; the user can tap
  to override if they know the exact value (e.g. from a can label).
- The caffeine curve overlay on the actogram/timeline view is optional —
  the patient can toggle it off if it adds visual noise.

**Insights — caffeine curve overlay**

Calculated from logged drinks using the standard ~5–7 hour half-life
model. Shown as an optional overlay on the actogram or timeline view.
Helps the patient and their doctor see whether late caffeine correlates
with delayed sleep onset across multiple cycles.

**Doctor report integration (V2)**

- Caffeine intake summary included in the one-tap PDF
- Correlate drink timing with sleep onset latency where data permits

---

**Q35. Should there be a "doctor report" feature?**

- A) Yes — a one-tap PDF I can hand to a neurologist or sleep specialist
- B) Yes — with my average cycle length, drift rate, and charts included
- C) Maybe later — not in V1
- D) No — I'll copy-paste data manually if needed

Answer: A and B, but planned for V2 after we have the core logging and visualization features in place.

---

**Q36. Do you want CircaLog to include educational content about Non-24?**

- A) Yes — a brief "about my condition" section for context
- B) Yes — tips for managing Non-24 (light therapy, melatonin timing)
- C) Maybe a resources/links section
- D) No — pure tracking app, no educational content

Answer: A and C.

---

## 🚀 SECTION 9: Development Priorities & Timeline

---

**Q37. How do you want to build CircaLog — alone or collaboratively?**

- A) Just me (and AI assistance from Claude)
- B) Me + potentially a developer friend later
- C) I want to eventually open-source it
- D) I'd like to hire a freelancer to handle specific parts

Answer: A and C. I want to build CircaLog primarily on my own with the assistance of AI tools like Claude Code for coding help and Claude Desktop for discussions, planning, prompting, and collaboration, but I also have the intention to eventually open-source the project so that other Non-24 patients and developers can contribute and benefit from it in the future.

---

**Q38. What's your current frontend skill comfort level?**

- A) Confident in HTML/CSS, moderate in JS
- B) Comfortable with React and modern JS tools
- C) I can follow code Claude writes but need explanation
- D) I prefer low-code/no-code tools where possible

Answer: A and C. Claude Code can write comments above the code with explanations of what each part does, and I can follow along and learn as we build. I'm confident in HTML and CSS, and I have a moderate understanding of JavaScript, but I may need some guidance on more complex React patterns or state management as we go.

---

**Q39. What is your target for a working V1?**

- A) Within 1 week (basic log + chart)
- B) Within 2–4 weeks (log + chart + notifications)
- C) Within 1–2 months (full-featured MVP)
- D) No rush — I want to get it right, not fast

Answer: D.

---

**Q40. After domain purchase on June 1st (insha'Allah), what's your first priority?**

- A) Deploy the current skeleton to circalog.app immediately
- B) Finalize the design system (colors, fonts, components) first
- C) Build the sleep log functionality end-to-end before deployment
- D) Set up the database and backend first, then build UI on top

Answer: None of the above. The moment we have one page ready it will be deployed on Vercel with each GitHub commit. I am unable to rush you or Claude Code, while I am on the Pro plan limitations. So, again it is not about speed, but about getting it right.

---

**Q41. How do you want to handle app updates / version management?**

- A) Auto-update via PWA service worker (silent background updates)
- B) Notify me when an update is available, I'll approve it
- C) Manual deploys only — I'll push when ready
- D) I want a versioning system with changelogs built into the app

Answer: A and D.

---

## 🌐 SECTION 10: Domain, Hosting & Deployment

---

**Q42. Where should CircaLog be hosted?**

- A) Vercel (already connected, free tier is fine for now)
- B) Cloudflare Pages (also free, excellent performance)
- C) Self-hosted on my Ubuntu VM (10.0.0.12)
- D) GitHub Pages (if static-only)
- E) I want a proper VPS later (DigitalOcean, Hetzner, etc.)

Answer: A.

---

**Q43. Should circalog.app eventually support multiple users (multi-tenant)?**

- A) No — single-user forever
- B) Not now, but I want the architecture to allow it later
- C) Yes — I want family/caregiver access from day one
- D) Yes — I want it to be a SaaS product eventually

Answer: B and D.

---

**Q44. Do you want a landing page at circalog.app separate from the app itself?**

- A) No — the app IS the landing page; redirect to login/dashboard directly
- B) Yes — a simple landing page explaining the app, then enter
- C) Yes — a beautiful marketing page, with the app at /app or /dashboard
- D) Later — V1 just needs the app running

Answer: C + D combined.
- circalog.app          → Landing/coming soon page (V1),
                          evolves into full marketing page (V2+)
- circalog.app/log      → The PWA app itself (always)
- Root domain is the public face of CircaLog
- App lives permanently at /log — clean, descriptive, never changes

---

## 💡 SECTION 11: Extra Features & Future Thinking

---

**Q45. Should CircaLog have a "journal" feature?**

- A) Yes — free-form text entries linked to each sleep session
- B) Yes — structured prompts (e.g., "How rested do you feel? What affected your sleep?")
- C) Maybe — as an optional add-on, not core
- D) No — I have other tools for journaling

Answer: A and B.

---

**Q46. Should CircaLog integrate with any other services?**

- A) Google Fit / Health Connect (Android health data)
- B) Apple Health (if you ever use iOS)
- C) Telegram bot (log sleep via a message)
- D) Google Calendar (show sleep blocks as events)
- E) No integrations — keep it self-contained

Answer: E. I want CircaLog to remain self-contained, focusing on sleep logging and visualization for Non-24, avoiding the complexity and privacy issues of third-party integrations for now. Future versions may consider integrations if there's demand, and they can be implemented securely.

---

**Q47. Would you like a "streak" or gamification element?**

- A) Yes — reward consistent logging with streaks or badges
- B) Yes, but subtle — just a streak counter, nothing flashy
- C) No — this is a medical tool, not a game
- D) Maybe for motivation in early days, then I'll want it removed

Answer: B.

---

**Q48. Should CircaLog have a widget (Android home screen widget)?**

- A) Yes — a one-tap "Log Sleep / Wake" widget on my home screen
- B) Yes — a widget that shows my last sleep entry summary
- C) Both
- D) No — I'll open the app normally

Answer: A and B.

---

**Q49. Should the app include a "Sleep Debt" tracker?**

- A) Yes — track how much sleep I've gotten vs. a target (e.g., 7–8 hours)
- B) Yes, but I know Non-24 makes standard targets tricky — still want it
- C) Not in V1 — too complex for now
- D) No — this concept doesn't apply well to Non-24

Answer: B 😔

---

**Q50. Is there any feature you've seen in another sleep/health app that you MUST have in CircaLog?**

- A) The drift visualization from Entrain or similar academic tools
- B) The clean logging UX from Sleep Cycle or Pillow
- C) The data export depth of Oura Ring app
- D) The simplicity of a plain timer/stopwatch
- E) I'll describe it in my own words — none of these fit

Answer: B and C. I want the logging UX to be as clean and intuitive as apps like Sleep Cycle or Pillow, where it's easy to start and stop sleep sessions with minimal friction. Additionally, I want the data export capabilities to be robust, similar to the Oura Ring app, allowing me to export detailed sleep data in formats like CSV and PDF for analysis and sharing with healthcare providers.

---

*— End of Q&A —*

---

## 🔤 Supplementary: Typography Decisions

*Decided 28 May 2026 — after the initial Q&A session.*

---

**Exo 2 — variable weight**

URL: <https://fonts.google.com/specimen/Exo+2>

Scope:

- Logo wordmark (in logo asset files under `public/images/brand/`)
- In-app headings, section titles, and key data callouts (cycle number, free-running period value, quality rating)

Rationale: Chosen over Science Gothic (too sci-fi) and Inter (too neutral for a wordmark). Technical and distinctive without being aggressive. Letterforms hold well at both large display sizes and smaller heading sizes.

---

**Inter — variable weight, optical-size-aware**

URL: <https://fonts.google.com/specimen/Inter>

Scope: All body text, form inputs, tab labels, navigation items, notes, timestamps, and all secondary UI copy.

---

**Rejected fonts**

Science Gothic: evaluated for both the logo and app headings.
Rejected — letterforms read as technical sci-fi rather than
medical-adjacent, which conflicts with the trustworthy brief (Q26).

> **Instructions:** Answer each question with the letter(s) that best match your vision. For any question, feel free to answer with multiple letters (e.g., "B + D") or write a custom answer. The more honest your answers, the better the dev plan we can build together.

---

## 🕐 Supplementary: Three-Date Sleep Session Model

*Decided 02 Jun 2026 — arose from observing that a single sleep session
can span multiple calendar dates, and that a single `Date` column is
ambiguous for midnight-crossover sessions.*

---

**The problem**

A sleep session that begins at 23:10 on May 31 (local), crosses midnight,
and ends at 05:40 on June 1 (local) produces three meaningful calendar
dates:

| Date | Answers the question |
|---|---|
| **Bed date** (May 31) | "Which night was this?" — the human anchor; what you'd tell your doctor |
| **Sleep start date** (June 1) | "When did sleep actually begin?" — used for onset calculations and actogram Y-axis |
| **Wake date** (June 1) | "When did the day start after this session?" — used for medication and food timing |

The spreadsheet collapsed all three into one `Date` column anchored to
Sleep Start local time, which caused Cycles 4 and 5 in the real-data
fixture to both show as `06/01` even though they were on different nights.

For patients with Non-24 who may sleep for 12–48+ hours, or stay awake
for 36–51+ hours, the three dates can be on entirely different calendar
days. A single date field cannot represent this correctly.

**Architectural decision**

`bedTimeUtc?: string` was added to `SleepEntry` as an optional field:

- **Optional** because back-filled historical entries may only have sleep
  start and wake times, and the app must work correctly without it.
- **The night anchor:** the local calendar date derived from `bedTimeUtc`
  is the correct answer to "which night was this session?" — even when
  sleep start and wake time fall on different calendar dates.
- **Fallback:** when `bedTimeUtc` is absent, display layers fall back to
  `localSleepStartDate` and note that the night anchor is approximate.

`normalizeSleepSpan(entry)` returns all three local dates:

```typescript
interface NormalizedSleepSpan {
  durationMs: number
  sleepStartUtc: string
  wakeUtc: string
  localSleepStartDate: string   // YYYY-MM-DD in entry's ianaTimezone
  localWakeDate: string         // YYYY-MM-DD in entry's ianaTimezone
  localBedDate?: string         // YYYY-MM-DD — undefined when bedTimeUtc absent
}
```

All downstream consumers (history view, actogram, doctor report) use
`localBedDate` as the display date for "which night was this?" and fall
back to `localSleepStartDate` only when `localBedDate` is undefined.

**Future use**

Once enough drift data is collected (14+ entries), `estimateFreeRunningPeriod()`
can project sleep windows forward. The goal: tell the patient "based on
your current cycle, your predicted sleep onset on June 22 is around 3 AM
and you should be awake by 10 AM" — answering questions like "will I be
awake when my wife lands?" This requires accurate bed-date anchoring to
be meaningful.
