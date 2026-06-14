# REPORT — Phase 1 Accessibility Scan

**Generated:** 14 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_AccessibilityScan.md.md`
**Scope:** Static analysis of 25 source files. No source edits, no dev server, no git operations.

---

## Section 1 — Summary Table

Sorted by file path (alphabetical), then by order of appearance within the file.
Rows marked `[×N]` represent elements produced by a `.map()` call; all instances share the same ARIA state.

| # | File | Component / location | Element | Visible text | Existing ARIA | Icon only? | Adequacy | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | src/components/chart/Actogram.tsx | `RangeButtons` — `.map(RANGES)` | `<button>` [×7] | 1W / 2W / 1M / 3M / 6M / 1Y / All | none | no | ❌ missing | No `aria-pressed` to indicate selected range; abbreviated labels ("1W") not expanded to full words for AT |
| 2 | src/components/chart/Actogram.tsx | `Actogram` — `.map(allBlocks)` | `<ReferenceArea>` (renders SVG `<rect>`) [×N] | none | none | yes | ❌ missing | Sleep blocks are clickable (`onClick`) but not keyboard-focusable; no `role`, no `aria-label`, no `onKeyDown`; completely inaccessible to keyboard/AT users |
| 3 | src/components/chart/Actogram.tsx | `Actogram` — empty state | `<button>` | Show all | none | no | ✅ adequate | Visible text sufficient |
| 4 | src/components/chart/Actogram.tsx | `TooltipOverlay` — card | `<div role="button">` | none (visual card) | `role="button"`, `aria-label="View session details"` | no | ✅ adequate | Has role, keyboard-triggerable via click; navigates to session detail |
| 5 | src/components/chart/Actogram.tsx | `TooltipOverlay` — close | `<button>` | × | `aria-label="Close"` | no | ✅ adequate | `aria-label` present; "Close session details" would be more specific but acceptable |
| 6 | src/components/layout/BottomTabBar.tsx | `BottomTabBar` — hamburger | `<button>` | none | `aria-label="Open menu"` | yes | ✅ adequate | Icon-only with correct `aria-label` |
| 7 | src/components/layout/BottomTabBar.tsx | `BottomTabBar` — tabs [×4] | `<button>` | Log / Chart / History / Insights | `aria-label` (each), `aria-current="page"` when active | no | ✅ adequate | Visible text + `aria-current` correctly reflects active tab |
| 8 | src/components/layout/SideDrawer.tsx | `SideDrawer` — drawer panel | `<div>` | n/a | `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"` | n/a | ✅ adequate | Dialog role declared; `aria-label` used instead of `aria-labelledby` — acceptable here |
| 9 | src/components/layout/SideDrawer.tsx | `SideDrawer` — header close | `<button>` | none | `aria-label="Close menu"` | yes | ✅ adequate | |
| 10 | src/components/layout/SideDrawer.tsx | `SideDrawer` — inner `<nav>` | `<nav>` | n/a | `aria-label="Drawer navigation"` | n/a | ✅ adequate | Landmark labeled |
| 11 | src/components/layout/SideDrawer.tsx | `SideDrawer` — primary nav [×4] | `<button>` | Log / Chart / History / Insights | none | no | ✅ adequate | Visible text sufficient |
| 12 | src/components/layout/SideDrawer.tsx | `SideDrawer` — What's New | `<button>` | What's New | none | no | ✅ adequate | |
| 13 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Settings | `<button>` | Settings | none | no | ✅ adequate | |
| 14 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Reports | `<button>` | Reports | none | no | ✅ adequate | |
| 15 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Export | `<button>` | Export | none | no | ✅ adequate | |
| 16 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Import | `<button>` | Import | none | no | ✅ adequate | |
| 17 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Restore Backup | `<button>` | Restore Backup | none | no | ✅ adequate | |
| 18 | src/components/layout/SideDrawer.tsx | `SideDrawer` — About | `<button>` | About | none | no | ✅ adequate | |
| 19 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Privacy Policy | `<button>` | Privacy Policy | none | no | ✅ adequate | |
| 20 | src/components/layout/SideDrawer.tsx | `SideDrawer` — Terms & Conditions | `<button>` | Terms & Conditions | none | no | ✅ adequate | |
| 21 | src/components/ui/ChangelogModal.tsx | `ChangelogModal` — modal panel container | `<div>` | n/a | none | n/a | ❌ missing | No `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`; "What's New" `<h2>` has no `id`; AT cannot identify this as a modal |
| 22 | src/components/ui/ChangelogModal.tsx | `ChangelogModal` — header close | `<button>` | none | `aria-label="Close changelog"` | yes | ✅ adequate | |
| 23 | src/components/ui/ChangelogModal.tsx | `ChangelogModal` — footer dismiss | `<button>` | Got it | none | no | ✅ adequate | |
| 24 | src/components/ui/DeleteConfirmDialog.tsx | `DeleteConfirmDialog` — dialog card container | `<div>` | n/a | none | n/a | ❌ missing | No `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`; "Delete this session?" `<h2>` has no `id` |
| 25 | src/components/ui/DeleteConfirmDialog.tsx | `DeleteConfirmDialog` — full-screen backdrop | `<div onClick={onCancel}>` | none | none | n/a | ❌ missing | Interactive click-to-cancel div has no `role`, no `aria-label`, no `onKeyDown`; AT may announce it as an unnamed interactive region; should be `aria-hidden="true"` |
| 26 | src/components/ui/DeleteConfirmDialog.tsx | `DeleteConfirmDialog` — Cancel | `<button type="button">` | Cancel | none | no | ✅ adequate | |
| 27 | src/components/ui/DeleteConfirmDialog.tsx | `DeleteConfirmDialog` — Delete | `<button type="button">` | Deleting… / Delete | none | no | ✅ adequate | Visible text changes on load |
| 28 | src/components/ui/EmailCapture.tsx | `EmailCapture` — email input | `<input type="email">` | none | none | no | ❌ missing | No `<label htmlFor>`, no `aria-label`, no `aria-labelledby`; placeholder is not a label substitute; inline error messages have no `aria-describedby` link to this input |
| 29 | src/components/ui/EmailCapture.tsx | `EmailCapture` — submit | `<button>` | Sending... / Notify me | none | no | ✅ adequate | |
| 30 | src/components/ui/GoogleSignInButton.tsx | `GoogleSignInButton` | `<button>` | Sign in with Google | none | no | ✅ adequate | Authoritative OAuth label; Google G mark has `aria-hidden="true"` |
| 31 | src/components/ui/QualityPicker.tsx | `QualityPicker` — rating buttons container | `<div>` (flex wrapper) | n/a | none | n/a | ❌ missing | No `role="radiogroup"`, no `aria-label` grouping the rating; AT receives 5 unlabeled toggle buttons with no group context |
| 32 | src/components/ui/QualityPicker.tsx | `QualityPicker` — rating buttons [×5] | `<button type="button">` | 1 / 2 / 3 / 4 / 5 | `aria-pressed={selected}`, `aria-label="Rate sleep quality N out of 5"` | no | ⚠️ partial | Individual buttons are labeled and have `aria-pressed`; however the correct pattern for mutually-exclusive options is `role="radio"` + `aria-checked` inside a `role="radiogroup"`; no `onKeyDown` for arrow-key navigation between options |
| 33 | src/components/ui/ThemeToggle.tsx | `ThemeToggle` | `<button>` | none | `aria-label` (dynamic: "Switch to light mode" / "Switch to dark mode") | yes | ✅ adequate | Dynamic `aria-label` correctly reflects action |
| 34 | src/components/ui/Toast.tsx | `Toast` — container | `<div>` | n/a | `role` (dynamic: "alert"/"status"), `aria-live` (dynamic: "assertive"/"polite") | n/a | ✅ adequate | Live region correctly typed per variant |
| 35 | src/components/ui/Toast.tsx | `Toast` — dismiss | `<button>` | none (× icon) | `aria-label="Dismiss notification"` | yes | ✅ adequate | |
| 36 | src/components/ui/UserAvatar.tsx | `UserAvatar` — sign out | `<button>` | Sign out | none | no | ✅ adequate | |
| 37 | src/pages/AppShell.tsx | `AppShell` — sync status pill | `<div aria-live="polite">` | Synced / Syncing… / Pending sync / Sync error / Saved — Offline | `aria-live="polite"`, `aria-label` (dynamic, full-phrase description) | no | ✅ adequate | Status changes announced politely; `aria-label` conveys full state beyond abbreviated visible text; `aria-atomic="true"` absent but not critical |
| 38 | src/pages/history/HistoryPage.tsx | `HistoryPage` — filter toggle button | `<button type="button">` | none | `aria-label` (dynamic: "Open filters" / "Close filters") | yes | ⚠️ partial | Has `aria-label` but no `aria-expanded`; AT cannot determine whether the panel is currently open or closed without reading it |
| 39 | src/pages/history/HistoryPage.tsx | `HistoryPage` — sort buttons [×4] | `<button type="button">` | Newest / Oldest / Rating ↑ / Rating ↓ | none | no | ⚠️ partial | Visible text present; no `aria-pressed` to indicate which sort is currently active |
| 40 | src/pages/history/HistoryPage.tsx | `HistoryPage` — type filter buttons [×3] | `<button type="button">` | All / Main Sleep / Nap | none | no | ⚠️ partial | No `aria-pressed` to indicate active filter |
| 41 | src/pages/history/HistoryPage.tsx | `HistoryPage` — quality filter buttons [×6] | `<button type="button">` | All / ★ / ★★ / ★★★ / ★★★★ / ★★★★★ | none | no | ❌ missing | Star characters (★) are announced by screen readers as "black star" repeatedly — not meaningful; each star button needs `aria-label` (e.g. `aria-label="1 star"` through `"5 stars"`) |
| 42 | src/pages/history/HistoryPage.tsx | `HistoryPage` — Clear button (filter panel) | `<button type="button">` | Clear | none | no | ✅ adequate | |
| 43 | src/pages/history/HistoryPage.tsx | `HistoryPage` — "Clear filters" (no-match state) | `<button type="button">` | Clear filters | none | no | ✅ adequate | |
| 44 | src/pages/history/HistoryPage.tsx | `EntryCard` [×N] — card | `<div role="button" tabIndex={0} onKeyDown={…}>` | none (visual card) | `role="button"`, `aria-label="View session #N"` | no | ✅ adequate | Has role, keyboard handler (Enter/Space), and descriptive `aria-label` |
| 45 | src/pages/history/HistoryPage.tsx | `EntryCard` — Edit button | `<button type="button">` | Edit | `aria-label="Edit session"` | no | ✅ adequate | Has both visible text and `aria-label` |
| 46 | src/pages/history/HistoryPage.tsx | `EntryCard` — Delete button | `<button type="button">` | none (trash icon) | `aria-label="Delete session"` | yes | ✅ adequate | |
| 47 | src/pages/history/SessionDetailPage.tsx | `SessionDetailPage` — not-found back | `<button type="button">` | ← Back to History | none | no | ✅ adequate | Destination named in visible text |
| 48 | src/pages/history/SessionDetailPage.tsx | `SessionDetailPage` — edit-mode header back | `<button type="button">` | ← Back | none | no | ⚠️ partial | Ambiguous; exits edit mode and returns to read-only view, but label says only "← Back" |
| 49 | src/pages/history/SessionDetailPage.tsx | `SessionDetailPage` — read-only header back | `<button type="button">` | ← Back | none | no | ⚠️ partial | Ambiguous; returns to history list but label gives no destination |
| 50 | src/pages/history/SessionDetailPage.tsx | `SessionDetailPage` — Edit button (header) | `<button type="button">` | Edit | none | no | ✅ adequate | |
| 51 | src/pages/log/ExportPage.tsx | `ExportPage` — back button | `<button>` | none | `aria-label="Go back"` | yes | ✅ adequate | |
| 52 | src/pages/log/ExportPage.tsx | `ExportPage` — download button | `<button>` | Exporting… / Download Backup (.json) | none | no | ✅ adequate | |
| 53 | src/pages/log/ImportPage.tsx | `ImportPage` — back button | `<button>` | none | `aria-label="Back to log"` | yes | ✅ adequate | |
| 54 | src/pages/log/ImportPage.tsx | `ImportPage` — hidden CSV file input | `<input type="file" className="hidden">` | none | `aria-label="Select CSV file"` | n/a | ⚠️ partial | `className="hidden"` (Tailwind `display:none`) removes element from AT; `aria-label` is unreachable; the visible trigger button (row 55) covers the interaction |
| 55 | src/pages/log/ImportPage.tsx | `ImportPage` — file select trigger button | `<button>` | Tap to select a CSV file / .csv only | none | no | ✅ adequate | |
| 56 | src/pages/log/ImportPage.tsx | `ImportPage` — Retry (gate error) | `<button>` | Retry | none | no | ✅ adequate | |
| 57 | src/pages/log/ImportPage.tsx | `ImportPage` — "Choose different file" | `<button>` | Choose different file | none | no | ✅ adequate | |
| 58 | src/pages/log/ImportPage.tsx | `ImportPage` — Import button | `<button>` | Checking… / Import N sessions | none | no | ✅ adequate | |
| 59 | src/pages/log/ImportPage.tsx | `ImportPage` — leave warning dialog container | `<div>` | n/a | none | n/a | ❌ missing | No `role="dialog"`, no `aria-modal`, no `aria-labelledby`; "Import in progress" `<h2>` has no `id` |
| 60 | src/pages/log/ImportPage.tsx | `ImportPage` — leave warning Stay | `<button>` | Stay | none | no | ✅ adequate | |
| 61 | src/pages/log/ImportPage.tsx | `ImportPage` — leave warning Leave anyway | `<button>` | Leave anyway | none | no | ✅ adequate | |
| 62 | src/pages/log/ImportPage.tsx | `ImportPage` — "Back to Log" (done) | `<button>` | Back to Log | none | no | ✅ adequate | |
| 63 | src/pages/log/ImportPage.tsx | `ImportPage` — "Import another file" (done) | `<button>` | Import another file | none | no | ✅ adequate | |
| 64 | src/pages/log/ImportPage.tsx | `ImportPage` — mailto link (sync error) | `<a href="mailto:…">` | <circalog.app@gmail.com> | none | no | ✅ adequate | Email address is a sufficient label |
| 65 | src/pages/log/LogPage.tsx | `LogPage` — "Log manually" | `<button>` | Log manually | none | no | ✅ adequate | |
| 66 | src/pages/log/LogPage.tsx | `LogPage` — "← Back" (manual view header) | `<button>` | ← Back | none | no | ⚠️ partial | Ambiguous without destination context; no `aria-label` |
| 67 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Bed date input | `<input id="bedDate" type="date">` | none | none | no | ❌ missing | Sibling `<label>` "Bed Time" has no `htmlFor="bedDate"`; no programmatic association |
| 68 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Bed time input | `<input id="bedTime" type="time">` | none | none | no | ❌ missing | Same `<label>` has no `htmlFor="bedTime"` |
| 69 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Sleep date input | `<input id="sleepDate" type="date">` | none | none | no | ❌ missing | `<label>` "Fell Asleep" has no `htmlFor="sleepDate"` |
| 70 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Sleep time input | `<input id="sleepTime" type="time">` | none | none | no | ❌ missing | `<label>` "Fell Asleep" has no `htmlFor="sleepTime"` |
| 71 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Wake date input | `<input id="wakeDate" type="date">` | none | none | no | ❌ missing | `<label>` "Woke Up" has no `htmlFor="wakeDate"` |
| 72 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Wake time input | `<input id="wakeTime" type="time">` | none | none | no | ❌ missing | `<label>` "Woke Up" has no `htmlFor="wakeTime"` |
| 73 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Notes textarea | `<textarea id="notes">` | none | none | no | ✅ adequate | `<label htmlFor="notes">Notes</label>` correctly linked |
| 74 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — optional toggle | `<button type="button">` | ▾ Hide optional fields / ▸ More details | none | no | ⚠️ partial | Text changes to indicate state but no `aria-expanded`; AT cannot query open/closed state programmatically |
| 75 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Had Dreams Yes/No [×2] | `<button type="button">` | Yes / No | none | no | ⚠️ partial | Visible text present; no `aria-pressed` to indicate current selection |
| 76 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Dream Notes textarea | `<textarea id="dreamNotes">` | none | none | no | ✅ adequate | `<label htmlFor="dreamNotes">Dream Notes</label>` |
| 77 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — interruption chips [×5] | `<button type="button">` | Bathroom / Thirst / Hunger / Pain / Other | none | no | ⚠️ partial | Visible text present; no `aria-pressed` to show which are active |
| 78 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — interruption note inputs [×N dynamic] | `<input id="interruption-note-{type}" type="text">` | none | none | no | ✅ adequate | `<label htmlFor="interruption-note-{type}">` correctly linked |
| 79 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Medication taken Yes/No [×2] | `<button type="button">` | Yes / No | none | no | ⚠️ partial | No `aria-pressed` |
| 80 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Medication timing [×3] | `<button type="button">` | Before / During / After | none | no | ⚠️ partial | No `aria-pressed` |
| 81 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Save/Update button | `<button type="button">` | Saving… / Update Session / Save Sleep Session | none | no | ✅ adequate | |
| 82 | src/pages/log/ManualEntryForm.tsx | `ManualEntryForm` — Cancel button | `<button type="button">` | Cancel | none | no | ✅ adequate | |
| 83 | src/pages/log/RestorePage.tsx | `RestorePage` — back button | `<button>` | none | `aria-label="Go back"` | yes | ✅ adequate | |
| 84 | src/pages/log/RestorePage.tsx | `RestorePage` — hidden JSON file input | `<input type="file" className="hidden">` | none | `aria-label="Select backup file"` | n/a | ⚠️ partial | Same pattern as row 54: `display:none` removes from AT; `aria-label` unreachable; trigger button (row 85) covers interaction |
| 85 | src/pages/log/RestorePage.tsx | `RestorePage` — file select trigger button | `<button>` | Choose backup file / .json only | none | no | ✅ adequate | |
| 86 | src/pages/log/RestorePage.tsx | `RestorePage` — Merge button | `<button>` | Merge — add N new session(s) | none | no | ✅ adequate | Descriptive text includes count |
| 87 | src/pages/log/RestorePage.tsx | `RestorePage` — Replace button | `<button>` | Replace — delete everything and restore N session(s) | none | no | ✅ adequate | |
| 88 | src/pages/log/RestorePage.tsx | `RestorePage` — Cancel button | `<button>` | Cancel | none | no | ✅ adequate | |
| 89 | src/pages/log/RestorePage.tsx | `RestorePage` — "View sleep history" (done) | `<button>` | View sleep history | none | no | ✅ adequate | |
| 90 | src/pages/log/RestorePage.tsx | `RestorePage` — "Try again" (error) | `<button>` | Try again | none | no | ✅ adequate | |
| 91 | src/pages/log/StartSleepScreen.tsx | `StartSleepScreen` — Start Sleep | `<button>` | Start Sleep | none | no | ✅ adequate | |
| 92 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Sleep date input | `<input id="sleepDate" type="date">` | none | none | no | ❌ missing | `<label>` "Fell Asleep" has no `htmlFor="sleepDate"` |
| 93 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Sleep time input | `<input id="sleepTime" type="time">` | none | none | no | ❌ missing | Same `<label>` has no `htmlFor="sleepTime"` |
| 94 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Wake date input | `<input id="wakeDate" type="date">` | none | none | no | ❌ missing | `<label>` "Wake Time" has no `htmlFor="wakeDate"` |
| 95 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Wake time input | `<input id="wakeTime" type="time">` | none | none | no | ❌ missing | `<label>` "Wake Time" has no `htmlFor="wakeTime"` |
| 96 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Notes textarea | `<textarea id="wakeNotes">` | none | none | no | ✅ adequate | `<label htmlFor="wakeNotes">Notes</label>` |
| 97 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — optional toggle | `<button type="button">` | ▾ Hide optional fields / ▸ More details | none | no | ⚠️ partial | No `aria-expanded` |
| 98 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Had Dreams Yes/No [×2] | `<button type="button">` | Yes / No | none | no | ⚠️ partial | No `aria-pressed` |
| 99 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Dream Notes textarea | `<textarea id="wakeDreamNotes">` | none | none | no | ✅ adequate | `<label htmlFor="wakeDreamNotes">Dream Notes</label>` |
| 100 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — interruption chips [×5] | `<button type="button">` | Bathroom / Thirst / Hunger / Pain / Other | none | no | ⚠️ partial | No `aria-pressed` |
| 101 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — interruption note inputs [×N dynamic] | `<input id="wake-interruption-note-{type}" type="text">` | none | none | no | ✅ adequate | `<label htmlFor="wake-interruption-note-{type}">` linked correctly |
| 102 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Medication taken Yes/No [×2] | `<button type="button">` | Yes / No | none | no | ⚠️ partial | No `aria-pressed` |
| 103 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Medication timing [×3] | `<button type="button">` | Before / During / After | none | no | ⚠️ partial | No `aria-pressed` |
| 104 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Save & Wake Up | `<button type="button">` | Saving… / Save & Wake Up | none | no | ✅ adequate | |
| 105 | src/pages/log/WakeUpScreen.tsx | `WakeUpScreen` — Abandon session | `<button type="button">` | Abandon session | none | no | ✅ adequate | |
| 106 | src/pages/reports/ReportsPage.tsx | `ReportsPage` — back button | `<button>` | none | `aria-label="Go back"` | yes | ✅ adequate | |
| 107 | src/pages/settings/SettingsPage.tsx | `SettingsPage` — back button | `<button>` | none | `aria-label="Go back"` | yes | ✅ adequate | |

