# CC Task — Phase 1: Sleep Log DB Layer (Batch A)

**Phase:** 1 — Sleep Log Core  
**Batch:** A — Data Layer (DB only; no UI)  
**Depends on:** Phase 0.5 Circadian Engine (stable — all tests passing)  
**Blocks:** Batch B (Log UI forms)

---

## Goal

Build the IndexedDB persistence layer for `SleepEntry` records using Dexie.js.
Deliver a fully typed, tested CRUD service that the UI can wire into in Batch B.

No React components. No UI changes. No routing changes. Data layer only.

---

## Context

The circadian engine (`src/lib/circadian/`) is complete and all tests pass.
`SleepEntry` and all supporting types are defined in `src/lib/circadian/types.ts`
and are the canonical source of truth — do not redefine them in the DB layer.

The `src/lib/db/` directory exists but contains only a `.gitkeep`.

Two engine functions must be called on every mutating DB operation:

- `normalizeSleepSpan(entry)` — validates timestamps; throws on bad data.
  Call this **before** writing any entry to IDB to catch bad input early.
- `assignCycleNumber(allEntries)` — recomputes cycle numbers for the
  entire store. Call this **after** every create, update, soft-delete,
  hard-delete, or back-fill operation, then write the updated cycle numbers
  back to IDB in a single bulk operation.

Both are exported from `@/lib/circadian` (the public index).

---

## Step 0 — Read Skills

Before writing any code, read:

- `.claude/skills/run/SKILL.md`

---

## Step 1 — Install Dexie.js

```bash
npm install dexie
```

Confirm the exact installed version and record it — it goes in the session report.

---

## Step 2 — Create `src/lib/db/db.ts` — Dexie database definition

Create `src/lib/db/db.ts`. This file defines the Dexie database class,
schema version, and index declarations.

Requirements:

- Import `Dexie` and `Table` from `'dexie'`.
- Import `SleepEntry` as a type from `'@/lib/circadian'`.
- Define a class `CircaLogDB extends Dexie` with a single typed table:
  `sleepEntries: Table<SleepEntry, string>` (the second generic is the
  primary key type — `id` is a UUID string).
- In the constructor, call `super('CircaLogDB')` then call `this.version(1).stores()`
  with the following index string for `sleepEntries`:

  ```db
  'sleepEntries', '&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc'
  ```

  Index notes:
  - `&id` — primary key, unique (the `&` prefix enforces uniqueness).
  - `sleepStartUtc` — used for sorting and range queries (time range toggles).
  - `cycleNumber` — used for cycle grouping in the actogram and history view.
  - `sessionType` — allows filtering main sleep vs. nap.
  - `isDeleted` — allows fast filtering of soft-deleted entries.
  - `wakeUtc` — included for completeness; may be used in future range queries.
  - Fields not listed (quality, notes, interruptions, etc.) are stored in
    full in the object — Dexie stores the entire object; the index string
    only controls which fields are queryable as indexes.

- Export a single shared instance: `export const db = new CircaLogDB()`.
  The service layer imports this instance — nothing else should create a
  new `CircaLogDB()`.

No logic in this file — schema definition and export only.

---

## Step 3 — Create `src/lib/db/sleepEntryService.ts` — CRUD service

Create `src/lib/db/sleepEntryService.ts`. This is the only file that
should import from `./db`. All UI code and hooks must go through this
service — never access `db` directly from React components or hooks.

### Imports

```typescript
import { db } from './db'
import {
  normalizeSleepSpan,
  assignCycleNumber,
} from '@/lib/circadian'
import type { SleepEntry } from '@/lib/circadian'
```

### Helper: `reassignAndPersist`

This internal helper is called after every mutation. It:

1. Reads all entries from `db.sleepEntries.toArray()`.
2. Calls `assignCycleNumber(allEntries)` — returns active entries only,
   sorted and renumbered.
3. Sets `updatedAt` to `new Date().toISOString()` on every entry that
   received a new `cycleNumber` value (compare old vs. new before writing).
4. Bulk-writes the renumbered entries back using `db.sleepEntries.bulkPut(renumbered)`.

Do not export this helper. It is used only inside this file.

### Exported functions

Implement and export the following six functions.
Every function is `async` and returns a `Promise`.

---

#### `createEntry(draft: Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<SleepEntry>`

Creates a new sleep entry.

Steps:

1. Generate a UUID: `const id = crypto.randomUUID()`.
2. Build a full `SleepEntry` object from `draft`, setting:
   - `id` — the generated UUID
   - `cycleNumber: 0` — placeholder; will be replaced by `reassignAndPersist`
   - `sessionType: 'main'` — placeholder; derived below
   - `isDeleted: false`
   - `createdAt: new Date().toISOString()`
   - `updatedAt: new Date().toISOString()`
3. Call `normalizeSleepSpan(entry)` — this validates the timestamps and
   throws a descriptive error if `wakeUtc <= sleepStartUtc`. Let the error
   propagate; the caller (UI) is responsible for handling it.
