# REPORT — Phase 1: Sleep Log DB Layer (Batch A)

**Date:** 03 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_SleepLog_DBLayer.md`
**Branch:** main
**Status:** ✅ Complete — all tests pass, build clean, lint clean

---

## Step 0 — Read Skills ✅

Read `.claude/skills/run/SKILL.md` before starting. Confirmed: Windows PowerShell only,
no bash syntax.

---

## Step 1 — Install Dexie.js ✅

```powershell
npm install dexie
npm install --save-dev fake-indexeddb
```

**Exact versions installed:**

| Package | Version | Destination |
|---|---|---|
| `dexie` | 4.4.3 | `dependencies` |
| `fake-indexeddb` | 6.2.5 | `devDependencies` |

No vulnerabilities, no peer dependency warnings.

---

## Step 2 — Create `src/lib/db/db.ts` ✅

Created with:

- `CircaLogDB extends Dexie` class
- Single typed table: `sleepEntries: Table<SleepEntry, string>`
- Version 1 schema with index string: `'&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc'`
- Single shared instance exported: `export const db = new CircaLogDB()`
- `SleepEntry` imported as a type from `@/lib/circadian`
- No logic — schema definition and export only

---

## Step 3 — Create `src/lib/db/sleepEntryService.ts` ✅

Created with all six exported functions plus the internal `reassignAndPersist` helper.

### Functions implemented

| Function | Description |
|---|---|
| `createEntry` | Creates entry, validates span, derives sessionType, writes, reassigns cycles |
| `getAllEntries` | Returns active entries sorted by `sleepStartUtc` ascending |
| `getEntryById` | Returns entry by id (including soft-deleted) |
| `updateEntry` | Merges changes, re-validates span if timestamps changed, reassigns cycles |
| `softDeleteEntry` | Sets `isDeleted: true`, reassigns cycles |
| `hardDeleteEntry` | Permanently removes entry from IDB, reassigns cycles |

### `reassignAndPersist` logic

1. `db.sleepEntries.toArray()` — reads all entries
2. `assignCycleNumber(allEntries)` — returns active entries with new cycle numbers
3. Compares old vs. new `cycleNumber` per entry; only entries that changed get written
4. Sets `updatedAt` on changed entries
5. `db.sleepEntries.bulkPut(toUpdate)` — bulk-writes only changed entries

---

## Step 4 — Create `src/lib/db/index.ts` ✅

Barrel file exporting the six public service functions. `db` instance not exported
(it is an implementation detail of the service layer).

---

## Step 5 — Vitest unit tests ✅

Created `src/lib/db/__tests__/sleepEntryService.test.ts`.

`fake-indexeddb/auto` imported first (before any Dexie import) to patch the global
IDB API. `beforeEach` clears `db.sleepEntries` for isolation.

### Test groups and cases

**`createEntry` (7 tests)**

- Creates entry with a valid UUID v4 id
- Sets `isDeleted: false`
- Sets `createdAt` and `updatedAt` as ISO 8601 strings
- Assigns `cycleNumber: 1` for the first entry in an empty store
- Detects `sessionType: 'main'` for Cycle 1 fixture (6h session)
- Detects `sessionType: 'nap'` for a 2-hour window
- Throws when `wakeUtc <= sleepStartUtc`
- Returns the persisted entry (read-back from IDB)

**`getAllEntries` (3 tests)**

- Returns `[]` for an empty store
- Returns all 5 non-deleted entries sorted ascending after `bulkPut`
- Excludes the one soft-deleted entry from results

**`getEntryById` (3 tests)**

- Returns the correct entry when found
- Returns `undefined` for an unknown id
- Returns soft-deleted entries (not filtered here)

**`updateEntry` (5 tests)**

- Updates `quality` field
- Updates `updatedAt` on every call
- Does not change `createdAt`
- Recomputes `sessionType` when `wakeUtc` changes (6h → 2h becomes `'nap'`)
- Throws for unknown id

**`softDeleteEntry` (3 tests)**

- Sets `isDeleted: true`
- Entry remains findable by `getEntryById`
- Renumbers remaining active entries gaplessly (entry 1 deleted → entry 2 becomes cycle 1)

**`hardDeleteEntry` (2 tests)**

- Entry is permanently gone (`getEntryById` returns `undefined`)
- Renumbers remaining active entries gaplessly

**Cycle reassignment integration (1 test)**

- Back-fill entry (sleepStartUtc before all fixtures) inserted into a store seeded
  with all 5 real entries. Back-fill gets cycle 1; original cycle 1 → cycle 2;
  original cycle 5 → cycle 6.

---

## Step 6 — Run tests ✅

**Final result:**

```text
 RUN  v4.1.8 C:/Projects/CircaLog

 Test Files  2 passed (2)
      Tests  68 passed (68)
   Start at  16:59:29
   Duration  846ms
```

All 68 tests pass (25 new DB layer tests + 43 existing circadian engine tests).

---

## Step 7 — TypeScript build check ✅

```text
> circalog@0.0.0 build
> tsc -b && vite build

✓ 75 modules transformed.
dist/assets/index-BDE2h3S8.js   454.41 kB │ gzip: 129.91 kB

✓ built in 1.65s
```

Zero TypeScript errors. Build output not committed.

---

## Step 8 — Lint check ✅

```powershell
npm run lint
```

No output — zero ESLint errors or warnings.

---

## Deviations

### `getAllEntries` — Dexie 4.x boolean index incompatibility ⚠️ adapted

**Task instruction:** Use `.where('isDeleted').equals(0)` because "Dexie stores boolean
`false` as the integer `0` internally when used as an index value."

**What happened:** This instruction documents Dexie 3.x behavior. Dexie 4.4.3 (installed)
no longer coerces booleans to integers before indexing. The IndexedDB spec does not include
boolean as a valid key type. In Dexie 4.x with `fake-indexeddb`:

- `.equals(0)` — ran without error but returned 0 results (entries with `isDeleted: false`
  are not indexed, because `false` is not a valid IDB key type)
- `.equals(false)` — threw `DataError: Data provided to an operation does not meet
  requirements` (boolean is not a valid IDB key type per spec)

**Fix applied:** Replaced the indexed query with `toArray()` + JS filter:

```typescript
const all = await db.sleepEntries.toArray()
return all
  .filter(e => !e.isDeleted)
  .sort((a, b) => a.sleepStartUtc.localeCompare(b.sleepStartUtc))
```

This is version-agnostic, spec-compliant, and appropriate for an offline-first app with
a small number of records. The `isDeleted` index entry in the schema string is retained
for potential future use (it does no harm even if unused as a query index).

**First test run (before fix):** 3 tests failed — the three `getAllEntries` and integration
tests that seeded via `bulkPut`.

**Second attempt (`.equals(false)`):** 4 tests failed — threw `DataError` on the empty-store
test as well.

**After fix:** 68/68 tests pass.

---

## Files Created

| File | Description |
|---|---|
| `src/lib/db/db.ts` | Dexie database class and shared instance |
| `src/lib/db/sleepEntryService.ts` | CRUD service — 6 exported functions + `reassignAndPersist` |
| `src/lib/db/index.ts` | Public API barrel — re-exports service functions |
| `src/lib/db/__tests__/sleepEntryService.test.ts` | 25 Vitest tests across 7 describe blocks |

## Files Modified

| File | Change |
|---|---|
| `package.json` | `dexie` added to `dependencies`; `fake-indexeddb` added to `devDependencies` |
| `package-lock.json` | Updated by npm |

No existing source files were modified. The circadian engine, AppShell, components,
and all routes are untouched.
