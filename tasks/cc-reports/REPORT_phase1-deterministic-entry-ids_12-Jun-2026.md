# Session Report — Phase 1: Deterministic Entry IDs

**Date:** 12 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_DeterministicEntryIds.md`
**Branch:** main

---

## Summary

Implemented deterministic, content-addressed UUIDs for sleep entries created
during CSV import. Previously, each import of the same sleep session generated
a new random UUID, causing duplicate rows in both IndexedDB and Supabase.
Now, `deriveEntryId(userId, sleepStartUtc)` produces a stable UUID via SHA-256,
so re-importing the same session any number of times is idempotent — the
second import finds the existing IDB record by primary key and skips it.

Supabase's existing `upsert({ onConflict: 'id' })` in `syncService.ts` means
the same guarantee extends to the cloud: a second push of the same entry
updates in place rather than duplicating.

---

## Files Created

| File | Description |
|---|---|
| `src/lib/db/deriveEntryId.ts` | **New.** Exports `deriveEntryId(userId, sleepStartUtc): Promise<string>`. SHA-256 via `crypto.subtle`; first 16 bytes formatted as a UUID; version nibble set to 5, RFC 4122 variant bits set on byte 8. |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/db/sleepEntryService.ts` | Added optional third parameter `overrideId?: string` to `createEntry`. When provided, uses it as the entry `id`; otherwise falls back to `crypto.randomUUID()`. All existing callers are unaffected. |
| `src/hooks/useImport.ts` | Added `import { deriveEntryId }` at top. Replaced the `sleepStartUtc` index-scan duplicate check with a primary-key lookup on the derived `entryId`. Passes `entryId` to `createEntry` as the third argument. |
| `src/lib/supabase/syncService.ts` | `SYNC_ENABLED` restored to `true` (see deviation note below). |

---

## Build Output

```
> circalog@0.1.0 build
> tsc -b && vite build

✓ 688 modules transformed.
✓ built in 855ms

Exit code: 0
Errors: 0
Warnings: 0
```

---

## Deviations from Task Instructions

### Step 5 — `SYNC_ENABLED` already flipped

The task precondition states "`SYNC_ENABLED` is currently `false`", and Step 5
instructs flipping it to `true` as the final code change.

When the files were read at the start of this session, `syncService.ts` already
had `SYNC_ENABLED = true` in the working tree (confirmed via `git diff`). The
committed value on the `58a6d9f` commit is `false`, but an uncommitted
working-tree edit had already made the change before this session ran.

**Action taken:** Left the file as-is (`SYNC_ENABLED = true`). The intended
end-state is correct; the change is already present and is included in the
files staged for the commit below.

---

## Confirmation: `SYNC_ENABLED = true`

`src/lib/supabase/syncService.ts` line 35:

```typescript
const SYNC_ENABLED = true
```

Sync is re-enabled. Every `createEntry`, `updateEntry`, `softDeleteEntry`, and
`syncOnConnect` call will now push to Supabase as intended.

---

## Next Step for Mahmoud

Proceed with **steps 8–11** of `docs/CLEANUP_duplicate-entries-plan.md`:

- Run the app, sign in, and import the CSV to repopulate the database.
- Verify that a second import of the same CSV produces 0 new entries
  (all rows skipped).
- Confirm the Supabase `sleep_entries` table row count matches IDB.
- Once verified, mark the cleanup procedure complete.
