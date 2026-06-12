# CC Task — Phase 1: Deterministic Entry IDs

**Purpose:** Eliminate the root cause of duplicate sleep entries by making
the entry `id` deterministic — derived from `userId + sleepStartUtc` rather
than a random UUID. The same sleep session will always receive the same UUID
on any device, in any browser, regardless of how many times the CSV is
imported. Supabase's existing `upsert` on `id` then deduplicates naturally.

**Context:** Part of the ongoing duplicate-entry cleanup procedure.
See `docs/CLEANUP_duplicate-entries-plan.md` for the full picture.
This task covers steps 6 and 7 of that plan.

**Pre-condition:** The `sleep_entries` Supabase table is at 0 rows and all
browser IDBs have been cleared. `SYNC_ENABLED` is currently `false` in
`src/lib/supabase/syncService.ts`. Do not change this until the final
code step below.

---

## Step 1 — Read all files that will be modified

Read these files in full before writing a single line of code:

- `src/lib/db/sleepEntryService.ts`
- `src/lib/db/index.ts`
- `src/hooks/useImport.ts`
- `src/lib/supabase/syncService.ts`

---

## Step 2 — Create `src/lib/db/deriveEntryId.ts`

Create this new file. It has no external dependencies — it uses the Web
Crypto API (`crypto.subtle`) which is built into every modern browser and
into Node.js >= 19.

```typescript
/**
 * deriveEntryId.ts
 *
 * Produces a deterministic UUID from a userId and sleepStartUtc string.
 * The same pair of inputs always produces the same UUID, making it safe
 * to re-import the same sleep session any number of times on any device.
 *
 * Implementation:
 *   - SHA-256 via the Web Crypto API (no external dependency).
 *   - First 16 bytes of the digest formatted as a UUID string.
 *   - Version bits (byte 6) set to 5; RFC 4122 variant bits (byte 8) set.
 *
 * @param userId       - The authenticated user's Supabase UUID.
 * @param sleepStartUtc - ISO 8601 UTC timestamp of sleep onset.
 * @returns A UUID string in standard 8-4-4-4-12 format.
 */
export async function deriveEntryId(
  userId: string,
  sleepStartUtc: string
): Promise<string> {
  const input = `${userId}:${sleepStartUtc}`
  const encoded = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const bytes = new Uint8Array(hashBuffer)

  // Set version nibble to 5 (name-based / SHA-1-derived UUID variant)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  // Set RFC 4122 variant bits: 10xx in the top two bits of byte 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Format first 16 bytes as xxxxxxxx-xxxx-5xxx-yxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}
```

---

## Step 3 — Update `src/lib/db/sleepEntryService.ts`

Add an optional third parameter `overrideId?: string` to `createEntry`.
When provided, use it as the entry id; otherwise fall back to
`crypto.randomUUID()`.

The exact signature change (read the file first to confirm context):

```typescript
export async function createEntry(
  draft: Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
  user: User | null = null,
  overrideId?: string          // NEW — omit to get a random UUID as before
): Promise<SleepEntry> {
  const id = overrideId ?? crypto.randomUUID()   // changed from: const id = crypto.randomUUID()
  // ... rest of function unchanged
```

No other changes to this file. All existing callers receive the same
behaviour they had before because `overrideId` defaults to `undefined`.

---

## Step 4 — Update `src/hooks/useImport.ts`

Two changes inside `startImport`:

### 4a — Add the import at the top of the file

```typescript
import { deriveEntryId } from '@/lib/db/deriveEntryId'
```

### 4b — Replace the duplicate check and createEntry call

Current code in the `for` loop:

```typescript
// Duplicate detection: skip if sleepStartUtc already exists in IDB.
const existing = await db.sleepEntries
  .where('sleepStartUtc')
  .equals(row.draft.sleepStartUtc)
  .count()

if (existing > 0) {
  skipped++
} else {
  await createEntry(row.draft, user)
  imported++
}
```

Replace with:

```typescript
// Derive the deterministic id for this session.
// user is always non-null here — the gate check enforces signedIn before
// the import loop is ever reached.
const entryId = await deriveEntryId(user!.id, row.draft.sleepStartUtc)

// Duplicate check: a direct primary-key lookup is cheaper than an index
// scan, and with deterministic ids it is exactly equivalent to checking
// sleepStartUtc for the same user. Skip regardless of isDeleted status —
// if the user previously deleted this entry, respect that decision.
const existing = await db.sleepEntries.get(entryId)

if (existing) {
  skipped++
} else {
  await createEntry(row.draft, user, entryId)
  imported++
}
```

No other changes to this file.

---

## Step 5 — Update `src/lib/supabase/syncService.ts`

Flip the kill switch. Change exactly this one line:

```typescript
const SYNC_ENABLED = false
```

to:

```typescript
const SYNC_ENABLED = true
```

Leave the comment block above it intact — it documents the procedure for
any future cleanup that might need the same technique.

---

## Step 6 — Build check

Run the TypeScript build to confirm no type errors:

```powershell
npm run build
```

Expected: build completes with 0 errors. If errors appear, fix them before
proceeding. Do not commit a broken build.

---

## Step 7 — Session report

Write a Markdown session report to:

```txt
tasks/cc-reports/REPORT_phase1-deterministic-entry-ids_{DD}-{mon}-{YYYY}.md
```

The report must cover:

- Summary of changes made and why
- Exact list of files created or modified (with a one-line description of
  each change)
- Build output (exit code and any warnings)
- Any deviations from these task instructions, with reasoning
- Confirmation that `SYNC_ENABLED` is now `true`
- Next step for Mahmoud: proceed with steps 8–11 of
  `docs/CLEANUP_duplicate-entries-plan.md`

Follow markdownlint rules: blank line before and after every fenced code
block, zero warnings.

Paste a short summary (5–10 lines) into the Claude.ai chat and **wait for
Mahmoud's confirmation before running the git commit**.

---

## Step 8 — Git commit (only after confirmation)

```powershell
git add src/lib/db/deriveEntryId.ts `
        src/lib/db/sleepEntryService.ts `
        src/hooks/useImport.ts `
        src/lib/supabase/syncService.ts `
        tasks/cc-reports/REPORT_phase1-deterministic-entry-ids_*.md `
        docs/CLEANUP_duplicate-entries-plan.md
git commit -m "feat: deterministic entry IDs for import deduplication + re-enable sync"
git push
```
