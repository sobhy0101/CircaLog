# CC Task — Phase 1: Data Resilience (JSON Export / Import / Schema Migration)

**Tier:** 2 — multi-file, new UI routes, new DB version, new utility module

**Prerequisite reads (before writing any code):**

- `CLAUDE.md` — platform rules, React import rules, non-negotiables
- `.claude/memory/MEMORY.md` — full project context
- `.claude/skills/token-usage/SKILL.md` — color tokens (new UI uses design system)
- `.claude/skills/visual-check/SKILL.md` — visual verification procedure
- `.claude/memory/session_report_policy.md` — report format and markdownlint rules

---

## Context

IndexedDB storage can be silently evicted by the browser (low-disk cleanup,
site data clearing, browser reinstall). For a patient tracking months or years
of personal health data, this is a real risk. Supabase sync is the long-term
answer, but it requires sign-in. JSON export/restore is the signed-out safety
net that works for every user regardless of auth state.

This task delivers three things:

1. **JSON export** — one-tap full backup of all `SleepEntry` records from
   IndexedDB, saved as a `.json` file to the user's device.
2. **JSON restore** — upload a CircaLog backup file, choose merge-or-replace,
   preview counts, confirm, done.
3. **Schema migration handler** — a utility that runs on restore to detect and
   upgrade a backup JSON from an older `SCHEMA_VERSION` to the current one,
   so restored data is always safe to use.

The `profiles` table population task is **already complete** — both accounts
(`sobhy0101@gmail.com` and `circalog.app@gmail.com`) were confirmed present
in Supabase on 11 Jun 2026. Do not re-run that work.

---

## Scope

### New files

| File | Purpose |
|---|---|
| `src/utils/backupSchema.ts` | `SCHEMA_VERSION` constant, `CircaLogBackup` type, `migrateBackup()` function |
| `src/hooks/useExport.ts` | React hook — reads all entries from IDB, serialises to JSON, triggers browser download |
| `src/hooks/useRestore.ts` | React hook — state machine for the JSON restore flow |
| `src/pages/log/ExportPage.tsx` | JSON export page (entry point for the future Export hub) |
| `src/pages/log/RestorePage.tsx` | JSON restore page |

> **Naming note:** A `useImport.ts` hook already exists for CSV import
> (`src/hooks/useImport.ts`). The JSON restore hook is named `useRestore.ts`
> to avoid a collision.

### Modified files

| File | Change |
|---|---|
| `src/lib/db/db.ts` | Bump Dexie schema to version 3 |
| `src/App.tsx` | Add routes `/log/export` and `/log/restore` |
| `src/components/layout/SideDrawer.tsx` | Wire existing "Export" button → `/log/export`; add new "Restore Backup" entry after "Import" |

---

## Step 1 — Read prerequisite files

Read all files listed in the prerequisite block at the top of this task before
writing any code.

---

## Step 2 — Implement `src/utils/backupSchema.ts`

Create this file. It has no React dependency — pure TypeScript.

### `SCHEMA_VERSION`

```ts
export const SCHEMA_VERSION = 1
```

This integer is embedded in every export file. Increment it whenever a breaking
change is made to `SleepEntry`'s shape (field renames, type changes, removals).
Additive changes (new optional fields) do not require a version bump.

### `CircaLogBackup` type

```ts
import type { SleepEntry } from '@/lib/circadian'

export interface CircaLogBackup {
  schemaVersion: number      // value of SCHEMA_VERSION at export time
  exportedAt: string         // ISO 8601 UTC timestamp
  appVersion: string         // from import.meta.env.VITE_APP_VERSION or 'unknown'
  entryCount: number         // length of entries array — for quick validation
  entries: SleepEntry[]
}
```

### `migrateBackup(raw: unknown): CircaLogBackup`

This function accepts whatever was parsed from the uploaded JSON file, validates
its basic shape, and migrates it to the current schema version if needed.

Rules:

