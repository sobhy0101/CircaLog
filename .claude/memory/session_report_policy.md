---
name: session-report-policy
description: "When and how Claude Code must write session reports at the end of every task"
metadata:
  node_type: memory
  type: workflow
  originSessionId: current
---

## Session Report Policy

At the end of every task session, **before committing to GitHub**, Claude Code
must write a comprehensive Markdown session report and save it to
`tasks/cc-reports/`.

This report is a permanent reference for both Claude.ai and Mahmoud. It must
be thorough enough that either can reconstruct exactly what happened, why
decisions were made, and what to watch out for in future sessions.

## When to Write It

After all task steps are complete and verified — but before `git add` /
`git commit`. The report is part of the task, not an afterthought.

## Naming Convention

See `feedback_report_conventions.md` for the full naming rules. Summary:

```
REPORT_phase{N}-{slug}_{DD}-{mon}-{YYYY}.md
```

Examples:

```
REPORT_phase0-pwa_26-may-2026.md
REPORT_phase1-routing_01-jun-2026.md
REPORT_phase0-tasks-1-to-5_25-may-2026.md
```

Save all reports to: `tasks/cc-reports/`

## Required Content

Every report must include:

- **Every step and its outcome** — ✅ succeeded / ❌ failed / ⚠️ adapted
- **Packages installed** — name and exact version for each
- **Dependency warnings** — full warning text and how it was resolved
- **Build output** — clean or full error text
- **Verification results** — what was checked and what was confirmed
- **Deviations** — any step where the task instructions were not followed
  exactly, and the reason why
- **Final file list** — every file created or modified in the session

## Markdownlint Rules — Zero Warnings Allowed

The project has `.markdownlint.json` active. The most common violation is
MD031 — fenced code blocks not surrounded by blank lines.

Rules:

- Every fenced code block must have a blank line **before** the opening fence
- Every fenced code block must have a blank line **after** the closing fence
- This applies even when a label line (e.g. `vite.config.ts:`) immediately
  precedes the block — insert a blank line between the label and the fence
- No exceptions

## After Writing the Report

Paste a short summary into the Claude.ai chat (one paragraph is enough) and
**wait for confirmation** from Claude.ai before running the git commit.