4. Derive `sessionType` from the normalized span:
   - Import `detectSessionType` from `@/lib/circadian`.
   - Call `detectSessionType(span.durationMs, 0)` and set it on the entry.
5. Write the entry to IDB: `await db.sleepEntries.put(entry)`.
6. Call `await reassignAndPersist()`.
7. Read the updated entry back from IDB: `await db.sleepEntries.get(id)`.
8. Return the updated entry. Throw if not found (should never happen).

---

#### `getAllEntries(): Promise<SleepEntry[]>`

Returns all non-deleted entries sorted by `sleepStartUtc` ascending.

Steps:

1. Query: `await db.sleepEntries.where('isDeleted').equals(0).toArray()`

   **Important Dexie detail:** Dexie stores boolean `false` as the integer
   `0` internally when used as an index value. Use `.equals(0)` — not
   `.equals(false)` — to avoid a type-mismatch bug that silently returns
   zero results. This is a known Dexie behaviour with boolean indexes.

2. Sort the result by `sleepStartUtc` ascending using `.sort()` with a
   string comparison (ISO 8601 strings are lexicographically ordered).

3. Return the sorted array.

---

#### `getEntryById(id: string): Promise<SleepEntry | undefined>`

Returns a single entry by its `id`, or `undefined` if not found.

Steps:

1. `return db.sleepEntries.get(id)`

Include deleted entries — this function is used by the edit and delete
flows, which may need to retrieve a soft-deleted entry to hard-delete it.

---

#### `updateEntry(id: string, changes: Partial<Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'isDeleted'>>): Promise<SleepEntry>`

Updates specific fields on an existing entry.

Steps:

1. Read the existing entry: `const existing = await db.sleepEntries.get(id)`.
   Throw with a descriptive message if not found.
2. Merge changes: `const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() }`.
3. If `sleepStartUtc` or `wakeUtc` was changed, call `normalizeSleepSpan(updated)`
   to validate the new timestamps and re-derive `sessionType`:
   - Call `detectSessionType(span.durationMs, 0)` and set `updated.sessionType`.
4. Write: `await db.sleepEntries.put(updated)`.
5. Call `await reassignAndPersist()`.
6. Read the updated entry back and return it.

---

#### `softDeleteEntry(id: string): Promise<void>`

Marks an entry as deleted without removing it from IDB.

Steps:

1. Read the existing entry. Throw if not found.
2. Set `isDeleted: true` and `updatedAt: new Date().toISOString()`.
3. Write back: `await db.sleepEntries.put(updated)`.
4. Call `await reassignAndPersist()`.

---

#### `hardDeleteEntry(id: string): Promise<void>`

Permanently removes an entry from IDB. This is irreversible.

Steps:

1. `await db.sleepEntries.delete(id)`.
2. Call `await reassignAndPersist()`.

---

### JSDoc comments

Every exported function must have a JSDoc comment explaining:

- What it does in one sentence.
- Any parameter that is not self-evident.
- Any error it throws and under what condition.

Internal helpers do not require JSDoc.

---

## Step 4 — Create `src/lib/db/index.ts` — public API barrel

Create `src/lib/db/index.ts`:

```typescript
export {
  createEntry,
  getAllEntries,
  getEntryById,
  updateEntry,
  softDeleteEntry,
  hardDeleteEntry,
} from './sleepEntryService'
```

Do not export `db` directly from this barrel. The Dexie instance is an
implementation detail of the service layer.

---

## Step 5 — Vitest unit tests

Create `src/lib/db/__tests__/sleepEntryService.test.ts`.

### Test environment

The tests use `fake-indexeddb` — a pure in-memory IDB implementation for
Node.js that works with Dexie without a browser. Install it:

```bash
npm install --save-dev fake-indexeddb
```

At the top of the test file, before any Dexie import, add:

```typescript
import 'fake-indexeddb/auto'
```

This patches the global IDB API so Dexie uses the in-memory version
automatically. No configuration needed beyond this single import line.

### Test isolation

Each test must run against a fresh database. Use `beforeEach` to reset:

```typescript
import { db } from '@/lib/db/db'

beforeEach(async () => {
  await db.sleepEntries.clear()
})
```

### Test fixtures

Do not redeclare `SleepEntry` objects inline in tests. Import from the
existing fixtures:

```typescript
import { realSleepEntries } from '@/lib/circadian/__fixtures__/realData'
```

Use `realSleepEntries[0]` (Cycle 1) as the base fixture for single-entry
tests. Spread it when you need a variant:

```typescript
const draft = {
  sleepStartUtc: realSleepEntries[0].sleepStartUtc,
  wakeUtc: realSleepEntries[0].wakeUtc,
  bedTimeUtc: realSleepEntries[0].bedTimeUtc,
  ianaTimezone: realSleepEntries[0].ianaTimezone,
  quality: realSleepEntries[0].quality,
  notes: realSleepEntries[0].notes,
  hadDreams: realSleepEntries[0].hadDreams,
  interruptions: realSleepEntries[0].interruptions,
  medications: realSleepEntries[0].medications,
}
```

