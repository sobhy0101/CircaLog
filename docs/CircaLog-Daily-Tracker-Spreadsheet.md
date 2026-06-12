# CircaLog Daily Tracker — Spreadsheet Reference

**File:** `CircaLog-Daily-Tracker.xlsx`
**Location:** `C:\Users\sobhy\OneDrive\CircaLog-Daily-Tracker.xlsx`
**Created:** 30 May 2026
**Purpose:** Temporary daily logging tool used while CircaLog V1 is in development.
Captures real patient data (sleep, medication, food) that can be imported into
CircaLog once the app reaches a usable state.

---

## Background

Built during a late-night session (3 AM, 30 May 2026) when the need to start
logging immediately became urgent. The patient has Non-24-Hour Sleep-Wake
Disorder, Type 2 diabetes, neuropathy, GERD, and hypertension. The spreadsheet
was designed around the real daily suffering from Non-24 — particularly the way
rotating sleep cycles break clock-based medication schedules and food-timing
rules simultaneously.

---

## Workbook Structure

Four sheets in this order:

| Sheet | Tab Color | Purpose |
|---|---|---|
| Dashboard | Purple | At-a-glance summary, no data entry, all formulas |
| Sleep Log | Dark blue | One row per sleep session |
| Medication Log | Teal | Medication reference table + daily dose log |
| Food Log | Green | One row per meal (patient eats once daily) |

---

## Sheet 1 — Dashboard

No data entry. All values pulled from the other three sheets via formulas.
Uses `NOW()` for live calculations — press **Ctrl+Alt+F9** to force recalculation
if values appear stale.

### Section 1 — Last Sleep Session

Pulls the most recent session by highest `Date + Sleep Start` value.
Handles Non-24 correctly — no assumption that sleep happens at night.

| Field | Source |
|---|---|
| Date | Sleep Log col A |
| Bed Time | Sleep Log col B |
| Sleep Start | Sleep Log col C |
| Wake Time | Sleep Log col D |
| Sleep Onset Latency | Calculated: Sleep Start − Bed Time, displayed as "Xh Ym" |
| Sleep Duration | Calculated: Wake Time − Sleep Start, displayed as "Xh Ym" |
| Time in Bed | Calculated: Wake Time − Bed Time, displayed as "Xh Ym" |
| Quality Rating | Sleep Log col I |

### Section 2 — Food & GERD Safety

Live status based on `NOW()` and last meal time.

| Status | Condition | Color |
|---|---|---|
| ✅ Safe to sleep | 4+ hours since last meal | Green |
| ⚠️ Wait — only X hours since last meal | 2–4 hours since last meal | Yellow |
| 🔴 Too soon — risk of acid reflux | Under 2 hours since last meal | Red |

### Section 3 — Today's Medications

One row per scheduled dose. Status auto-calculated from `NOW()` and
Medication Log entries. Grace window: **±2 hours**.

| Status | Condition | Color |
|---|---|---|
| 🟢 Taken at HH:MM | Logged within ±2 hours of scheduled time | Green |
| 🟡 Due — take now | Within ±2 hour window, not yet logged | Yellow |
| 🔴 MISSED | Grace window fully passed, no dose logged | Red |
| ⚪ Upcoming | Scheduled time not yet reached | Grey |

### Section 4 — Sleep Onset Latency Trend

Last 7 sleep sessions shown as a small table (date + latency in minutes),
most recent first. Helps the patient and their doctor see whether falling
asleep is getting easier or harder over time.

---

## Sheet 2 — Sleep Log

One row per sleep session. Columns A–N.

| Col | Field | Type | Notes |
|---|---|---|---|
| A | Date | Date DD/MM/YYYY | Calendar date the session started |
| B | Bed Time | Time HH:MM | When patient got into bed |
| C | Sleep Start | Time HH:MM | When patient actually fell asleep |
| D | Wake Time | Time HH:MM | When patient woke up |
| E | Sleep Onset Latency | Auto "Xh Ym" | C − B, MOD() handles midnight crossover |
| F | Sleep Duration | Auto "Xh Ym" | D − C, MOD() handles midnight crossover |
| G | Time in Bed | Auto "Xh Ym" | D − B, MOD() handles midnight crossover |
| H | Session Type | Auto | "Nap" if duration < 3h, "Main Sleep" if ≥ 3h |
| I | Quality | Dropdown 1–5 | 1=red, 2=orange, 3=yellow, 4=light green, 5=green |
| J | Had Dreams? | Dropdown Yes/No | — |
| K | Dream Notes | Free text | Only relevant when J = Yes |
| L | Interruptions | Free text | e.g. "bathroom x2, pain" |
| M | Notes | Free text | General session notes |
| N | Cycle Number | Auto integer | Sequential count ordered by Sleep Start time |

Conditional formatting:

- Col H: blue fill = Main Sleep, soft purple fill = Nap
- Col I: red→orange→yellow→light green→green scale (1→5)
- Frozen header row, alternating row shading

**Important:** Sleep Start, Wake Time, and all duration calculations handle
sessions that cross midnight correctly using MOD(). A sleep start of 2 PM
is as valid as 2 AM — no night-only assumptions anywhere.

---

## Sheet 3 — Medication Log

### Part A — Reference Table (rows 3–10)

