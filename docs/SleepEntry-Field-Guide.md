# CircaLog — Sleep Entry Field Entry Guide

**File:** `docs/SleepEntry-Field-Guide.md`
**Created:** 08 Jun 2026
**Purpose:** Reference guide for what to enter in the `Interruptions` and
`Notes` fields of a sleep entry — both in the app and in the spreadsheet —
so that imported data maps cleanly to structured objects and future Insights
queries work correctly.

---

## Why this matters

When you log an interruption as free text (e.g. "Peed twice"), the app stores
it as a structured object:

```json
{ "type": "bathroom", "note": "twice" }
```

This means the app can later answer questions like:

- "How many times did you wake to use the bathroom this week?"
- "Does bathroom frequency correlate with your sleep quality score?"
- "How often does pain interrupt your sleep vs. thirst?"

If you enter unstructured text that the app can't map to a known type, it
falls back to `{ "type": "other", "note": "your text here" }`. That still
preserves the information, but the specific type is lost — "other" cannot be
broken down by cause.

The guide below tells you exactly what to type so the right type is always
detected.

---

## The Interruptions field

### Recognized interruption types

| Type | Keyword(s) the app recognizes | What to enter |
|---|---|---|
| `bathroom` | pee, peed, bathroom, toilet, loo | `"Peed once"` / `"Peed twice"` / `"Bathroom x2"` |
| `pain` | *(future — not yet mapped)* | Write it in Notes for now |
| `thirst` | *(future — not yet mapped)* | Write it in Notes for now |
| `hunger` | *(future — not yet mapped)* | Write it in Notes for now |
| `other` | anything not matched above | Falls back automatically |

### Current behavior (as of Phase 1 CSV import)

Only `bathroom` is keyword-mapped. All other interruption types fall back to
`other` and the full text is preserved in the `note` field. Future updates
will extend the keyword list as additional types are wired into the Insights
engine.

### Rules for the Interruptions field

1. **One type per entry, for now.** If you had both a bathroom trip and pain,
   enter the more medically significant one in Interruptions and put the other
   in Notes. When the app gains multi-interruption support, this guide will be
   updated.

2. **Use plain, short phrases.** "Peed once" is better than "Had to get up to
   use the bathroom at around 3 AM and then couldn't fall back asleep easily."
   Save the narrative for Notes.

3. **Don't enter counts as words.** "Peed 3 times" is better than "Peed three
   times" — numeric digits are more reliable for future parsing.

4. **Use "N/A" or leave blank when there were no interruptions.** Both are
   treated as `undefined` (no interruptions logged). Don't write "none" —
   it works, but "N/A" is the canonical placeholder throughout the spreadsheet.

### Examples

| What happened | What to enter in Interruptions |
|---|---|
| Woke once to use the bathroom | `Peed once` |
| Woke twice to use the bathroom | `Peed twice` |
| Multiple bathroom trips | `Peed 3 times` |
| Woke from pain | `Pain` *(stored as `other` until pain keyword is mapped)* |
| Woke sweating, couldn't sleep | Leave blank; put description in Notes |
| No interruptions | `N/A` or leave blank |

---

## The Notes field

The Notes field is **free text only** — it is never parsed or keyword-mapped.
Use it for anything that doesn't fit the structured fields:

- Context for the session: "Woke up by the dohr athan"
- Physical symptoms: "Kept sweating all night. Woke up all wet."
- Environmental factors: "Too hot after sunrise"
- Medical observations: "Discomfort masking pain in bones and muscles"
- Anything you want your doctor to see but that doesn't fit elsewhere

### What NOT to put in Notes

- Interruption counts that belong in the Interruptions field
- Quality reasons — use the quality slider for the score; use Notes for the
  reason if you want, but keep it brief
- Dream content — use the Dream Notes field

### Notes length

Keep Notes under ~200 characters for display clarity in the History view and
future doctor reports. Longer entries are stored correctly but may be
truncated in table views.

---

## The Dream Notes field

Only populated when `Had Dreams?` is `Yes`. Free text describing the content
or emotional character of the dream. Examples from your real data:

- `"Multiple what IFs nightmares about what might happen to my wife's journey to Egypt."`
- `"Acquiring hotels deals for Pals Tours"`
- `"Don't remember"`

If you don't remember the dream, enter `"Don't remember"` rather than leaving
it blank — it confirms the field was considered, not skipped.

---

## Spreadsheet conventions that carry over to the app

These rules apply to both the spreadsheet (for clean CSV imports) and to the
app's manual entry form once those fields are wired in V2:

| Field | Blank means | "N/A" means | Effect |
|---|---|---|---|
| Interruptions | Not answered | No interruptions | Both → `undefined` |
| Notes | No notes | No notes | Both → `undefined` |
| Dream Notes | Not answered (use only when Had Dreams? = No) | Content not recalled | `"N/A"` → `undefined`; blank → `undefined` |

---

## Future expansion

When the following types are added to the keyword mapper, this guide will be
updated:

- `pain` — keywords: pain, ache, aching, hurt, cramp, neuropathy
- `thirst` — keywords: thirst, thirsty, water, drink
- `hunger` — keywords: hungry, hunger, ate, snack

If you want a keyword added before the next update, note it in your sleep log
and flag it in the next Claude.ai session.
