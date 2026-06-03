# 🌙 CircaLog — Project Instructions for Claude

**Project:** CircaLog — Sleep tracking PWA for Non-24-Hour Sleep-Wake Disorder
**Stack:** React + Vite + TypeScript + TailwindCSS + Recharts + IndexedDB + Supabase + Vercel
**Project root:** `C:\Projects\CircaLog\`
**Domain:** `circalog.app` (purchasing TBD)
**GitHub:** <https://github.com/sobhy0101/CircaLog>

---

## Honesty & Uncertainty Rule (Most Important)

If you are unsure about anything — a file path, a decision that was made, a
configuration detail, a Vite/React/Supabase API, anything — **check the
codebase first** before asking or assuming. Use the Filesystem extension to
list directories, read files, or search for patterns. A 2-second directory
scan is faster than a wrong confident answer or an unnecessary back-and-forth.

Only ask Mahmoud when the codebase genuinely cannot answer the question
(e.g., a value that belongs in `.env.local`, a decision that has not been
documented yet, or an intent that requires human judgment).

This applies especially to:

- Whether a file, folder, component, or env variable exists →
  **scan the codebase first**
- Which decisions have already been made →
  **check `docs/CircaLog_DevPlan_QA.md` first**
- What a file's current contents are →
  **read it with the Filesystem extension before touching it**
- Exact folder structure or where a new file should live →
  **list the relevant directory first**
- Supabase table/column names or IndexedDB store names →
  **search the codebase for existing definitions first, then ask if absent**

---

## How Claude.ai and Claude Code Divide the Work

### Claude.ai (this chat) — with Filesystem Extension

Claude.ai has direct read/write access to the project files via the
Filesystem extension. Use it for:

| Task | How |
|---|---|
| Understand a file before advising on it | `Filesystem:read_text_file` |
| Check if a file or path exists | `Filesystem:get_file_info` |
| List a directory's contents | `Filesystem:list_directory` |
| Search across files | `Filesystem:search_files` |
| Write or create a single file | `Filesystem:write_file` |
| Make a targeted edit to one file | Read → patch in memory → `write_file` |

**Rules for using the Filesystem extension in this chat:**

1. **Scan before you speak** — when in doubt about any file, path,
   component, or folder structure, use the Filesystem extension to check
   before advising or assuming. Never invent a path.
2. **Read before you write** — always read a file's current contents before
   patching or replacing it. The only exception is a brand-new file that is
   confirmed not to exist yet.
3. **Never blindly overwrite** — read first, patch second.
4. **Single-file scope** — if a task touches more than one file in a
   non-trivial way, hand it to Claude Code instead.
5. **No commands** — the Filesystem extension cannot run `npm`, `git`,
   `vite`, or any shell command. That is Claude Code's domain.

### Claude Code — terminal, multi-file, full codebase

Use Claude Code (CC) for anything beyond reading/writing individual files:

- Installing or updating dependencies (`npm install`, `npm run dev`, etc.)
- Running terminal commands of any kind (`git`, `vite build`, `npx`, etc.)
- Creating or editing **multiple files** in one cohesive task
- Searching for a pattern, function, or import **across the entire codebase**
- Complex refactors that span components, hooks, utilities, and types together
- Database migrations or Supabase schema changes
- Running tests or linting passes
- Anything requiring shell access or process execution

### Decision summary

```txt
Inspect / read a file                → Claude.ai (Filesystem extension)
Check if something exists            → Claude.ai (Filesystem extension)
Targeted single-file write or edit   → Claude.ai (Filesystem extension)
Multi-file work / commands / deps    → Claude Code
Architecture / planning / review     → Claude.ai (this chat)
```

---

## Task Complexity Tiers

Before writing a CC task file, Claude.ai must assess the task and tell
Mahmoud which tier it falls into. Mahmoud does not always know how complex
a task is under the hood — this assessment is Claude.ai's responsibility.

### Tier 1 — Direct edit (Claude.ai writes the files here)

**Criteria — ALL of the following must be true:**
- 3 files or fewer
- No new dependencies (`npm install` not needed)
- No shell commands required
- No architectural decision involved
- Low risk of cascading breakage if something is wrong

**Process:** Claude.ai reads the relevant files, writes or patches them
directly via the Filesystem extension, then Mahmoud reviews and commits
manually. No formal CC task file. No session report.

**Example tasks:** fixing a typo in a component, updating a CSS token value,
adding a comment, tweaking a layout class.

### Tier 2 — Full CC task file

**Criteria — ANY of the following is true:**
- Touches 4 or more files
- Requires `npm install` or any shell command
- Involves a build step or visual verification
- Has meaningful risk: wrong code here could break something else
- Introduces a new pattern the rest of the codebase will follow

**Process:** Claude.ai writes a structured task file in `tasks/`, hands it
to CC, CC executes and writes a session report, Mahmoud confirms before commit.

**Example tasks:** new hook + component + page update + build check,
installing a library, setting up a new subsystem.

### How Claude.ai flags the tier

When Mahmoud brings a task, Claude.ai must open with one of these:

> **Tier 1 — I can do this directly here.** [one sentence on why]
> Shall I go ahead?

> **Tier 2 — This needs a CC task file.** [one sentence on why]
> Shall I write it?

Mahmoud confirms, then work begins. Claude.ai must never silently assume
a tier and start working without flagging it first.

---

## Key Decisions Already Made (Do Not Re-litigate)

Full answers are in `docs/CircaLog_DevPlan_QA.md`. Summarized here:

**Platform & Stack**
- Framework: React + Vite (NOT Next.js)
- Language: TypeScript throughout
- Styling: TailwindCSS
- Charts: Recharts
- Local storage: IndexedDB (offline-first fallback)
- Cloud database: Supabase (PostgreSQL), optional sync
- Auth: Optional Google Sign-In only — app must work fully without login
- Hosting: Vercel (free tier is fine for now)
- Serverless: Vercel Functions (V1) → Cloudflare Workers (V2+)
- Updates: PWA service worker, silent auto-update (V1) + in-app changelog

**URL Structure**
- `circalog.app`       → Landing/coming soon page (V1), full marketing page (V2+)
- `circalog.app/log`   → The PWA app — permanent, never changes

**Scope by version**
- V1 MVP: Sleep log (required + optional fields) + actogram drift chart +
  nap auto-detection + dark/light mode toggle + PWA manifest + service worker +
  IndexedDB local storage + coming soon landing page
- V2: Google Sign-In + Supabase cloud sync + push notifications + bedtime
  reminders + free-running period calculation + weekly/monthly PDF & CSV
  reports + medication log + doctor report PDF + Android home screen widget +
  educational resources + sleep debt tracker
- V3: Multi-user/multi-tenant + full marketing page + public open-source
  release + potential health platform integrations

**Sleep logging**
- Required fields: sleep start time, wake time, quality rating (1–5)
- Optional fields: notes, dreams/nightmares, interruptions (bathroom/thirst/
  hunger/pain/other), medication taken (before/during/after — yes/no)
- Nap auto-detection: sessions under 3 hours are automatically tagged as naps
  (no manual selection needed in V1)
- Back-filling: yes, going back weeks or months

**Visualization**
- Primary chart: **Actogram** (diagonal drift chart — time of day on Y axis,
  cycle number and calendar date on X axis)
- Time range toggle: `[ 1W ]  [ 1M ]  [ 3M ]  [ 6M ]  [ 1Y ]  [ All ]`
  Default: 1W
- Show both calendar date AND cycle number per entry simultaneously
- Free-running period: calculated via linear regression on sleep onset times,
  displayed only after 14+ days of data, shown as "pending" until then

**Design**
- Dark mode by default; user-selectable toggle (dark/light)
- Aesthetic: clinical/data-forward + subtle cosmic/celestial elements
- Color palette: dark charcoal with purple/violet accents
- Navigation: bottom tab bar (Log / Chart / History / Insights) +
  hamburger side drawer for secondary features (Settings, Reports, Export,
  Educational Resources, About, Privacy, Terms, dark mode toggle, etc.)
- Tab bar: adequate bottom padding for Android and iOS system navigation bars
- Tab bar customization: planned for V2, not V1

**Notifications (V2)**
- Bedtime reminder: 30–60 min before predicted sleep window (configurable)
- Anomaly alert: significant cycle drift
- Fragmented sleep flag
- All push notifications must be free (no third-party cost)

**Reports (V2)**
- Weekly + monthly health summaries
- Doctor report: one-tap PDF with actogram, average cycle length, drift rate

**Privacy & Security**
- Standard security (not end-to-end encryption)
- Sleep data stays local unless user opts in to Google Sign-In
- No third-party integrations in scope (self-contained app)

**Analytics (V2+)**
- TBD — nothing set up yet

---

## Lessons Learned — Stack Gotchas

Hard-won facts discovered during development. Check this section before
writing any task file that touches the relevant area.

### React imports (`"jsx": "react-jsx"` + `"noUnusedLocals": true`)

The project uses the automatic JSX transform (`"jsx": "react-jsx"` in
`tsconfig.app.json`) together with `"noUnusedLocals": true`. These two
settings together determine the import rule:

- **`.tsx` files** — do NOT add `import React from 'react'`. The transform
  injects React automatically; the unused-locals rule will produce
  `TS6133: 'React' is declared but its value is never read` if the import
  is present.
- **`.ts` files that call React APIs directly** — use named imports:
  `import { useState } from 'react'` (preferred for consistency) or keep
  `import React from 'react'` and call `React.useState`. Either compiles.

*Discovered during Phase 1 ThemeToggle task (May 2026).*

### Vitest 4 + Vite 8 type conflict (`vite.config.ts`)

Vite 8 uses `rolldown` internally; Vitest 4 bundles an older
`rollup`-based Vite. Their plugin types conflict at the TypeScript level
when Vitest config is added to `vite.config.ts`.

Two things follow from this:

- **`UserConfig` is not exported from `vitest/config` in Vitest 4.**
  Do not write `import type { UserConfig } from 'vitest/config'` —
  it will cause a Vercel deployment failure even if the local build passes.
- **`satisfies UserConfig['test']`** is therefore also unavailable and
  must not be used on the `test` block.
- The correct workaround is an `as any` cast on the `defineConfig({...})`
  call. This bypasses the plugin type conflict without affecting runtime
  behaviour. The `test` block itself does not need a type annotation.

The resulting pattern in `vite.config.ts`:

```typescript
export default defineConfig({
  // ... plugins, resolve, etc.
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: false,
  },
} as any)
```

*Discovered during Phase 0.5 Vitest installation (Jun 2026).*

### `bedTimeUtc` and the three-date sleep session model

A single sleep session can span multiple calendar dates. `SleepEntry`
stores `bedTimeUtc?: string` (optional) alongside `sleepStartUtc` and
`wakeUtc`. The three dates answer different questions:

- `localBedDate`        — "which night was this?" (the human anchor; what the patient tells their doctor)
- `localSleepStartDate` — "when did sleep begin?" (used for onset calculations, actogram Y-axis)
- `localWakeDate`       — "when did the day start?" (used for medication and food timing)

`normalizeSleepSpan(entry)` derives and returns all three as `YYYY-MM-DD`
strings in the entry's `ianaTimezone`. All display layers (history view,
actogram, doctor report) use `localBedDate` as the primary display date
and fall back to `localSleepStartDate` only when `bedTimeUtc` is absent.

`bedTimeUtc` is optional because back-filled historical entries may only
have sleep start and wake times. Every engine function works correctly
without it. Never treat its absence as an error.

*Decided 02 Jun 2026, Phase 0.5 planning session.*

### Dexie 4.x — boolean fields cannot be used as index keys

The IndexedDB spec rejects booleans as index key types. Dexie 3.x worked
around this by coercing `false → 0` and `true → 1` before writing to the
index, which made `.where('isDeleted').equals(0)` work. Dexie 4.x removed
that coercion to stay spec-compliant.

**Consequence:** even though `isDeleted` is declared in the Dexie schema
index string (which is fine — Dexie ignores unqueryable fields there), it
cannot be queried via `.where('isDeleted').equals(...)` in Dexie 4.x.
Doing so silently returns zero results with no error.

**The correct pattern for filtering on boolean fields in Dexie 4.x:**

```typescript
// WRONG — silently returns zero results in Dexie 4.x
const active = await db.sleepEntries.where('isDeleted').equals(0).toArray()