- If `raw` is not an object, throw `new Error('Invalid backup file: not a JSON object')`.
- If `raw.schemaVersion` is missing or not a number, throw
  `new Error('Invalid backup file: missing schemaVersion')`.
- If `raw.entries` is not an array, throw
  `new Error('Invalid backup file: entries must be an array')`.
- If `raw.schemaVersion > SCHEMA_VERSION`, throw
  `new Error('This backup was created by a newer version of CircaLog. Please update the app before restoring.')`.
- If `raw.schemaVersion === SCHEMA_VERSION`, return `raw` cast to `CircaLogBackup`
  after patching `entryCount` to match `raw.entries.length` (trust the array,
  not the stored count).
- If `raw.schemaVersion < SCHEMA_VERSION`, apply the migration chain (see below).

**Migration chain** — currently empty because `SCHEMA_VERSION` starts at 1 and
there is no prior version to migrate from. The chain must be written as a series
of `if (version < N)` blocks so future migrations can be appended without
restructuring the function:

```ts
let data = structuredClone(raw) as Record<string, unknown>
let version = data.schemaVersion as number

// To add a future migration: append an `if (version < N)` block below.
// Each block patches data in-place and increments version.
// Example (do not uncomment — for documentation only):
//   if (version < 2) { /* rename fields, add defaults, etc. */ version = 2 }
//   if (version < 3) { /* further changes */ version = 3 }

data.schemaVersion = SCHEMA_VERSION
data.entryCount = (data.entries as unknown[]).length
return data as unknown as CircaLogBackup
```

Write the comment block above verbatim — it explains the pattern to future
developers (and to Mahmoud).

---

## Step 3 — Implement `src/hooks/useExport.ts`

This hook handles the full export flow. It has one exported function: an
`exportBackup()` callback that callers trigger from a button.

### Behaviour

1. Read all entries from IndexedDB using `getAllEntries()` from `@/lib/db`.
   `getAllEntries()` already filters soft-deleted entries — this is correct.
   Soft-deleted entries are intentionally excluded: the user deleted them, and
   restoring them would be surprising and wrong.
2. Build a `CircaLogBackup` object:
   - `schemaVersion`: `SCHEMA_VERSION`
   - `exportedAt`: `new Date().toISOString()`
   - `appVersion`: `import.meta.env.VITE_APP_VERSION ?? 'unknown'`
   - `entryCount`: `entries.length`
   - `entries`: the array from step 1
3. Serialise to JSON with `JSON.stringify(backup, null, 2)` (pretty-printed for
   human readability — the file size difference is negligible for typical entry
   counts).
4. Trigger a browser download:
   - Filename: `circalog-backup-YYYY-MM-DD.json` where the date is the local
     date at export time. Derive it with:
     `new Date().toLocaleDateString('sv')` — the `sv` (Swedish) locale always
     produces `YYYY-MM-DD` regardless of the user's device locale settings.
     Add an inline comment explaining why `sv` locale is used.
   - Use the `URL.createObjectURL` / anchor-click pattern. Remember to call
     `URL.revokeObjectURL` after the click to free memory.
5. Expose a `status` state: `'idle' | 'exporting' | 'done' | 'error'` and an
   `errorMessage: string | null` so the UI can reflect what is happening.
6. The hook returns `{ exportBackup, status, errorMessage }`.

---

## Step 4 — Implement `src/hooks/useRestore.ts`

This hook manages the full restore flow as a state machine with the following
phases:

```txt
idle → parsing → previewing → restoring → done ↘ error (any phase)
```

### Exposed API

```ts
{
  phase:          RestorePhase
  preview:        RestorePreview | null   // populated after parse succeeds
  restoredCount:  number | null           // populated after restore completes
  errorMessage:   string | null
  handleFile:     (file: File) => Promise<void>
  confirmReplace: () => Promise<void>
  confirmMerge:   () => Promise<void>
  reset:          () => void
}
```

### `RestorePreview` type (define locally in the hook file)