---

## Section 2 — Priority Grouping

### ❌ Missing ARIA — fix required (19 elements)

1. **src/components/chart/Actogram.tsx** — Range buttons [×7]: no `aria-pressed`, abbreviated text labels
2. **src/components/chart/Actogram.tsx** — Sleep block `<ReferenceArea>` [×N]: no keyboard access, no role, no label
3. **src/components/ui/ChangelogModal.tsx** — Modal panel container: no `role="dialog"`, no `aria-modal`, no `aria-labelledby`
4. **src/components/ui/DeleteConfirmDialog.tsx** — Dialog card container: no `role="dialog"`, no `aria-modal`, no `aria-labelledby`
5. **src/components/ui/DeleteConfirmDialog.tsx** — Backdrop `<div onClick>`: interactive div with no role, label, or keyboard handler
6. **src/components/ui/EmailCapture.tsx** — Email `<input>`: no label association of any kind; errors not linked via `aria-describedby`
7. **src/components/ui/QualityPicker.tsx** — Rating buttons container: no `role="radiogroup"`, no `aria-label`
8. **src/pages/history/HistoryPage.tsx** — Quality filter buttons [×6]: ★ characters are not meaningful to AT; needs `aria-label` per button
9. **src/pages/log/ImportPage.tsx** — Leave warning dialog container: no `role="dialog"`, no `aria-modal`, no `aria-labelledby`
10. **src/pages/log/ManualEntryForm.tsx** — Bed date input (`bedDate`): `<label>` has no `htmlFor`
11. **src/pages/log/ManualEntryForm.tsx** — Bed time input (`bedTime`): `<label>` has no `htmlFor`
12. **src/pages/log/ManualEntryForm.tsx** — Sleep date input (`sleepDate`): `<label>` has no `htmlFor`
13. **src/pages/log/ManualEntryForm.tsx** — Sleep time input (`sleepTime`): `<label>` has no `htmlFor`
14. **src/pages/log/ManualEntryForm.tsx** — Wake date input (`wakeDate`): `<label>` has no `htmlFor`
15. **src/pages/log/ManualEntryForm.tsx** — Wake time input (`wakeTime`): `<label>` has no `htmlFor`
16. **src/pages/log/WakeUpScreen.tsx** — Sleep date input (`sleepDate`): `<label>` has no `htmlFor`
17. **src/pages/log/WakeUpScreen.tsx** — Sleep time input (`sleepTime`): `<label>` has no `htmlFor`
18. **src/pages/log/WakeUpScreen.tsx** — Wake date input (`wakeDate`): `<label>` has no `htmlFor`
19. **src/pages/log/WakeUpScreen.tsx** — Wake time input (`wakeTime`): `<label>` has no `htmlFor`

