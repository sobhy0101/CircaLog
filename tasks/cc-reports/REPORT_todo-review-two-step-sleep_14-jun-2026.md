# Session Report: TO-DO Review + Two-Step Sleep Flow

**Date:** 14 Jun 2026
**Type:** Documentation review and planning

---

## What Happened

This was a planning and review session, not a code build. No production code
was written. Changes are limited to documentation and one minor Tailwind
class cleanup.

---

## Changes Made

### 1. `docs/CircaLog-TO-DO-list.md`

Four edits resulting from a gap analysis of the TO-DO list:

**Architecture note corrected:**
The note under "Sleep Log — Core" claimed the manual back-fill form had no
Bed Time field. It already does (`ManualEntryForm.tsx`, `SessionDetailPage.tsx`).
The note was updated to reflect the actual state.

**Timer redesign item updated:**
- Button labels changed from question form ("In Bed?", "Going to Sleep?") to
  declarative form ("In Bed", "Going to Sleep") based on UX reasoning: the
  question form implies the app is asking the user to confirm; declarative
  labels communicate that the user is telling the app something.
- The note "The Wake Up screen and its logic remain unchanged" was corrected.
  The WakeUpScreen does need a companion change (see new item below).

**Manual form item marked done:**
The "Add Bed Time field to the manual back-fill entry form" item was checked
off. It was already implemented and verified in code.

**New WakeUpScreen item added:**
After the two-step redesign, the Wake Up screen must display the "In Bed"
time read-only above the editable "Fell Asleep" field, with a live onset
latency calculation between them. The item includes a nudge for the case
where `sleepStartUtc` equals `bedTimeUtc` (i.e., the user did not tap
"Going to Sleep" separately): "Did you fall asleep immediately?"

### 2. `README.md`

The user had been removing em dashes from the README but was interrupted
mid-task. Several sentences were left in a broken state. All em dashes were
removed and every broken sentence was repaired:

**Broken sentences fixed:**

| Location | Problem | Fix |
|----------|---------|-----|
| Line 7 | `the *drift* the defining feature` (missing connector) | Added comma: `the *drift*, the defining feature` |
| Lines 53-54 | `before confirming every parsed row with` (verb removed) | Restored: `before confirming: shows every parsed row with` |
| Line 56 | Comma splice: `skipped automatically, re-importing` | Semicolon: `skipped automatically; re-importing` |
| Line 68 | Double space before "before confirming" | Removed extra space |
| Line 114 | `The PWA app as permanent` ("as" inserted incorrectly) | Replaced: `The PWA app (permanent URL, never changes)` |
| Line 221 | Comma splice: `rather than *content*, it belongs` | Semicolon: `rather than *content*; it belongs` |

**Remaining em dashes removed (9 total):**

| Location | Before | After |
|----------|--------|-------|
| Sync status paragraph | `\`pending\` — offline is` | `\`pending\`: offline is` |
| Auth toast paragraph | `` `bottom-20` — 80px — to clear `` | `` `bottom-20` (80px from the bottom) to clear `` |
| `navigator.onLine` section | `"not definitely offline" — it does not` | `"not definitely offline"; it does not` |
| Section heading | `CSV Import — Return Path After Sign-In` | `CSV Import: Return Path After Sign-In` |
| Section heading | `CSV Import — Midnight Crossover Logic` | `CSV Import: Midnight Crossover Logic` |
| Section heading | `CSV Import — Interruption Mapping` | `CSV Import: Interruption Mapping` |
| Contributing section | `rhythm disorders — because` | `rhythm disorders, because` |
| License section | `MIT License — see` | `MIT License. See` |
| Name section | `*Circa* — from Latin` / `*Log* — a record` | `*Circa*: from Latin` / `*Log*: a record` |

### 3. `src/pages/history/SessionDetailPage.tsx`

Minor Tailwind class simplification from Claude.ai:
`min-w-[3.5rem]` → `min-w-14` on two buttons (Back and Edit).
These are equivalent values (14 × 0.25rem = 3.5rem). No behaviour change.

### 4. `.vscode/ltex.hiddenFalsePositives.en-US.txt`

Two LTEx false-positive entries added to suppress grammar warnings on
multi-line README bullet points (the `ENGLISH_WORD_REPEAT_RULE` was
triggering on the Import and Backup sections).

---

## Key Decisions from This Session

### Two-step sleep flow (architecture confirmed)

The current single-tap "Start Sleep" button collapses two distinct clinical
events into one ambiguous tap:

- `bedTimeUtc` and `sleepStartUtc` are set to the same timestamp in
  `useSleepLog.ts:127`.
- The `WakeUpScreen` shows a single editable "Fell Asleep" field but never
  shows the "Went to Bed" time, so the user cannot review both before saving.
- After saving, the only way to correct either field is via History edit.

The two-step redesign (added to TO-DO as two 🔴 items) solves this by
capturing the two timestamps as separate intentional taps ("In Bed" and
"Going to Sleep"), and updating the WakeUpScreen to display both for review
before saving.

**Rationale for declarative button labels over question form:**
Tapping "In Bed?" reads as the app asking the user. Tapping "In Bed"
reads as the user declaring something to the app. The latter is the correct
mental model for a logging tool.

---

## Files Not Changed

- All source code (`src/`) except `SessionDetailPage.tsx` (minor class rename)
- Supabase tables and IndexedDB schema are unchanged
- No migrations required
