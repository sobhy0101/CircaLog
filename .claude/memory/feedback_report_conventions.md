---
name: feedback_report_conventions
description: Rules for naming and writing CC session reports in the CircaLog project
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 369c5670-52b3-4852-b867-518656a57221
---

Always use the `REPORT_` prefix for CC session report filenames.
Preferred format: `REPORT_phase{N}-tasks-{X}-to-{Y}_{DD}-{mon}-{YYYY}.md`
Examples: `REPORT_phase0-tasks-1-to-5_25-may-2026.md`, `REPORT_phase1-routing_01-jun-2026.md`

**Why:** The user prefers a consistent, scannable naming convention so all reports are easy to find and sort by phase/task range and date.

**How to apply:** Every time a CC session report is written, use this naming pattern. If only one task is covered, use `tasks-{N}` (no "to"). Save all reports in `tasks/cc-reports/`.

Always write zero markdownlint warnings or errors in report files. The project has `.markdownlint.json` active in VSCode.

**Why:** 58 MD031 warnings appeared in the first report (fenced code blocks not surrounded by blank lines), which the user caught and required fixing.

**How to apply:** Before writing any code fence (` ``` `), ensure there is a blank line before the opening fence AND a blank line after the closing fence. No exceptions — even when the text label (e.g., "`filename.ts`:") immediately precedes the block, insert a blank line between the label and the fence.
