# CC TASK — Phase 0.5: Timezone Strategy Decision & Documentation

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Phase:** 0.5 — Circadian Engine (Foundational Decisions)
**Status:** 🔴 Not started

---

## Goal

This task has no code to execute and no dependencies to install. Its sole
purpose is to write one document: the authoritative, permanent record of
CircaLog's timezone strategy decision. Every piece of engine code written
in Phase 0.5 will rely on this document as its ground truth.

The TO-DO list requires this decision to be documented **before any engine
code is written**. This task satisfies that requirement.

---

## Context: Why a Dedicated Decision Document?

The circadian engine operates on timestamps spanning multiple timezones and
years. Mahmoud has already lived in two timezones (Philippines UTC+8,
Egypt UTC+2/+3) during the period he intends to back-fill. Egypt observes
DST (currently last Friday of April through last Thursday of October,
reinstated 2023). The Philippines does not.

Without a written, unambiguous contract for how timestamps are stored and
interpreted, each utility function in `src/lib/circadian/` would make its
own assumptions — and those assumptions would silently conflict when
historical data crosses a timezone or DST boundary.

This document is that contract.

---

## ⚠️ Read This Before Starting

- This task writes **one new file**. No existing files are modified.
- Do not create any files under `src/lib/circadian/` in this task —
  that directory is scaffolded in a later task.
- Verify the target path does not already exist before writing (Step 1).
- Follow all markdownlint rules in the output document — zero warnings
  allowed (see Step 3 for the specific rules that apply).

---

## Step 1 — Verify the Target File Does Not Exist

Run the following PowerShell command:

```powershell
Test-Path "C:\Projects\CircaLog\docs\timezone-strategy.md"
```

Expected output: `False`

If the output is `True`, stop immediately and report the existing file's
contents to Claude.ai before proceeding. Do not overwrite it.

---

## Step 2 — Verify the `docs/` Directory Exists

Run:

```powershell
Test-Path "C:\Projects\CircaLog\docs"
```

Expected output: `True`

If `False`, stop and report — the `docs/` directory must exist before
this task runs.

---

## Step 3 — Write `docs/timezone-strategy.md`

Create the file at `docs/timezone-strategy.md` with the exact content
below. Do not paraphrase, reorder, or summarise — write it verbatim.

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- This applies even when a label line immediately precedes a block —
  always insert a blank line between the label and the opening fence

---

### File content to write

````markdown
# CircaLog — Timezone Strategy

**Status:** Decided
**Decided:** 30 May 2026
**Applies to:** All sleep entry timestamps — IndexedDB schema, Supabase
schema, engine functions, actogram rendering, export formats

---

## Decision

Every sleep entry stores **two fields** per timestamp:

| Field | Type | Example |
|---|---|---|
| `sleepStartUtc` | ISO 8601 string (UTC) | `"2026-04-28T23:30:00.000Z"` |
| `wakeUtc` | ISO 8601 string (UTC) | `"2026-04-29T07:15:00.000Z"` |
| `ianaTimezone` | IANA timezone name string | `"Africa/Cairo"` |

The UTC timestamps are the immutable anchors. `ianaTimezone` is the lens
through which they are displayed to the user.

---

## Rationale

### Why UTC timestamps

UTC is the only unambiguous representation of a moment in time. Storing
local time (e.g., "3:00 AM") without its offset produces irrecoverable
ambiguity — you cannot reconstruct which 3:00 AM it was after the fact.

Mahmoud's historical back-fill data spans at least two timezones
(Philippines UTC+8 and Egypt UTC+2/+3). Entries created in Manila must
render correctly on an actogram viewed in Cairo, and vice versa. UTC
makes this trivially correct: the math never changes regardless of where
the app is opened.

### Why IANA timezone name, not raw offset integer

The IANA timezone name (e.g., `"Africa/Cairo"`, `"Asia/Manila"`) is a key
into the IANA Time Zone Database, the authoritative global record of every
country's timezone history including every DST rule change, past and
future. JavaScript's `Intl` API ships this database in every modern
browser.

A raw offset integer (e.g., `+120`) is ambiguous: it does not identify
whether a Cairo entry was made during EET (winter, UTC+2) or EEST (summer,
UTC+3). The IANA name `"Africa/Cairo"` combined with the UTC timestamp
allows the browser to resolve the correct local time for any historical
date automatically, including across every past and future DST transition.

**Egypt's DST situation specifically:** Egypt reinstated DST in 2023. It
currently observes DST from the last Friday of April to the last Thursday
of October each year. The transition date is announced annually and has
changed year-to-year. Storing `"Africa/Cairo"` delegates the resolution of
these transitions to the IANA database — no CircaLog code needs to track
Egyptian government DST announcements.

### Why not store local time at all

Storing local time in addition to UTC would be redundant — it can always
be derived on read via `Intl`. Storing it would create a second source of
truth that could drift from UTC if an entry is edited.

---

## How `ianaTimezone` Is Obtained

The browser provides the device's current IANA timezone automatically:

```typescript
const ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// e.g. "Africa/Cairo" or "Asia/Manila"
```

This value is read at the moment the entry is saved, not when the app
loads. If the user travels between saving the start time and saving the
wake time, `ianaTimezone` reflects the timezone of the device at wake-up
confirmation. This is acceptable — the UTC anchor is still correct, and
the IANA name records where the user was when they confirmed the session.

---

## How Local Time Is Derived on Read