---

### ⚠️ Partial ARIA — fix recommended (19 elements)

1. **src/components/ui/QualityPicker.tsx** — Rating buttons [×5]: `aria-pressed` + `aria-label` present, but wrong semantics for mutually-exclusive choice; no arrow-key navigation
2. **src/pages/history/HistoryPage.tsx** — Filter toggle button: has `aria-label` but no `aria-expanded`
3. **src/pages/history/HistoryPage.tsx** — Sort buttons [×4]: visible text but no `aria-pressed`
4. **src/pages/history/HistoryPage.tsx** — Type filter buttons [×3]: visible text but no `aria-pressed`
5. **src/pages/history/SessionDetailPage.tsx** — Edit-mode header back button: "← Back" is ambiguous
6. **src/pages/history/SessionDetailPage.tsx** — Read-only header back button: "← Back" is ambiguous
7. **src/pages/log/ImportPage.tsx** — Hidden CSV file input: has `aria-label` but `display:none` removes it from AT
8. **src/pages/log/LogPage.tsx** — "← Back" button (manual view): ambiguous destination
9. **src/pages/log/ManualEntryForm.tsx** — Optional fields toggle: no `aria-expanded`
10. **src/pages/log/ManualEntryForm.tsx** — Had Dreams Yes/No [×2]: no `aria-pressed`
11. **src/pages/log/ManualEntryForm.tsx** — Interruption chip buttons [×5]: no `aria-pressed`
12. **src/pages/log/ManualEntryForm.tsx** — Medication taken Yes/No [×2]: no `aria-pressed`
13. **src/pages/log/ManualEntryForm.tsx** — Medication timing buttons [×3]: no `aria-pressed`
14. **src/pages/log/RestorePage.tsx** — Hidden JSON file input: same `display:none` issue as row 54
15. **src/pages/log/WakeUpScreen.tsx** — Optional fields toggle: no `aria-expanded`
16. **src/pages/log/WakeUpScreen.tsx** — Had Dreams Yes/No [×2]: no `aria-pressed`
17. **src/pages/log/WakeUpScreen.tsx** — Interruption chip buttons [×5]: no `aria-pressed`
18. **src/pages/log/WakeUpScreen.tsx** — Medication taken Yes/No [×2]: no `aria-pressed`
19. **src/pages/log/WakeUpScreen.tsx** — Medication timing buttons [×3]: no `aria-pressed`