Scheduled medications:

| # | Medication | Scheduled Time(s) |
|---|---|---|
| 1 | Sugarlo Plus (Metformin) | 10:00 |
| 2 | Thiotacid 300 (Alpha-lipoic Acid) | 10:00, 16:00, 22:00 |
| 3 | Milga Advance | 16:00 |
| 4 | Davalindi (Vitamin D3) | 16:00 |
| 5 | Melatonin Copad | Bedtime |

As-needed medications (no schedule, log only when taken):

- Propranolol (Indreral) 10mg
- Paracetamol (Awadist) 1000mg
- Captopril (Capoten) 25mg

### Part B — Daily Dose Log (from row 14)

| Col | Field | Type | Notes |
|---|---|---|---|
| A | Date | Date DD/MM/YYYY | — |
| B | Medication Name | Dropdown | Populated from reference table |
| C | Scheduled Time | Auto via VLOOKUP | Auto-filled from col B selection |
| D | Actual Time Taken | Time HH:MM | Leave blank if missed or skipped |
| E | Status | Dropdown | Taken / Missed / Skipped |
| F | Notes | Free text | e.g. "took 30 min late", "felt nauseous" |

Conditional formatting on col E:

- Taken → green
- Missed → red
- Skipped → gray

### Medication Schedule Notes

At 4 PM, three medications are scheduled simultaneously with different
food rules:

- **Thiotacid** — no food rule (doctor-approved for Non-24 patient)
- **Milga Advance** — take before eating
- **Davalindi** — take with or during food

This sequencing conflict is a known daily challenge and is intentionally
surfaced by the spreadsheet rather than hidden.

---

## Sheet 4 — Food Log

One row per meal. Patient eats once daily (cooked vegetables, low fat, low salt).

| Col | Field | Type | Notes |
|---|---|---|---|
| A | Date | Date DD/MM/YYYY | — |
| B | Meal Time | Time HH:MM | Manual entry |
| C | Meal Name | Dropdown | Breakfast / Lunch / Dinner / Snack / Late Snack |
| D | Meal Size | Dropdown | Small / Normal / Large |
| E | Notes | Free text | e.g. "felt bloated", "ate too fast" |
| F | Safe to Sleep After | Auto time HH:MM | B + 4 hours (doctor's GERD order) |
| G | Hours Since Meal | Auto "Xh Ym" | Live via NOW() |

Conditional formatting on col F:

- NOW() before F → red (still waiting)
- NOW() between F and F+2h → yellow (grace period)
- NOW() after F+2h → green (fully safe)

---

## Design

- **Theme:** Dark charcoal (#1a1a2e) background, light text (#e0e0e0)
- **Accent:** Purple/violet (#7c3aed) for headers and section titles
- **Rationale:** Dark theme because this is a sleep app, used frequently
  at night and in low-light conditions
- All sheets: frozen header rows, no visible gridlines, cell borders only,
  auto-fitted column widths, alternating row shading
- Default capacity: 100 rows per sheet (187 rows in Medication Log dose area)

---

## Prompt to Export Data for Claude

When you need to bring spreadsheet data into a Claude.ai chat, paste this
prompt into Claude in Excel first:

```text
Please export CSV summary of all four sheets in this workbook for
sharing with an external assistant. Format it exactly as follows:

**SHEET: Sleep Log**
Print all rows that have data as a CSV with columns: Date, Bed Time,
Sleep Start, Wake Time, Sleep Onset Latency, Sleep Duration, Time in Bed,
Session Type, Quality, Had Dreams, Dream Notes, Interruptions, Notes,
Cycle Number

**SHEET: Medication Log**
Print all rows in the dose log area (from row 14 onward) that have data as a
markdown table with columns: Date, Medication Name, Scheduled Time, Actual Time
Taken, Status, Notes

**SHEET: Food Log**
Print all rows that have data as a markdown table with columns: Date, Meal Time,
Meal Name, Meal Size, Notes, Safe to Sleep After, Hours Since Meal

**SHEET: Dashboard**
Print the current values of every labeled cell in all four sections exactly as
they appear on screen, as a simple key: value list.

Do not include empty rows. Do not include formula text — print the displayed
values only. Do not add any commentary or explanation. Just the data,
formatted as specified above.
```

---

## Known Issues & Follow-up Fixes Needed

- [ ] Dashboard Section 3 — Scheduled Time column displayed as decimal numbers
      (e.g. 0.416666667) instead of HH:MM on first build. Fix prompt sent to
      Claude in Excel; confirm resolved on next open.

---

## Relationship to CircaLog App

This spreadsheet is a **bridge tool**, not a permanent solution. It exists
because CircaLog V1 is still in development and the patient needed to start
capturing data immediately.

When CircaLog V1 reaches a usable logging state, data from this spreadsheet
should be imported. The column structure of the Sleep Log was designed to
match CircaLog's `SleepEntry` type exactly (see `src/lib/circadian/types.ts`).

The V2 medication and meal tracking architecture (see `CircaLog_DevPlan_QA.md`
and `src/lib/circadian/types.ts` — `MedicationDefinition`, `MealDefinition`,
`DoseLogEntry`, `MealLogEntry`) was designed with this spreadsheet's data
structure in mind so that migration will be straightforward.