```ts
interface RestorePreview {
  entryCount: number       // entries in the backup file
  exportedAt: string       // ISO 8601 UTC string from the backup
  schemaVersion: number
  duplicateCount: number   // entries already present in IDB (matched by id)
  newCount: number         // entries not in IDB
}
```

### `handleFile(file: File)`

1. Set phase to `'parsing'`.
2. Read file with `file.text()`.
3. Parse with `JSON.parse`. If it throws, set `errorMessage` and phase to
   `'error'`.
4. Pass to `migrateBackup()`. If it throws, set `errorMessage` and phase to
   `'error'`.
5. Load all current IDB entry ids:
   `const existing = new Set((await getAllEntries()).map(e => e.id))`.
6. Calculate `duplicateCount` and `newCount` from the backup entries vs the
   existing set.
7. Store the parsed backup in a ref (not state — it can be large and does not
   need to trigger re-renders on its own).
8. Set `preview` and phase to `'previewing'`.

### `confirmReplace()`

1. Set phase to `'restoring'`.
2. Wipe IDB completely: use `db.sleepEntries.toArray()` to fetch ALL entries
   (including soft-deleted ones), then call `hardDeleteEntry(id, null)` for
   each. Using `getAllEntries()` here would be wrong — it excludes soft-deleted
   entries, so soft-deleted records would survive the wipe.

   > `hardDeleteEntry` attempts a Supabase soft-delete before the local IDB
   > delete. When `user` is `null`, the Supabase step is skipped automatically
   > (the function already guards on this). Restore does not require sign-in.

3. Write all backup entries directly with `db.sleepEntries.bulkPut()`. Do NOT
   use `createEntry()` here — `createEntry()` generates a new UUID, which would
   lose the original entry ids. Preserving ids is essential for duplicate
   detection on future restores and for Supabase sync correctness.

   > Import `db` from `@/lib/db/db` (not from the index). Add an inline comment
   > explaining why `bulkPut` is used directly instead of `createEntry`.

4. After `bulkPut`, read ALL entries from IDB with `db.sleepEntries.toArray()`,
   call `assignCycleNumber` on the full set, then `bulkPut` the renumbered
   entries back. This matches the behaviour of `reassignAndPersist` in the
   service layer.
5. Set `restoredCount` to `backup.entries.length` and phase to `'done'`.

### `confirmMerge()`

Same as `confirmReplace` except:

- Skip step 2 (no wipe).
- In step 3, filter `backup.entries` to only those whose `id` is NOT already
  in the existing set (built during `handleFile`) before calling `bulkPut`.
- In step 4, read ALL entries from IDB for the renumber pass — not just the
  newly inserted ones. Inserting entries chronologically between existing
  entries would shift their cycle number positions; renumbering only the new
  entries would leave the existing entries with stale numbers.
- Set `restoredCount` to `preview.newCount` and phase to `'done'`.

### Error handling

Wrap `confirmReplace` and `confirmMerge` in try/catch. On any error, set
`errorMessage` and phase to `'error'`.

---

## Step 5 — Implement `src/pages/log/ExportPage.tsx`

A clean, simple full page. Uses the design system tokens only — no hardcoded
colours. Follow the `ImportPage.tsx` layout pattern: a plain `<div>` as the
root, not an `<AppShell>` import.

### Layout

```tsx
<div root>

  <header>
    ← back button (navigate(-1))
    Export
  </header>

  <main>
    ← icon (download/archive SVG, inline)
    <h1>Export your sleep data</h1>
    <p>
      Downloads a complete backup of all your sleep sessions as a JSON file.
      Store it somewhere safe — Google Drive, email to yourself, a USB drive.
    </p>

    ← entry count line: "X sessions will be exported"
      (loaded from getAllEntries() on mount — just .length)

    <button onClick={exportBackup} disabled={status === 'exporting'}>
      {status === 'exporting' ? 'Exporting…' : 'Download Backup (.json)'}
    </button>

    ← success message when status === 'done':
      "✓ Backup saved. Keep this file somewhere safe."

    ← error message when status === 'error':
      errorMessage

    <section>  ← small print / info block
      <h2>What's included</h2>
      <ul>
        <li>All active sleep sessions</li>
        <li>Sleep start and wake times, quality ratings, notes, and all
            optional fields</li>
        <li>Cycle numbers and session types</li>
      </ul>

      <h2>What's not included</h2>
      <ul>
        <li>Deleted sessions</li>
        <li>Account or profile information</li>
      </ul>
    </section>

  </main>

</div>
```

