---
name: project-sleep-session-model
description: "Three-date sleep session model — bedTimeUtc, sleepStartUtc, wakeUtc and what each answers"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1a002c84-8857-4c79-a31c-e3aeca4bc8bb
---

A single sleep session can span multiple calendar dates. `SleepEntry` stores three UTC timestamps:

- `bedTimeUtc?: string` — **optional** (back-filled entries may lack it)
- `sleepStartUtc: string` — when sleep actually began
- `wakeUtc: string` — when the session ended

`normalizeSleepSpan(entry)` derives three local-date strings (YYYY-MM-DD) in the entry's `ianaTimezone`:

| Local date field | Answers | Used by |
|---|---|---|
| `localBedDate` | "Which night was this?" (human anchor; what the patient tells their doctor) | History view, actogram, doctor report — **primary display date** |
| `localSleepStartDate` | "When did sleep begin?" | Onset calculations, actogram Y-axis |
| `localWakeDate` | "When did the day start?" | Medication and food timing |

**How to apply:** All display layers use `localBedDate` as the primary display date and fall back to `localSleepStartDate` only when `bedTimeUtc` is absent. Never treat the absence of `bedTimeUtc` as an error — back-filled historical entries legitimately lack it, and every engine function works correctly without it.

*Decided 02 Jun 2026, Phase 0.5 planning session.*
