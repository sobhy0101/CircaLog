# CC TASK — Phase 1: Document Typography Decisions

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Status:** 🔴 Not started

---

## Goal

Record the typography decisions made on 28 May 2026 into
`docs/CircaLog_DevPlan_QA.md`. The QA doc currently has no typography
section. These decisions exist only in chat history and must be made
permanent.

This is a documentation-only task. No source files, no packages,
no build steps.

---

## Context

Two fonts were decided during the logo design session on 28 May 2026:

| Font | Weight | Scope |
|---|---|---|
| Exo 2 | SemiBold (600) | Logo wordmark + in-app headings, section titles, key data callouts |
| Inter | Variable | All body text, inputs, labels, navigation, secondary UI |

Science Gothic was evaluated and rejected — it read as technical sci-fi
rather than medical-adjacent.

---

## ⚠️ Read This Before Running Anything

- Read `docs/CircaLog_DevPlan_QA.md` before writing to it.
- The file ends with a `*— End of Q&A —*` line followed by a blockquote.
  Insert the new section **between** those two lines — after
  `*— End of Q&A —*` and before the `> **Instructions:**` blockquote.
- Do not alter any existing content in the file.
- The new section must pass markdownlint with zero warnings.
  Pay special attention to MD031 — every fenced code block must have a
  blank line before the opening fence and after the closing fence.

---

## Step 1 — Read the QA Doc

Read the full file to confirm its current state and locate the
exact insertion point:

```bash
cat "docs/CircaLog_DevPlan_QA.md"
```

Confirm:

- ✅ The file ends with `*— End of Q&A —*` followed by the
  `> **Instructions:**` blockquote
- ✅ There is no existing typography section anywhere in the file

If a typography section already exists, stop and report — do not
duplicate it.

---

## Step 2 — Append the Typography Section

Insert the following block into `docs/CircaLog_DevPlan_QA.md`
**after** the `*— End of Q&A —*` line and **before** the
`> **Instructions:**` blockquote.

Use a targeted edit — do not rewrite the entire file.

```markdown
---

## 🔤 Supplementary: Typography Decisions

*Decided 28 May 2026 — after the initial Q&A session.*

---

**Exo 2 — SemiBold (weight 600)**

URL: <https://fonts.google.com/specimen/Exo+2>

Scope:

- Logo wordmark (in logo asset files under `public/images/brand/`)
- In-app headings, section titles, and key data callouts
  (cycle number, free-running period value, quality rating)

Rationale: Chosen over Science Gothic (too sci-fi) and Inter (too neutral
for a wordmark). Technical and distinctive without being aggressive.
Letterforms hold well at both large display sizes and smaller heading sizes.

---

**Inter — variable weight, optical-size-aware**

URL: <https://fonts.google.com/specimen/Inter>

Scope: All body text, form inputs, tab labels, navigation items,
notes, timestamps, and all secondary UI copy.

---

**Rejected fonts**

Science Gothic: evaluated for both the logo and app headings.
Rejected — letterforms read as technical sci-fi rather than
medical-adjacent, which conflicts with the trustworthy brief (Q26).
```

---

## Step 3 — Verify the Edit

Read the file back and confirm:

- ✅ The new section appears between `*— End of Q&A —*` and the
  `> **Instructions:**` blockquote
- ✅ All existing content above and below is unchanged
- ✅ Exo 2 and Inter are correctly documented
- ✅ Science Gothic rejection is recorded

---

## Step 4 — Write the Session Report

Write a Markdown session report and save it to `tasks/cc-reports/`
using this filename:

```text
REPORT_phase1-typography-docs_<DD>-<mon>-<YYYY>.md
```

Replace `<DD>-<mon>-<YYYY>` with today's actual date
(e.g. `28-may-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- Packages installed — none expected; confirm none were added
- Deviations — any step where these instructions were not followed
  exactly, and the reason why
- Final file list — every file modified in this session

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- This applies even when a label line immediately precedes the block —
  always insert a blank line between the label and the fence

After writing the report, paste a short summary into the Claude.ai chat
and **wait for confirmation** before running the git commit.

---

## Step 5 — Commit

Only run this after Claude.ai has confirmed the session report:

```bash
git add .
git commit -m "docs: record typography decisions in DevPlan QA doc"
```