---

### ✅ Adequate — no action needed (69 elements)

Rows: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 26, 27, 29, 30, 33, 34, 35, 36, 37, 42, 43, 44, 45, 46, 47, 50, 51, 52, 53, 55, 56, 57, 58, 60, 61, 62, 63, 64, 65, 73, 76, 78, 81, 82, 83, 85, 86, 87, 88, 89, 90, 91, 96, 99, 101, 104, 105, 106, 107

---

## Section 3 — Special Element Detail

### QualityPicker (`QualityPicker.tsx`)

Each of the five rating buttons has a well-formed `aria-label` ("Rate sleep quality N out of 5") and `aria-pressed` reflecting whether it is selected. However, the correct ARIA pattern for a mutually-exclusive rating control is a `role="radiogroup"` container with `aria-label` describing what is being rated, containing `role="radio"` elements with `aria-checked`. Using `aria-pressed` models each button as an independent toggle, which implies they can be toggled independently — the opposite of their intended behaviour. Additionally, there is no `onKeyDown` handler for arrow-key navigation. Keyboard users must Tab through all five options individually, whereas the radio-group pattern allows Left/Right arrow keys to move within the group. The outer container `<div>` currently has no group role or label, so a screen reader user cannot determine the group's purpose from context alone. When the component is rendered in `ManualEntryForm` and `WakeUpScreen`, the surrounding `<p>` label ("Sleep Quality" / "How did you sleep?") is not associated with the group via `aria-labelledby`.

