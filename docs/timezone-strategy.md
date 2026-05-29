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
