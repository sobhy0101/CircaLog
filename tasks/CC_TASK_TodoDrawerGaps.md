# Task: TO-DO List — Add Missing Drawer Destination Tasks

**Date:** 12 Jun 2026
**Prepared by:** Claude.ai
**Source:** `tasks/cc-reports/REPORT_drawer-missing-links_12-jun-2026.md`
**File affected:** `docs/CircaLog-TO-DO-list.md` (one file only)

---

## Context

CC's drawer audit identified four gaps in the TO-DO list — drawer buttons that
exist and are dead, whose destination tasks were never captured:

1. **Settings page** — no task for `/log/settings` or `SettingsPage` anywhere
2. **Reports page** — Reports & Export section plans the *content* but has no
   task for creating the route stub or wiring the drawer button
3. **About CircaLog page** — "About Non-24" (educational) and "About CircaLog"
   (app info) are two different things; only the educational one is in the
   TO-DO, the app-info page has no task at all
4. **Policy routing** — the Policies section lists page names but makes no
   decision on internal route vs. external URL, and has no drawer wiring tasks

This task adds exactly those four items. No other changes.

---

## Step 1 — Read the file

Read `docs/CircaLog-TO-DO-list.md` in full before touching it.

---

## Step 2 — Four targeted str_replace operations

Make each change as a **separate** str_replace. Do not rewrite the file.
Do not change any content outside the four targeted locations.

---

### Change 1 — Add `⚙️ Settings Page` section before `☕ Drinks Log`

**Rationale:** The Drinks Log is the first V2 section to add a Settings
sub-screen ("Settings — Caffeine reference table"). The Settings shell needs
to exist before those sub-sections are built. Placing the task here makes
the dependency visible.

Find this exact string:

```
### ☕ Drinks Log
```

Replace it with:

```
### ⚙️ Settings Page

- [ ] Create `/log/settings` route and `SettingsPage` component
- [ ] Wire "Settings" drawer button to `/log/settings`
       (This page is the container for the Caffeine reference table, Medication
        Library, and Meal Library listed in their respective V2 sections below.
        Build the shell now; each sub-section populates it as it is built.)

### ☕ Drinks Log
```

---

### Change 2 — Add Reports route stub task at the top of `📤 Reports & Export`

**Rationale:** The Reports section plans what goes on the page but has no
task for creating the route or wiring the drawer button.

Find this exact string:

```
- [ ] Weekly sleep summary (auto-generated)
```

Replace it with:

```
- [ ] Create `/log/reports` route and `ReportsPage` stub — wire "Reports"
       drawer button to this route. Can be a placeholder ("Reports — coming
       soon") until the Doctor Report PDF work begins; the button must not
       remain a dead button in the meantime.
- [ ] Weekly sleep summary (auto-generated)
```

---

### Change 3 — Add `About CircaLog` page task before `About Non-24`

**Rationale:** The drawer "About" button is "About CircaLog" (app version,
credits) — not educational content about the disorder. Those are two separate
things. The educational task already exists; the app-info task does not.

Find this exact string:

```
- [ ] "About Non-24" section in side drawer
```

Replace it with:

```
- [ ] "About CircaLog" page at `/log/about` — wire "About" drawer button
       (App version, open-source attribution, contact/support link.
        Distinct from the "About Non-24" educational content below.)
- [ ] "About Non-24" section in side drawer
```

---

### Change 4 — Add routing decision notes to Privacy Policy and Terms tasks

**Rationale:** The Policies section lists page names but makes no call on
internal route vs. external hosted URL, and no wiring sub-task per button.

Find this exact string (two adjacent lines):

```
- [ ] Privacy Policy page
- [ ] Terms & Conditions page
```

Replace it with:

```
- [ ] Privacy Policy page — decide: internal route `/log/privacy` or external
       hosted URL; then wire the "Privacy Policy" drawer button accordingly
- [ ] Terms & Conditions page — same decision; wire the "Terms & Conditions"
       drawer button
```

---

## Step 3 — Verify

Read `docs/CircaLog-TO-DO-list.md` in full after all four changes. Confirm:

- `### ⚙️ Settings Page` section exists in V2, immediately before `### ☕ Drinks Log`
- Reports route stub task is the first task in the `📤 Reports & Export` section
- `"About CircaLog"` task exists immediately before the `"About Non-24"` task
- Privacy Policy and Terms & Conditions lines include the routing decision note
- No other content was changed

---

## Step 4 — Session Report

Write a report to `tasks/cc-reports/REPORT_todo-drawer-gaps_12-jun-2026.md`.

The report must cover:

- Each of the four str_replace operations: what was found, what was inserted
- Confirmation that the post-change verification in Step 3 passed for all four items
- Any deviation from these instructions, with reasoning

Follow markdownlint rules: blank line before and after every fenced code block,
zero warnings.

Paste a short summary (4–6 lines) into the Claude.ai chat and **wait for
confirmation before running the git commit**.

---

## Step 5 — Commit (after confirmation only)

```
git add docs/CircaLog-TO-DO-list.md
git commit -m "docs: add missing drawer destination tasks to TO-DO list"
```