// CORRECT — fetch all, filter in JS
const all = await db.sleepEntries.toArray()
const active = all.filter(e => !e.isDeleted)
```

This applies to any boolean field in any Dexie table. For large stores where
this becomes a performance concern in the future, the workaround is to store
an integer flag (`isDeleted: 0 | 1`) instead of a boolean — but that is not
needed at V1 scale and would require a schema migration.

*Discovered during Phase 1 Batch A DB layer task (Jun 2026).*

---

## Developer Context

Mahmoud is the sole developer, working with:
- **Claude.ai (this chat)** — planning, architecture, file reads/writes,
  targeted edits, reviewing individual files, project instructions
- **Claude Code** — terminal commands, multi-file tasks, dependency
  management, codebase-wide search
- **VS Code** — the primary editor

CircaLog is a personal health tool first, but is being architected for a
future public open-source release. There is no second developer or external
team. There is no capital budget for paid services at this stage.

Mahmoud has a design background (web/graphic) and is confident in HTML/CSS.
JavaScript and React are functional but not expert-level — **Claude Code
should include inline comments explaining what non-obvious code does.**

There is no deadline pressure. The priority is correctness and quality,
not speed.

---

## How to Help

- Always check `docs/CircaLog_DevPlan_QA.md` before assuming a decision is open
- **When in doubt about any path, file, or structure — scan the codebase
  first** using `list_directory`, `get_file_info`, `search_files`, or
  `read_text_file`. Ask Mahmoud only when the files cannot answer the question.
- Read any existing file before writing instructions about it or patching it
- Use TypeScript for all source files
- Use TailwindCSS for all styling; no external CSS files unless unavoidable
- Follow React + Vite conventions (functional components, hooks)
- Keep components in `src/components/`, hooks in `src/hooks/`,
  utilities in `src/lib/` or `src/utils/` — but **verify this structure
  exists in the codebase before referencing it**

---

## What to Avoid

- Do not suggest changing any finalized Q&A decision without explicitly
  flagging it as a proposed change and explaining the reason
- Do not assume `.env.local` variable names — check `.env.example` in the
  codebase first; ask Mahmoud only for values not present there
- Do not write Next.js patterns — this project uses Vite, not Next.js
- Do not add third-party integrations (Google Fit, Apple Health, Telegram, etc.)
  unless a Q&A decision has been made to include them
- Do not hallucinate package APIs — if unsure of a method or option, say so
  and suggest checking the relevant documentation
- Do not touch the coming-soon landing page logic when working on `/log`,
  and vice versa — they are separate concerns
- Do not invent a file path — scan first, always

---

## CC Task File Requirements

Every task file written for Claude Code **must** include a session report
step as the second-to-last step, immediately before the git commit step.

This is non-negotiable — do not write a task file without it.

**What the report step must tell CC to do:**

- Write a comprehensive Markdown report covering all steps, outcomes,
  packages installed (with exact versions), build output, deviations from
  the task instructions, and a full list of files created or modified
- Save the report to `tasks/cc-reports/` using the naming convention in
  `.claude/memory/feedback_report_conventions.md`:
  `REPORT_phase{N}-{slug}_{DD}-{mon}-{YYYY}.md`
- Follow the markdownlint rules: blank line before and after every fenced
  code block, zero warnings allowed
- Paste a short summary into the Claude.ai chat and **wait for confirmation**
  before running the git commit

The full policy for CC lives in `.claude/memory/session_report_policy.md`.

When in doubt about what to include in the report step, read that file.

---

## CC Skills

Project skills live in `.claude/skills/`. Each skill encodes conventions for
a recurring task type, so CC does not rediscover them from scratch each session.

When writing a CC task file that involves any of the domains below, include
an explicit step telling CC to read the relevant skill first:

| Task involves | Skill to reference |
|---|---|
| Starting dev server or running Playwright | `.claude/skills/run/SKILL.md` |
| Visual browser verification | `.claude/skills/visual-check/SKILL.md` |
| Using or extending color tokens | `.claude/skills/token-usage/SKILL.md` |

As new skills are added, update this table and the routing table in `CLAUDE.md`
(project root) in the same session.
