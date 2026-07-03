# CC Task — Phase 1: Input Sanitization on Free-Text Fields

**Tier:** 2 (new file + 5 edited files, new pattern, build/lint/test verification required)
**Origin:** `docs/CircaLog-TO-DO-list.md` → 🔒 Security → "Input sanitization on all free-text fields"
**Decided with Mahmoud (Jun 2026):**
- Max lengths: `notes`/`dreamNotes` = 2000, `Interruption.note` = 500, `Medication.name` = 200
- Over-length input is **rejected with an error**, never silently truncated
- Enforcement happens at the app layer, before data reaches IndexedDB or Supabase
- All relevant form fields get a `maxLength` attribute + live character counter

**Scope note:** Today's actual free-text surface is `notes`, `dreamNotes`,
`Interruption.note`, and `Medication.name` (V1 legacy field — currently
hardcoded to `'Yes'` in the UI, never user-typed, but the type permits a
free string so it is sanitized defensively). V2 fields (`DoseLogEntry.note`,
`MealLogEntry.note`, drink log notes) don't exist yet — they aren't part of
this task, but the new utility is written so they can reuse it later.

---

## Step 1 — Create `src/utils/sanitizeText.ts`

This is a new file. Create it with exactly this content:

```typescript
// sanitizeText.ts — Defensive input sanitization for free-text fields on
// SleepEntry, applied at the single persistence chokepoint (sleepEntryService)
// before any write reaches IndexedDB or Supabase.
//
// Policy (decided Jun 2026 security audit):
//   - Strip leading/trailing whitespace.
//   - Reject null bytes outright (never valid in legitimate input).
//   - Enforce a per-field max length by REJECTING the write with a clear
//     error — never silently truncating. The error message is designed to
//     surface directly in the existing form error banners (ManualEntryForm,
//     WakeUpScreen) via the error-propagation path already wired through
//     useSleepLog (createEntry/updateEntry catch the thrown error and set
//     it as `error.message` in hook state).
//   - Empty/whitespace-only input normalizes to `undefined`, matching the
//     "optional field not engaged" semantics used throughout SleepEntry.
//
// This file has no React/UI imports — it is a pure utility, consistent with
// the rest of src/lib/circadian and src/utils.

import type { Interruption, Medication } from '@/lib/circadian'

/** Per-field character limits. Agreed with Mahmoud, Jun 2026 security audit. */
export const FIELD_LIMITS = {
  notes: 2000,
  dreamNotes: 2000,
  interruptionNote: 500,
  medicationName: 200,
} as const

/**
 * Thrown when a free-text field fails sanitization (too long, contains a
 * null byte, or — for required fields like Medication.name — becomes empty
 * after trimming). The `.message` is written to be directly user-facing.
 */
export class SanitizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SanitizationError'
  }
}

/**
 * Sanitizes a single free-text value.
 *
 * @param value - Raw input. `undefined` passes through unchanged.
 * @param maxLength - Field-specific limit, from FIELD_LIMITS.
 * @param fieldLabel - Human-readable name used in the thrown error message.
 * @returns The trimmed string, or `undefined` if empty/whitespace-only.
 * @throws SanitizationError if the value contains a null byte or exceeds maxLength.
 */
export function sanitizeText(
  value: string | undefined,
  maxLength: number,
  fieldLabel: string
): string | undefined {
  if (value === undefined) return undefined

  if (value.includes('\u0000')) {
    throw new SanitizationError(`${fieldLabel} cannot contain null characters.`)
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined

  if (trimmed.length > maxLength) {
    throw new SanitizationError(
      `${fieldLabel} is too long (${trimmed.length}/${maxLength} characters). Please shorten it and try again.`
    )
  }

  return trimmed
}

/**
 * Applies sanitizeText() to every free-text field that can appear on a
 * SleepEntry draft or partial update: `notes`, `dreamNotes`, each
 * `interruptions[].note`, and each `medications[].name`.
 *
 * Accepts either a full create draft or a partial update object — any field
 * not present (key absent) on the input is left untouched, so this is safe
 * to call unconditionally in both createEntry and updateEntry.
 *
 * @throws SanitizationError on the first field that fails — see sanitizeText().
 */
export function sanitizeSleepEntryFields<
  T extends {
    notes?: string
    dreamNotes?: string
    interruptions?: Interruption[]
    medications?: Medication[]
  }
>(input: T): T {
  const result: T = { ...input }

  if ('notes' in input) {
    result.notes = sanitizeText(input.notes, FIELD_LIMITS.notes, 'Notes')
  }

  if ('dreamNotes' in input) {
    result.dreamNotes = sanitizeText(input.dreamNotes, FIELD_LIMITS.dreamNotes, 'Dream notes')
  }

  if (input.interruptions) {
    result.interruptions = input.interruptions.map(i => ({
      ...i,
      note: sanitizeText(i.note, FIELD_LIMITS.interruptionNote, 'Interruption note'),
    }))
  }

  if (input.medications) {
    result.medications = input.medications.map(m => {
      const name = sanitizeText(m.name, FIELD_LIMITS.medicationName, 'Medication name')
      if (name === undefined) {
        throw new SanitizationError('Medication name cannot be empty.')
      }
      return { ...m, name }
    })
  }

  return result
}
```

