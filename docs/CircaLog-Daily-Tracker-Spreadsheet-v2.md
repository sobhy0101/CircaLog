# CircaLog Daily Tracker — Spreadsheet Update Plan (V2)

**Companion to:** `CircaLog-Daily-Tracker-Spreadsheet.md` (current state of the file)
**Purpose:** Accumulates all confirmed changes and open design questions before
a Claude in Excel session executes them in one pass.

Add items here as you remember them. When the list feels complete, hand this
file to Claude.ai and ask it to produce a Claude in Excel prompt.

---

## How to use this file

- ✅ **Confirmed** — decision made, ready to implement
- ❓ **Open question** — needs your input before implementation
- 📝 **Reminder** — something to check or verify during the session

---

## Sheet 2 — Sleep Log

### ✅ Interruptions column — replace free text with dropdown

**Column L** currently accepts any free text (e.g. "bathroom x2, pain").

Change to a **dropdown limited to exactly these values**, in this order:
- Bathroom
- Thirst
- Hunger
- Pain
- Other

This matches the app's `InterruptionType` enum exactly, making future CSV
imports into CircaLog unambiguous.

**Note:** The dropdown only allows one selection per cell in standard Excel
data validation. Since sessions can have multiple interruption types, use a
comma-separated convention for manual entry when multiple apply —
e.g. `Pain, Hunger`. The import parser can split on comma.

---

## Sheet 5 — Drinks Log (NEW)

**Tab color:** Blue-green (distinct from Food Log green and Sleep Log dark blue)
**Position:** After Food Log (fifth sheet)
**Purpose:** One row per drink consumed. Used to track caffeine intake timing
for future CircaLog V2 caffeine curve overlay, and hydration/GERD context.

### ✅ Confirmed — caffeine mg tracking approach: Option C (hybrid)

**Decision:** Dropdown with optional mg override. Auto-fills an estimated
caffeine value from a drink-type list; you can type in a real value when
you know it. Chosen because it's the only option that holds up in practice —
most instant coffee brands (including Misr Cafe) don't publish caffeine
content at all, so manual-only entry (Option A) would mean no value most
days anyway, and a pure auto-fill with no override (Option B) would lose
accuracy on the rare day a real value becomes known.

Pre-estimated values would include, for example:
- Espresso (single shot) → 63 mg
- Americano (double) → 126 mg
- Filter coffee (250 ml) → 95 mg
- Black tea (200 ml) → 47 mg
- Green tea (200 ml) → 28 mg
- Red Bull (250 ml) → 80 mg
- Cola (330 ml) → 34 mg
- Water / Juice → 0 mg
- Misr Cafe instant coffee, home brew (1.5 tsp + splash of full-fat milk) → 90 mg
  *(estimate only — manufacturer does not disclose caffeine content on the
  label; based on general robusta/arabica instant coffee data, working
  range ~70–110 mg)*

**Note on undisclosed-brand estimates:** When a brand doesn't publish caffeine
content, estimate using general per-gram/per-cup ranges for that coffee type
and blend (robusta runs roughly double the caffeine of arabica) and document
the assumption directly next to the value — as above — rather than presenting
a guess as an exact figure.

### Proposed column structure

| Col | Field | Type | Notes |
|---|---|---|---|
| A | Date | Date DD/MM/YYYY | — |
| B | Time | Time HH:MM | When the drink was consumed |
| C | Drink Name | Dropdown or free text | See caffeine question above |
| D | Portion | Dropdown | Small / Medium / Large / Can / Bottle |
| E | Estimated Caffeine mg | Auto or manual | Depends on chosen option |
| F | Actual Caffeine mg | Number, optional | Override field (Option C only) |
| G | Effective Caffeine mg | Auto | =IF(F<>"", F, E) — used by formulas |
| H | GERD Risk | Dropdown | Low / Medium / High |
| I | Notes | Free text | e.g. "drank too fast", "felt reflux after" |

**GERD Risk dropdown values and rationale:**
- **High** — coffee (all types), cola, citrus juice, carbonated drinks, energy drinks
- **Medium** — black tea, green tea, tomato juice, mint tea
- **Low** — water, chamomile tea, non-acidic herbal teas, milk