(This is a valid `createEntry` draft — it omits `id`, `cycleNumber`,
`sessionType`, `createdAt`, `updatedAt`, and `isDeleted`, which `createEntry`
sets internally.)

### Required test cases

Write at minimum one test per requirement below.
Use `describe` blocks to group by function name.
Use explicit `import { describe, it, expect, beforeEach } from 'vitest'`.

**`createEntry`**

- Creates an entry with a valid UUID `id`.
- Sets `isDeleted: false`.
- Sets `createdAt` and `updatedAt` as ISO 8601 strings.
- Assigns `cycleNumber: 1` for the first entry in an empty store.
- Detects `sessionType` correctly:
  - `'main'` for a session ≥ 3 hours (use Cycle 1 fixture: 6h).
  - `'nap'` for a session < 3 hours (construct a 2-hour window from any fixture base).
- Throws when `wakeUtc <= sleepStartUtc`.
- Returns the persisted entry (not just the draft).

**`getAllEntries`**

- Returns an empty array when the store is empty.
- Returns all non-deleted entries sorted by `sleepStartUtc` ascending
  when multiple entries are present (seed all 5 `realSleepEntries` via
  `db.sleepEntries.bulkPut(realSleepEntries)` to bypass `createEntry`
  for seeding speed).
- Does not include soft-deleted entries.

**`getEntryById`**

- Returns the correct entry when found.
- Returns `undefined` for an unknown `id`.
- Returns soft-deleted entries (they are not filtered here).

**`updateEntry`**

- Updates the `quality` field of an existing entry.
- Updates `updatedAt` on every call.
- Does not change `createdAt`.
- Recomputes `sessionType` when `wakeUtc` changes (change wake time to
  make a 6h session into a 2h session → `sessionType` becomes `'nap'`).
- Throws when called with an unknown `id`.

**`softDeleteEntry`**

- Sets `isDeleted: true` on the target entry.
- Does not remove the entry from IDB (it should still be findable by
  `getEntryById`).
- Renumbers remaining active entries gaplessly after soft-delete
  (seed two entries; soft-delete entry 1; confirm entry 2 becomes cycle 1).

**`hardDeleteEntry`**

- Removes the entry from IDB entirely (`getEntryById` returns `undefined`).
- Renumbers remaining active entries gaplessly after hard-delete
  (same pattern as the soft-delete renumber test above).

**Cycle reassignment integration**

- Seeding all 5 `realSleepEntries` via `bulkPut`, then calling
  `createEntry` with a back-fill draft (a `sleepStartUtc` earlier than
  all existing entries) correctly renumbers all entries so that the
  new entry gets `cycleNumber: 1` and the others shift up by one.

---

## Step 6 — Run tests

```bash
npm test
```

All tests must pass. If any test fails, fix the service code before
proceeding. Do not skip or comment out failing tests.

---

## Step 7 — TypeScript build check

```bash
npm run build
```

The build must complete with zero TypeScript errors. Fix any type errors
before proceeding.

Note: the build output goes to `dist/` and is not committed. The build
check is only to confirm there are no type errors introduced by the new
files.

---

## Step 8 — Lint check

```bash
npm run lint
```

Fix any ESLint errors or warnings before proceeding.

---

## Step 9 — Session Report

Write a comprehensive Markdown session report and save it to
`tasks/cc-reports/` using the naming convention in
`.claude/memory/feedback_report_conventions.md`:

```text
REPORT_phase1-sleeplog-dblayer_{DD}-{mon}-{YYYY}.md
```

The report must include:

- Every step and its outcome (✅ / ❌ / ⚠️ adapted)
- Packages installed with exact versions (`dexie`, `fake-indexeddb`)
- Full test run output (pass/fail counts)
- Full build output (clean or error text)
- Full lint output (clean or error text)
- Deviations — any step where the task instructions were not followed
  exactly, and the reason why
- A complete list of every file created or modified

Follow the markdownlint rules from `.claude/memory/session_report_policy.md`:
zero warnings allowed. Every fenced code block must have a blank line
before the opening fence and after the closing fence.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 10 — Git commit (after Claude.ai confirmation only)

```bash
git add -A
git commit -m "feat(db): add Dexie sleep entry CRUD service with tests (Phase 1 Batch A)"
```

Do not push. Mahmoud will review and push manually.

---

## Files This Task Creates

| File | Status |
|---|---|
| `src/lib/db/db.ts` | New |
| `src/lib/db/sleepEntryService.ts` | New |
| `src/lib/db/index.ts` | New |
| `src/lib/db/__tests__/sleepEntryService.test.ts` | New |

## Files This Task Modifies

| File | Change |
|---|---|
| `package.json` | `dexie` added to `dependencies`; `fake-indexeddb` added to `devDependencies` |
| `package-lock.json` | Updated by npm |

No existing source files are modified. The circadian engine, AppShell,
components, and all routes are untouched.