---

## Step 2 — Wire sanitization into `src/lib/db/sleepEntryService.ts`

Add the import near the top, alongside the other `@/lib/...` imports:

**Find:**

```typescript
import { syncAfterMutation } from '@/lib/supabase/syncService'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
```

**Replace with:**

```typescript
import { syncAfterMutation } from '@/lib/supabase/syncService'
import { supabase } from '@/lib/supabase/client'
import { sanitizeSleepEntryFields } from '@/utils/sanitizeText'
import type { User } from '@supabase/supabase-js'
```

In `createEntry`, sanitize the draft before it is used to build the entry:

**Find:**

```typescript
  const id = overrideId ?? crypto.randomUUID()
  const now = new Date().toISOString()

  const entry: SleepEntry = {
    ...draft,
    id,
```

**Replace with:**

```typescript
  const id = overrideId ?? crypto.randomUUID()
  const now = new Date().toISOString()

  // Sanitize all free-text fields before this draft touches IndexedDB or
  // Supabase. Throws SanitizationError on null bytes or over-length input —
  // the caller (useSleepLog) catches it and surfaces err.message in the UI.
  const sanitizedDraft = sanitizeSleepEntryFields(draft)

  const entry: SleepEntry = {
    ...sanitizedDraft,
    id,
```

In `updateEntry`, sanitize the incoming changes before merging:

**Find:**

```typescript
  const existing = await db.sleepEntries.get(id)
  if (!existing) throw new Error(`updateEntry: entry ${id} not found`)

  const updated: SleepEntry = { ...existing, ...changes, updatedAt: new Date().toISOString() }
```

**Replace with:**

```typescript
  const existing = await db.sleepEntries.get(id)
  if (!existing) throw new Error(`updateEntry: entry ${id} not found`)

  // Sanitize free-text fields in the incoming changes before merging — same
  // policy as createEntry above.
  const sanitizedChanges = sanitizeSleepEntryFields(changes)

  const updated: SleepEntry = { ...existing, ...sanitizedChanges, updatedAt: new Date().toISOString() }
```

---

## Step 3 — Handle per-row sanitization failures in `src/hooks/useImport.ts`

CSV import calls `createEntry()` in a loop without try/catch. Now that
`createEntry` can throw `SanitizationError`, a single bad row (e.g. a note
field over 2000 characters in the source spreadsheet) would currently abort
the entire import and leave the UI stuck on `phase: 'importing'`. Fix this
by catching per-row and counting rejections separately from parse errors.

Add `rejected` to the result type:

**Find:**

```typescript
export interface ImportResult {
  imported:  number
  skipped:   number   // duplicates
  errors:    number   // parse errors (excluded before import starts)
  syncError: { code: string; message: string } | null
}
```

**Replace with:**

```typescript
export interface ImportResult {
  imported:  number
  skipped:   number   // duplicates
  rejected:  number   // failed sanitization (or other createEntry error) at write time
  errors:    number   // parse errors (excluded before import starts)
  syncError: { code: string; message: string } | null
}
```

Update the early-return for zero ok-rows:

**Find:**

```typescript
    if (okRows.length === 0) {
      setPhase('done')
      setResult({ imported: 0, skipped: 0, errors: parsedRows.filter(r => r.status === 'error').length, syncError: null })
      return
    }
```