### Modals and Dialogs (`ChangelogModal.tsx`, `DeleteConfirmDialog.tsx`, `ImportPage.tsx` leave warning)

All three dialog overlays are missing the foundational dialog ARIA pattern. None has `role="dialog"` on the visible panel, none has `aria-modal="true"`, and none has `aria-labelledby` pointing to the panel's heading. Without `role="dialog"`, AT does not announce the overlay as a dialog when it opens. Without `aria-modal="true"`, screen readers in virtual browse mode will continue reading content behind the scrim rather than restricting navigation to the overlay. In `ChangelogModal`, the "What's New" `<h2>` should receive an `id` (e.g. `id="changelog-title"`) and the panel should add `aria-labelledby="changelog-title"`. The same pattern applies to `DeleteConfirmDialog` ("Delete this session?") and the ImportPage leave warning ("Import in progress"). Individually the buttons inside all three dialogs are well labeled (visible text on all action buttons; `aria-label="Close changelog"` on the changelog close button). Additionally, `DeleteConfirmDialog`'s full-screen backdrop `<div onClick={onCancel}>` is an interactive element with no keyboard handler, no ARIA role, and no `aria-hidden`; AT may announce it as an unnamed clickable region. It should be marked `aria-hidden="true"` since keyboard users reach the Cancel button directly.

