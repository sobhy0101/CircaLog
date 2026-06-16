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

### ❓ Open question — caffeine mg tracking approach

Choose one:

**Option A — Manual mg entry**
You look up or know the caffeine content and type it in.
More accurate. Requires one extra lookup per entry.

**Option B — Drink-type dropdown with pre-estimated mg (auto-filled)**
You pick the drink from a list; the sheet auto-fills estimated caffeine mg.
Faster for daily logging. Less precise if your portion or brand differs.
Pre-estimated values would include, for example:
- Espresso (single shot) → 63 mg
- Americano (double) → 126 mg
- Filter coffee (250 ml) → 95 mg
- Black tea (200 ml) → 47 mg
- Green tea (200 ml) → 28 mg
- Red Bull (250 ml) → 80 mg
- Cola (330 ml) → 34 mg
- Water / Juice → 0 mg

**Option C — Dropdown with optional mg override (hybrid)**
Auto-fills an estimate; you can override with the real value if you know it.
Best of both — fast by default, accurate when you have the data.
This is the recommended option for V2 import compatibility.

### Proposed column structure (pending caffeine question)

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

- [ ] Add a "Note" to each of the interpretations in the Sleep sheet, matching the app's interpretation notes. This is a reminder to check if the
      app's interpretation notes are still relevant and accurate.