**Replace with:**

```typescript
    if (okRows.length === 0) {
      setPhase('done')
      setResult({ imported: 0, skipped: 0, rejected: 0, errors: parsedRows.filter(r => r.status === 'error').length, syncError: null })
      return
    }
```

Add the `rejected` counter and wrap the write in try/catch:

**Find:**

```typescript
    let imported = 0
    let skipped  = 0
```

**Replace with:**

```typescript
    let imported = 0
    let skipped  = 0
    let rejected = 0
```

**Find:**

```typescript
      if (existing) {
        skipped++
      } else {
        await createEntry(row.draft, user, entryId)
        imported++
      }

      setProgress({ current: i + 1, total: okRows.length })
    }
```

**Replace with:**

```typescript
      if (existing) {
        skipped++
      } else {
        try {
          await createEntry(row.draft, user, entryId)
          imported++
        } catch {
          // A SanitizationError (or any other createEntry failure) on one
          // row must not abort the whole import — count it and continue.
          rejected++
        }
      }

      setProgress({ current: i + 1, total: okRows.length })
    }
```

Include `rejected` in the final result:

**Find:**

```typescript
    setResult({
      imported,
      skipped,
      errors: parsedRows.filter(r => r.status === 'error').length,
      syncError,
    })
```

**Replace with:**

```typescript
    setResult({
      imported,
      skipped,
      rejected,
      errors: parsedRows.filter(r => r.status === 'error').length,
      syncError,
    })
```

---

## Step 4 — Show the rejected count in `src/pages/log/ImportPage.tsx`

**Find:**

```typescript
                  <p className="text-sm text-circa-text-secondary">
                    <span className="text-circa-text-primary font-medium">{result.imported}</span> imported
                    {result.skipped > 0 && (
                      <> · <span className="text-circa-text-primary font-medium">{result.skipped}</span> skipped (duplicates)</>
                    )}
                    {result.errors > 0 && (
                      <> · <span className="text-circa-error font-medium">{result.errors}</span> not imported (parse errors)</>
                    )}
                  </p>
```

**Replace with:**

```typescript
                  <p className="text-sm text-circa-text-secondary">
                    <span className="text-circa-text-primary font-medium">{result.imported}</span> imported
                    {result.skipped > 0 && (
                      <> · <span className="text-circa-text-primary font-medium">{result.skipped}</span> skipped (duplicates)</>
                    )}
                    {result.rejected > 0 && (
                      <> · <span className="text-circa-error font-medium">{result.rejected}</span> rejected (validation)</>
                    )}
                    {result.errors > 0 && (
                      <> · <span className="text-circa-error font-medium">{result.errors}</span> not imported (parse errors)</>
                    )}
                  </p>
```

---

## Step 5 — `maxLength` + live character counters in `src/pages/log/ManualEntryForm.tsx`

Add the import:

**Find:**

```typescript
import { useState } from 'react';
import type { createEntry } from '@/lib/db';
import type { InterruptionType, MedicationTiming, SleepEntry } from '@/lib/circadian';
import QualityPicker from '@/components/ui/QualityPicker';
```

**Replace with:**

```typescript
import { useState } from 'react';
import type { createEntry } from '@/lib/db';
import type { InterruptionType, MedicationTiming, SleepEntry } from '@/lib/circadian';
import QualityPicker from '@/components/ui/QualityPicker';
import { FIELD_LIMITS } from '@/utils/sanitizeText';
```

Notes textarea:

**Find:**

```typescript
      {/* Notes — optional */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-circa-text-primary mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to remember about this session…"
          className={inputClass}
        />
      </div>
```

**Replace with:**

```typescript
      {/* Notes — optional */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-circa-text-primary mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          maxLength={FIELD_LIMITS.notes}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to remember about this session…"
          className={inputClass}
        />
        <p className="text-circa-text-muted text-xs mt-1 text-right">
          {notes.length}/{FIELD_LIMITS.notes}
        </p>
      </div>
```

Dream Notes textarea:

**Find:**

```typescript
            <div>
              <label htmlFor="dreamNotes" className="block text-sm font-medium text-circa-text-primary mb-1">
                Dream Notes
              </label>
              <textarea
                id="dreamNotes"
                rows={2}
                value={dreamNotes}
                onChange={e => setDreamNotes(e.target.value)}
                placeholder="Describe your dreams…"
                className={inputClass}
              />
            </div>
          )}

          {/* Interruptions */}
```