### Side Drawer (`SideDrawer.tsx`)

The drawer is well implemented. The panel has `role="dialog"`, `aria-modal="true"`, and `aria-label="Navigation menu"`. The close button has `aria-label="Close menu"`. The inner `<nav>` has `aria-label="Drawer navigation"`. All navigation buttons have clear visible text. No structural ARIA gaps were found. One item that requires runtime rather than static verification: focus management on open/close (trapping focus inside the drawer when open, restoring focus to the hamburger button when closed) is not visible in the source code — this should be confirmed during the implementation phase.

### Sync Status Pill (`AppShell.tsx`)

The pill `<div>` has `aria-live="polite"` and a dynamic `aria-label` that describes the full sync state in words (e.g. "Syncing data", "Sync error — some entries could not be saved to the cloud", "Offline — data saved locally"). All five status states (synced, syncing, pending, error, offline) are covered by the dynamic label. Status changes are announced politely via the live region. This element is well implemented. One minor improvement: `aria-atomic="true"` is absent; without it, some AT implementations may announce partial content updates (e.g. just the icon change) rather than the full label as a unit. Adding `aria-atomic="true"` would guarantee the full label is always announced together.

### Tab Bar (`BottomTabBar.tsx`)

The outer `<nav>` has `aria-label="Main navigation"`. All four tab buttons (Log, Chart, History, Insights) display visible text labels and `aria-current="page"` when active. The hamburger button is icon-only with `aria-label="Open menu"`. No gaps were found. This element set is fully compliant.