### Notes

- No sign-in gate. Export works for all users.
- The download button must be disabled (and show "Exporting…") while
  `status === 'exporting'` to prevent double-taps.

---

## Step 6 — Implement `src/pages/log/RestorePage.tsx`

Four distinct UI phases. Follow the `ImportPage.tsx` layout pattern.

### Phase: `idle`

```tsx
<header> ← back button (navigate(-1)) + "Restore Backup" title </header>

<main>
  ← icon (upload/restore SVG)
  <h1>Restore from backup</h1>
  <p>
    Select a CircaLog backup file (.json) to restore your sleep data.
    You will be able to preview what will be restored before confirming.
  </p>

  ← hidden <input type="file" accept=".json"> with a ref
  ← styled button that calls inputRef.current?.click()
    Label: "Choose backup file"

  ← warning callout (visually distinct — border + tinted background):
    "⚠ Replace mode will permanently delete all current sessions before
    restoring. Merge mode is safer if you have any unsaved data."
</main>
```

### Phase: `parsing`

```tsx
<main>
  ← spinner / loading indicator
  Reading backup file…
</main>
```

### Phase: `previewing`

```tsx
<main>
  <h2>Backup summary</h2>
  ← key-value pairs:
    Exported        {preview.exportedAt formatted as local date + time}
    Sessions        {preview.entryCount}
    New to add      {preview.newCount}
    Already present {preview.duplicateCount}

  <h2>Choose restore mode</h2>

  ← Merge button (primary style):
    "Merge — add {preview.newCount} new session(s)"
    Subtext: "Keeps your existing data. Skips {preview.duplicateCount} duplicate(s)."
    Disabled and visually greyed out if preview.newCount === 0

  ← Replace button (danger style — use circa-error token for border and text):
    "Replace — delete everything and restore {preview.entryCount} session(s)"
    Subtext: "All current sessions will be permanently deleted first."

  ← Cancel button → reset() → back to idle
</main>
```

### Phase: `restoring`

```tsx
<main>
  ← spinner
  Restoring sessions…
</main>
```

### Phase: `done`

```tsx
<main>
  ← success icon
  <h1>Restore complete</h1>
  <p>{restoredCount} session(s) restored.</p>
  <button onClick={() => navigate('/log/history')}>
    View sleep history
  </button>
</main>
```

### Phase: `error`

```tsx
<main>
  ← error icon
  <h1>Restore failed</h1>
  <p>{errorMessage}</p>
  <button onClick={reset}>Try again</button>
</main>
```

### Notes

- No sign-in gate. Restore works for all users.
- The Replace button uses `circa-error` token for its border and text colour
  to signal the destructive action. Do not invent a colour outside the token
  system — check `.claude/skills/token-usage/SKILL.md` first.
- File input pattern: hidden `<input type="file">` with a ref, styled
  `<button onClick={() => inputRef.current?.click()}>` wrapper. The file's
  `onChange` calls `handleFile`. This matches the pattern in `ImportPage.tsx`.

---

## Step 7 — Bump Dexie schema version in `src/lib/db/db.ts`

Read `db.ts` before editing. Add version 3 after the existing version 2 block.
No structural change is needed to the IndexedDB stores for this task — the
bump is a housekeeping step to mark that the codebase has moved forward.

```ts
// Version 3 — no store structure changes.
// Note: the Dexie version number and the app's SCHEMA_VERSION constant
// (src/utils/backupSchema.ts) are separate counters that track different
// things. Dexie version = IndexedDB store structure changes. SCHEMA_VERSION
// = the shape of SleepEntry in backup files. They will diverge over time.
this.version(3).stores({
  sleepEntries: '&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc',
  syncQueue:    '&id, queuedAt',
})
```