### Dashboard integration (Section 2 — Food & GERD Safety)

Consider adding a **last drink** row alongside the last meal row, showing:
- Time of last caffeinated drink
- Estimated caffeine still in system (rough half-life: ~5–6 hours)
- GERD risk of last drink

---

## Known Issues Carried Forward

From `CircaLog-Daily-Tracker-Spreadsheet.md`:

- [ ] Dashboard Section 3 — Scheduled Time column displayed as decimal numbers
      (e.g. 0.416666667) instead of HH:MM on first build. Confirm this was
      fixed before closing.

---

## Items to add

*Add any additional fixes or features here as you remember them.*

- [ ] Add a "Note" to each of the interpretations in the Sleep sheet, matching the app's interpretation notes. This is a reminder to check if the app's interpretation notes are still relevant and accurate.
- [ ] If possible, match all Supabase column names and types exactly to the app's database schema, to avoid any import issues. This may require reviewing the app's schema and adjusting the spreadsheet accordingly. Expect the UUID columns, isDeleted, createdAt, updatedAt, and iana_timezone.

---

## Executing the plan

**Claude in Excel prompt:**

```markdown
Please make the following changes to this workbook:

1. SLEEP LOG SHEET — Column L (Interruptions)
   Replace the existing free-text entry with a dropdown (data validation,
   List type) limited to these values, in this order:
   - Bathroom
   - Thirst
   - Hunger
   - Pain
   - Other
   Set the validation's error alert to "Warning" rather than "Stop", since
   the user sometimes needs to type multiple comma-separated values (e.g.
   "Pain, Hunger") that won't match the list exactly — the dropdown should
   guide, not block. Preserve all existing entries in this column as-is.

2. NEW SHEET — "Drinks Log"
   Insert as a new sheet positioned immediately after "Food Log". Set the
   tab color to Sky Blue (clearly distinct from Sleep Log's dark blue,
   Medication Log's teal, and Food Log's green).

   Add a small reference table (place it to the right of the main log, e.g.
   starting around column K) with two columns, Drink Name and Estimated
   Caffeine mg, populated with:
   - Espresso (single shot) → 63
   - Americano (double) → 126
   - Filter coffee (250 ml) → 95
   - Black tea (200 ml) → 47
   - Green tea (200 ml) → 28
   - Red Bull (250 ml) → 80
   - Cola (330 ml) → 34
   - Water / Juice → 0
   - Misr Cafe instant coffee, home brew (1.5 tsp + splash of full-fat milk) → 90

   Build the main log table with frozen header row and alternating row
   shading, matching the style of the other sheets, with these columns:

   | Col | Field | Type | Notes |
   |---|---|---|---|
   | A | Date | Date DD/MM/YYYY | — |
   | B | Time | Time HH:MM | — |
   | C | Drink Name | Dropdown (List, Warning alert, sourced from the reference table's Drink Name column) — but allow free text entry too, since not every drink will be in the list |
   | D | Portion | Dropdown: Small / Medium / Large / Can / Bottle |
   | E | Estimated Caffeine mg | =IFERROR(VLOOKUP(C[row],reference table range,2,FALSE),"") |
   | F | Actual Caffeine mg | Manual number entry, optional |
   | G | Effective Caffeine mg | =IF(F[row]<>"",F[row],E[row]) |
   | H | GERD Risk | Dropdown: Low / Medium / High |
   | I | Notes | Free text |

   Apply conditional formatting to column H matching the workbook's
   existing status-color convention: High = red, Medium = yellow, Low =
   green.

3. DASHBOARD SHEET — Section 2 (Food & GERD Safety)
   Add a "Last Drink" row alongside the existing last-meal row, showing:
   - Time of last caffeinated drink (pull from the most recent Drinks Log
     row by latest Date+Time)
   - Estimated caffeine still in system, using exponential decay with a
     5.5-hour half-life: = EffectiveMg * 0.5^((NOW() - LastDrinkDateTime)*24/5.5)
   - GERD risk of that last drink (pulled from column H)

Do not change anything else in the workbook. After making these changes,
list exactly what you changed so I can verify before saving.
```