### Actogram Range Toggle (`Actogram.tsx`)

The seven range buttons (1W, 2W, 1M, 3M, 6M, 1Y, All) are plain `<button>` elements with no `aria-pressed` and abbreviated text labels. A screen reader user hears "1W", "2W", "1M" etc. with no indication which is currently selected and no expansion of the abbreviation (e.g. "1 week", "2 weeks", "1 month"). The visual selected state (border colour change via CSS classes) has no ARIA equivalent. Both `aria-pressed={selectedRange === r}` and an `aria-label` with the full-word description are needed on each button. Additionally, the clickable sleep blocks rendered by `<ReferenceArea>` are SVG `<rect>` elements produced by Recharts with only an `onClick` handler. They are not keyboard-focusable, have no `role`, no `aria-label`, and no `onKeyDown`. Keyboard and AT users cannot interact with individual sleep blocks at all — they can only access the tooltip overlay after a mouse/touch click opens it.

### Form Inputs (`ManualEntryForm.tsx`, `StartSleepScreen.tsx`, `WakeUpScreen.tsx`)

`StartSleepScreen` has no form inputs; its single "Start Sleep" button is adequately labeled with visible text. `ManualEntryForm` and `WakeUpScreen` share the same critical pattern: all date and time `<input>` elements (six in ManualEntryForm, four in WakeUpScreen) have `id` attributes, and adjacent `<label>` elements have matching visible text, but the `<label>` elements lack `htmlFor` attributes. Without `htmlFor`, the association between label and input is purely visual — a screen reader user tabbing to any of these inputs will hear only the field type (e.g. "date picker, edit" or "time, edit") with no field name announced. The fix is to add `htmlFor="bedDate"`, `htmlFor="bedTime"`, etc. to the respective labels (or nest the inputs inside the labels). As a secondary issue, the inline validation error messages (`sleepError`, `wakeError`, `qualityError`) are plain `<p>` elements with no `aria-describedby` link from the relevant input; screen reader users will not know a validation error has appeared unless they navigate to find it. By contrast, the Notes, Dream Notes, and per-interruption-type note inputs in both forms are correctly labeled using `htmlFor`, and these require no changes.

