# Handoff — Accessibility ARIA Labels Task
**Date:** 14 Jun 2026  
**From:** Claude.ai (previous chat)  
**To:** Claude.ai (new chat)  
**Next action:** Read CC scan report → cross-check codebase → write CC implementation task file

---

## What was decided in the previous session

We are working through the Accessibility Implementation section of the TO-DO
list one task at a time. The first task is:

> 🟡 ARIA labels on all interactive elements that lack visible text
> (icon-only buttons, the sync pill, the tab bar icons, the actogram toggle
> buttons, the drawer close button, the quality rating stars)

### Key decisions already made

**Focus trap library:** `focus-trap-react` — confirmed. Not relevant to this
task but noted for the focus trap task that comes later.

**One task at a time:** We are not batching accessibility tasks. Each
TO-DO item gets its own CC task file after a review cycle.

**Scan-first workflow:** Claude.ai reads CC's scan report, cross-checks the
codebase independently, then writes the implementation task file with exact,
file-specific instructions.

**QualityPicker is a structural refactor, not just an attribute addition:**
The quality rating stars need `role="radiogroup"` on the container,
`role="radio"` + `aria-checked` on each option, and `onKeyDown` arrow key
support. This is more than dropping in an `aria-label`.

---

## What CC just completed

Claude Code ran a read-only accessibility scan across all 25 component and
page files. No source files were modified. No git operations were performed.

**Report location:**

```text
C:\Projects\CircaLog\tasks\cc-reports\REPORT_phase1-accessibility-scan_14-jun-2026.md
```

**CC's summary:**
- Total interactive elements found: 107
- ❌ Missing ARIA: 19
- ⚠️ Partial ARIA: 19
- ✅ Adequate: 69
- Files read: 25 / 25

---

## What the new Claude.ai chat needs to do

### Step 1 — Read the CC scan report
Read the full report at:

```text
C:\Projects\CircaLog\tasks\cc-reports\REPORT_phase1-accessibility-scan_14-jun-2026.md
```

### Step 2 — Cross-check the codebase
Read the files that contain ❌ or ⚠️ elements yourself. Do not trust CC's
report blindly — the point of this workflow is that you verify independently.

The files most likely to contain the most issues, based on the scan setup:
- `src/components/ui/QualityPicker.tsx`
- `src/components/ui/ThemeToggle.tsx`
- `src/components/ui/ChangelogModal.tsx`
- `src/components/ui/DeleteConfirmDialog.tsx`
- `src/components/layout/BottomTabBar.tsx`
- `src/components/layout/SideDrawer.tsx`
- `src/components/chart/Actogram.tsx`
- `src/pages/AppShell.tsx`
- `src/pages/log/ManualEntryForm.tsx`
- `src/pages/log/StartSleepScreen.tsx`
- `src/pages/log/WakeUpScreen.tsx`

Read the ones referenced in CC's ❌ and ⚠️ sections. Confirm that CC's
diagnosis is correct, and note anything CC missed or got wrong.

### Step 3 — Write the CC implementation task file

Name: `CC_TASK_Phase1_Accessibility_ARIALabels.md`  
Location: `C:\Projects\CircaLog\tasks\`

**Scope of this task file (ARIA labels only — this is task 1 of 6):**
- Add `aria-label` to all icon-only buttons
- Add `aria-label="Main navigation"` to the tab bar `<nav>`
- Add `aria-current="page"` to the active tab
- Add `role="dialog"` + `aria-modal="true"` + `aria-labelledby` to modals
- Refactor QualityPicker to use `role="radiogroup"` + `role="radio"` +
  `aria-checked` + `onKeyDown` arrow key support
- Add `aria-label` to the actogram range toggle buttons with full words
  ("1 week", "1 month", etc.) not abbreviations
- Add `aria-pressed` to the currently selected range button
- Add `aria-live="polite"` to the sync status pill/region
- Ensure all form inputs have associated `<label>` elements or `aria-label`
- Add `aria-label` to the drawer close button and drawer container role

**Out of scope for this task (covered by later tasks):**
- Focus traps (task 3)
- Tap target sizes (task 5)
- Keyboard shortcuts beyond arrow keys in QualityPicker (task 6)

### Step 4 — Flag anything before writing

If you find any disagreement with CC's report, or any element where the
correct ARIA pattern is non-obvious, flag it to Mahmoud before writing the
task file. Do not guess.

---

## Project context essentials

- **Stack:** React 19 + Vite 8 + TypeScript + TailwindCSS v4
- **Project root:** `C:\Projects\CircaLog\`
- **No `import React from 'react'` in `.tsx` files** — the project uses
  `"jsx": "react-jsx"` + `"noUnusedLocals": true`; the import would cause
  a TS error
- **Task file requirements:** Every CC task file must include a session report
  step (second-to-last) and a git commit step (last), with CC waiting for
  Claude.ai confirmation before committing
- **Tier assessment:** This is a Tier 2 task (touches many files). Flag this
  to Mahmoud at the start of the new chat.
- **Project instructions:** Full instructions are in
  `docs/CircaLog_ProjectInstructions.md` — the new Claude.ai chat should be
  given these as its system prompt / first message context as usual