**Replace with:**

```typescript
            <div>
              <label htmlFor="dreamNotes" className="block text-sm font-medium text-circa-text-primary mb-1">
                Dream Notes
              </label>
              <textarea
                id="dreamNotes"
                rows={2}
                maxLength={FIELD_LIMITS.dreamNotes}
                value={dreamNotes}
                onChange={e => setDreamNotes(e.target.value)}
                placeholder="Describe your dreams…"
                className={inputClass}
              />
              <p className="text-circa-text-muted text-xs mt-1 text-right">
                {dreamNotes.length}/{FIELD_LIMITS.dreamNotes}
              </p>
            </div>
          )}

          {/* Interruptions */}
```

Interruption note input (per-type, inside the `[...activeInterruptions].map` block):

**Find:**

```typescript
                <input
                  id={`interruption-note-${type}`}
                  type="text"
                  value={interruptionNotes[type] ?? ''}
                  onChange={e =>
                    setInterruptionNotes(prev => ({ ...prev, [type]: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Medication taken */}
```

**Replace with:**

```typescript
                <input
                  id={`interruption-note-${type}`}
                  type="text"
                  maxLength={FIELD_LIMITS.interruptionNote}
                  value={interruptionNotes[type] ?? ''}
                  onChange={e =>
                    setInterruptionNotes(prev => ({ ...prev, [type]: e.target.value }))
                  }
                  className={inputClass}
                />
                <p className="text-circa-text-muted text-xs mt-0.5 text-right">
                  {(interruptionNotes[type] ?? '').length}/{FIELD_LIMITS.interruptionNote}
                </p>
              </div>
            ))}
          </div>

          {/* Medication taken */}
```

---

## Step 6 — Same three edits in `src/pages/log/WakeUpScreen.tsx`

Add the import:

**Find:**

```typescript
import { useState, useEffect } from 'react';
import type { createEntry } from '@/lib/db';
import type { InterruptionType, MedicationTiming } from '@/lib/circadian';
import QualityPicker from '@/components/ui/QualityPicker';
import { parseElapsed } from '@/utils/parseElapsed';
```

**Replace with:**

```typescript
import { useState, useEffect } from 'react';
import type { createEntry } from '@/lib/db';
import type { InterruptionType, MedicationTiming } from '@/lib/circadian';
import QualityPicker from '@/components/ui/QualityPicker';
import { parseElapsed } from '@/utils/parseElapsed';
import { FIELD_LIMITS } from '@/utils/sanitizeText';
```

Notes textarea:

**Find:**

```typescript
        <textarea
          id="wakeNotes"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to remember about this session…"
          className={inputClass}
        />
      </div>
```

**Replace with:**

```typescript
        <textarea
          id="wakeNotes"
          rows={3}
          maxLength={FIELD_LIMITS.notes}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to remember about this session…"
          className={inputClass}
        />
        <p className="text-circa-text-muted text-xs mt-1 text-right">
          {notes.length}/{FIELD_LIMITS.notes}
        </p>
      </div>
```

Dream Notes textarea:

**Find:**

```typescript
              <textarea
                id="wakeDreamNotes"
                rows={2}
                value={dreamNotes}
                onChange={e => setDreamNotes(e.target.value)}
                placeholder="Describe your dreams…"
                className={inputClass}
              />
            </div>
          )}

          {/* Interruptions */}
```

**Replace with:**

```typescript
              <textarea
                id="wakeDreamNotes"
                rows={2}
                maxLength={FIELD_LIMITS.dreamNotes}
                value={dreamNotes}
                onChange={e => setDreamNotes(e.target.value)}
                placeholder="Describe your dreams…"
                className={inputClass}
              />
              <p className="text-circa-text-muted text-xs mt-1 text-right">
                {dreamNotes.length}/{FIELD_LIMITS.dreamNotes}
              </p>
            </div>
          )}

          {/* Interruptions */}
```

Interruption note input:

**Find:**

```typescript
                <input
                  id={`wake-interruption-note-${type}`}
                  type="text"
                  value={interruptionNotes[type] ?? ''}
                  onChange={e =>
                    setInterruptionNotes(prev => ({ ...prev, [type]: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Medication taken */}
```