To display an entry's local time (e.g., on the actogram Y-axis, in the
history list, in exports), derive it from the UTC timestamp and the stored
`ianaTimezone`:

```typescript
function toLocalTime(utcIso: string, ianaTimezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ianaTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcIso));
}
```

The actogram's Y-axis always shows the time-of-day **as the user
experienced it** — i.e., in `ianaTimezone` — not in UTC and not in the
device's current timezone. This preserves the visual meaning of the drift
pattern regardless of where the app is subsequently opened.

---

## Timezone Change Detection (V1 Passive, V2 Active)

### V1 behaviour (passive — no user action required)

The app reads `Intl.DateTimeFormat().resolvedOptions().timeZone` at the
moment of every log entry save. No prompt, no user action. The correct
IANA name is stored automatically. This is correct for all cases where the
device clock is accurate.

### V2 behaviour (active — optional UX enhancement)

When the app detects that the device timezone has changed since the
previous entry, display a small non-blocking notice:

> "It looks like you're in a different timezone
> (Africa/Cairo → Europe/Berlin). New entries will use the new timezone."

No user action is required — this is informational only, confirming that
the system has detected the change and will record entries correctly.

---

## Field Names in Code

Use these exact names everywhere — in TypeScript interfaces, IndexedDB
object store schemas, Supabase column names, and export formats:

| Concept | Field name |
|---|---|
| Sleep start (UTC) | `sleepStartUtc` |
| Wake time (UTC) | `wakeUtc` |
| IANA timezone at time of entry | `ianaTimezone` |

Do not use `startTime`, `endTime`, `timezone`, `offset`, or any other
variant. Consistency across every layer is the only way to prevent
silent bugs when data moves between IndexedDB and Supabase.

---

## Scope

This strategy applies to:

- The `SleepEntry` TypeScript interface (`src/lib/circadian/types.ts`)
- The IndexedDB object store schema (Sleep Log task, Phase 1)
- The Supabase `sleep_sessions` table schema (V2 sync task)
- All circadian engine functions (`src/lib/circadian/`)
- Actogram rendering (Y-axis local time derivation)
- All export formats (CSV, JSON, PDF)

---

## What This Document Does Not Cover

- Cycle-number assignment strategy → see `docs/cycle-number-strategy.md`
  (written in the next foundational decision task)
- IndexedDB schema definition → Sleep Log task, Phase 1
- Supabase column definitions → V2 sync task

---

*This decision was made on 30 May 2026 and is not open for revision
without an explicit ADR (Architecture Decision Record) superseding it.*
````

---

## Step 4 — Verify the Written File

Read the file back immediately after writing it:

```powershell
Get-Content "C:\Projects\CircaLog\docs\timezone-strategy.md"
```

Confirm all of the following before proceeding:

- ✅ File exists at `docs/timezone-strategy.md`
- ✅ The **Status**, **Decided**, and **Applies to** metadata lines are present
  and correct
- ✅ All four sections are present: Decision, Rationale, How `ianaTimezone`
  Is Obtained, How Local Time Is Derived on Read
- ✅ The field name table is present with the three canonical names:
  `sleepStartUtc`, `wakeUtc`, `ianaTimezone`
- ✅ The V1/V2 timezone change detection section is present
- ✅ No fenced code block is missing its surrounding blank lines

If any check fails, overwrite the file and re-verify.

---

## Step 5 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md`.

Find this exact block under **Phase 0.5 — Foundational Decisions**:

```markdown
- [ ] 🔴 Decide and document timezone strategy
       - Recommendation: store UTC timestamp + `originalTimezoneOffset` per entry
       - Must handle: travel across timezones (Mahmoud's Philippines → Egypt move is
         already in the historical data), DST transitions, historical preservation
       - Document the decision before any engine code is written
```

Replace it with:

```markdown
- [x] 🔴 Decide and document timezone strategy
       (UTC timestamps + IANA timezone name per entry; field names: sleepStartUtc,
       wakeUtc, ianaTimezone; rationale and full decision in docs/timezone-strategy.md)
```

Read the TO-DO file back after saving to confirm the replacement is correct
and the surrounding items are unchanged.

---

## Step 6 — Write the Session Report

Write a Markdown session report and save it to `tasks/cc-reports/` using
this filename:

```text
REPORT_phase0-5-timezone-strategy_<DD>-<mon-<YYYY>.md
```

Replace `<DD>-<mon>-<YYYY>` with today's actual date (e.g. `30-may-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- Confirmation that `docs/timezone-strategy.md` was written and verified
- The exact file size or line count of the written document (run
  `(Get-Content "docs\timezone-strategy.md").Count` to get the line count)
- TO-DO list update — confirmation that the checkbox was changed to `[x]`
  and the sub-bullets were replaced with the summary line
- Deviations — any step where these instructions were not followed exactly,
  and the reason why
- Final file list — every file created or modified in this session
  (should be exactly two: `docs/timezone-strategy.md` and
  `docs/CircaLog-TO-DO-list.md`)

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- This applies even when a label line immediately precedes a block —
  always insert a blank line between the label and the opening fence

After writing the report, paste a short summary into the Claude.ai chat
and **wait for confirmation** before running the git commit.

---

## Step 7 — Commit

Only run this after Claude.ai has confirmed the session report:

```powershell
git add docs/timezone-strategy.md docs/CircaLog-TO-DO-list.md tasks/cc-reports/
git commit -m "docs: Phase 0.5 timezone strategy decision — UTC + IANA timezone name per entry"
```