Write the comment above verbatim.

---

## Step 8 — Add routes in `src/App.tsx`

Read `src/App.tsx` before editing. Add the two new routes inside the `/log`
block, alongside the existing `/log/import` route:

```tsx
<Route path="export"  element={<ExportPage />} />
<Route path="restore" element={<RestorePage />} />
```

Import `ExportPage` and `RestorePage` from their new page files.

---

## Step 9 — Update `src/components/layout/SideDrawer.tsx`

Read `SideDrawer.tsx` before editing. Two changes:

**Change A — Wire the existing "Export" button.**

The current "Export" button is an unconnected `<button>`. Replace it with a
working navigation entry that navigates to `/log/export` and closes the drawer:

```tsx
<button
  onClick={() => { navigate('/log/export'); onClose(); }}
  className="..."
>
  ...
  Export
</button>
```

Keep the existing icon and className unchanged — only add the `onClick`.

**Change B — Add "Restore Backup" entry after "Import".**

Insert a new drawer entry immediately after the existing "Import" button.
Use the same `navigate('/log/restore'); onClose()` pattern:

```tsx
{/* Restore Backup */}
<button
  onClick={() => { navigate('/log/restore'); onClose(); }}
  className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {/* Rotate-left / restore icon */}
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
  </svg>
  Restore Backup
</button>
```

**Do not** rename the existing "Import" button or change anything else in the
drawer. The "Import" label and its route (`/log/import`) stay exactly as they
are. Full hub consolidation (grouping Export, Import, and Restore under
dedicated hub pages) is a separate future task — do not scope-creep into it
here.

---

## Step 10 — Visual verification

Follow `.claude/skills/visual-check/SKILL.md`.

Check all of the following:

- [ ] `/log/export` renders correctly in dark mode
- [ ] `/log/export` renders correctly in light mode
- [ ] Entry count shows a real number (not 0 or undefined)
- [ ] Download button triggers a file save with the correct `circalog-backup-YYYY-MM-DD.json` filename
- [ ] Downloaded file is valid JSON with `schemaVersion`, `exportedAt`, `entryCount`, `entries`
- [ ] `/log/restore` renders correctly in dark and light modes
- [ ] File picker opens when "Choose backup file" is tapped
- [ ] Previewing phase shows correct counts after selecting a valid backup
- [ ] Merge flow completes without errors; `restoredCount` matches `newCount`
- [ ] Replace flow completes without errors; `restoredCount` matches `entryCount`
- [ ] Error phase renders with a readable message for an invalid JSON file
- [ ] "Export" in the drawer navigates to `/log/export` and closes the drawer
- [ ] "Restore Backup" in the drawer navigates to `/log/restore` and closes the drawer
- [ ] No TypeScript errors (`npm run build` clean)

---

## Step 11 — Session report

Write the session report to `tasks/cc-reports/` following the naming
convention in `.claude/memory/session_report_policy.md`:

```txt
REPORT_phase1-data-resilience_{DD}-{mon}-{YYYY}.md
```

The report must include:

- Every step and its outcome (✅ / ❌ / ⚠️ adapted)
- Packages installed (none expected — confirm explicitly)
- Build output (clean or full error text)
- All visual verification results
- Any deviations from these instructions and the reason
- Complete list of files created and modified

After writing the report, paste a short summary into the Claude.ai chat and
**wait for confirmation** before running `git commit`.

---

## Step 12 — Commit (after Claude.ai confirms)

```powershell
git add -A
git commit -m "feat: JSON export, restore, schema migration handler (Data Resilience)"
git push
```

---

## Files this task must NOT touch

- Any file under `src/lib/circadian/` (pure engine layer)
- `src/hooks/useImport.ts` (CSV import hook — separate feature)
- `src/pages/log/ImportPage.tsx` (CSV import page — separate feature)
- Anything under `tasks/` except the session report written in Step 11
- `supabase/` migrations — no database schema changes in this task