**Replace with:**

```typescript
                <input
                  id={`wake-interruption-note-${type}`}
                  type="text"
                  maxLength={FIELD_LIMITS.interruptionNote}
                  value={interruptionNotes[type] ?? ''}
                  onChange={e =>
                    setInterruptionNotes(prev => ({ ...prev, [type]: e.target.value }))
                  }
                  className={inputClass}
                />
                <p className="text-circa-text-muted text-xs mt-0.5 text-right">
                  {(interruptionNotes[type] ?? '').length}/{FIELD_LIMITS.interruptionNote}
                </p>
              </div>
            ))}
          </div>

          {/* Medication taken */}
```

---

## Step 7 — Unit tests for `sanitizeText.ts`

Create `src/utils/__tests__/sanitizeText.test.ts`, following the existing
Vitest conventions used in `src/lib/db/__tests__/sleepEntryService.test.ts`.
Cover at minimum:

- `sanitizeText`: trims leading/trailing whitespace
- `sanitizeText`: returns `undefined` for `undefined`, empty string, and
  whitespace-only input
- `sanitizeText`: throws `SanitizationError` on a null byte (`'\u0000'`)
- `sanitizeText`: throws `SanitizationError` when trimmed length exceeds `maxLength`
- `sanitizeText`: accepts input exactly at `maxLength` (boundary case)
- `sanitizeSleepEntryFields`: leaves absent keys untouched (key not present
  on input → not present on output)
- `sanitizeSleepEntryFields`: sanitizes `interruptions[].note` and
  `medications[].name` inside arrays
- `sanitizeSleepEntryFields`: throws when a `medications[].name` becomes
  empty after trimming

Use realistic field labels and limits from `FIELD_LIMITS` rather than
hardcoding numbers, so the tests stay correct if limits ever change.

---

## Step 8 — Build verification

Run, in order, and confirm zero errors before proceeding:

1. `npm run lint` — zero warnings or errors
2. `npx tsc -b` — zero type errors (covers the new file and all five edits)
3. `npm run test` — full Vitest suite passes, including the new
   `sanitizeText.test.ts` and the existing `sleepEntryService.test.ts`
   (which now exercises the sanitization path indirectly through
   `createEntry`/`updateEntry` — confirm none of its existing cases use
   notes/dreamNotes/interruption text that would now fail validation)
4. `npm run build` — production build succeeds

If any existing test fixture in `sleepEntryService.test.ts` or the
`__fixtures__/` files contains free-text values that exceed the new limits
(2000/2000/500/200 chars), fix the fixture data rather than relaxing the
limits — flag this explicitly in the session report if it happens.

---

## Step 9 — Session report

Write a comprehensive Markdown report covering all steps, outcomes, build
output, any deviations from these instructions (including the fixture
note above if applicable), and the full list of files created/modified:

- `src/utils/sanitizeText.ts` (new)
- `src/utils/__tests__/sanitizeText.test.ts` (new)
- `src/lib/db/sleepEntryService.ts`
- `src/hooks/useImport.ts`
- `src/pages/log/ImportPage.tsx`
- `src/pages/log/ManualEntryForm.tsx`
- `src/pages/log/WakeUpScreen.tsx`

Save it to `tasks/cc-reports/REPORT_phase1-input-sanitization_27-jun-2026.md`,
following the naming convention in
`.claude/memory/feedback_report_conventions.md` and the markdownlint rules
(blank line before/after every fenced code block, zero warnings).

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 10 — Git commit (only after Mahmoud confirms)

Commit with a message summarizing the change, e.g.:

```text
security: sanitize free-text SleepEntry fields before persistence

- Add sanitizeText()/sanitizeSleepEntryFields() utility (src/utils/sanitizeText.ts)
- Enforce max lengths (notes/dreamNotes 2000, interruption note 500,
  medication name 200) at the sleepEntryService chokepoint
- Reject over-length/null-byte input with a clear error instead of
  silent truncation
- Add maxLength + live character counters to ManualEntryForm and
  WakeUpScreen free-text fields
- Handle per-row sanitization failures in CSV import without aborting
  the whole batch (new `rejected` count in ImportResult)
```