---

## Section 4 — File List

All 25 files were read successfully.

| File | Status |
|---|---|
| `src/components/chart/Actogram.tsx` | Read — 393 lines, contains interactive elements |
| `src/components/layout/BottomTabBar.tsx` | Read — 165 lines, contains interactive elements |
| `src/components/layout/SideDrawer.tsx` | Read — 293 lines, contains interactive elements |
| `src/components/ui/ChangelogModal.tsx` | Read — 132 lines, contains interactive elements |
| `src/components/ui/DeleteConfirmDialog.tsx` | Read — 60 lines, contains interactive elements |
| `src/components/ui/EmailCapture.tsx` | Read — 124 lines, contains interactive elements |
| `src/components/ui/GoogleSignInButton.tsx` | Read — 44 lines, contains interactive elements |
| `src/components/ui/QualityPicker.tsx` | Read — 57 lines, contains interactive elements |
| `src/components/ui/ThemeToggle.tsx` | Read — 79 lines, contains interactive elements |
| `src/components/ui/Toast.tsx` | Read — 110 lines, contains interactive elements |
| `src/components/ui/UserAvatar.tsx` | Read — 72 lines, contains interactive elements |
| `src/pages/AppShell.tsx` | Read — 134 lines, contains sync status live region |
| `src/pages/chart/ChartPage.tsx` | Read — 71 lines, no direct interactive elements (renders `Actogram` component, covered above) |
| `src/pages/history/HistoryPage.tsx` | Read — 502 lines, contains interactive elements |
| `src/pages/history/SessionDetailPage.tsx` | Read — 292 lines, contains interactive elements |
| `src/pages/insights/InsightsPage.tsx` | Read — 272 lines, no interactive elements (read-only stat display) |
| `src/pages/log/ExportPage.tsx` | Read — 131 lines, contains interactive elements |
| `src/pages/log/ImportPage.tsx` | Read — 507 lines, contains interactive elements |
| `src/pages/log/LogPage.tsx` | Read — 90 lines, contains interactive elements |
| `src/pages/log/ManualEntryForm.tsx` | Read — 523 lines, contains interactive elements |
| `src/pages/log/RestorePage.tsx` | Read — 311 lines, contains interactive elements |
| `src/pages/log/StartSleepScreen.tsx` | Read — 32 lines, contains interactive elements |
| `src/pages/log/WakeUpScreen.tsx` | Read — 438 lines, contains interactive elements |
| `src/pages/reports/ReportsPage.tsx` | Read — 60 lines, placeholder page (contains back button only) |
| `src/pages/settings/SettingsPage.tsx` | Read — 58 lines, placeholder page (contains back button only) |
