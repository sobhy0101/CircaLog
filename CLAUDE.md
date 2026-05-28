# CircaLog — Claude Code Project Instructions

## Read at the Start of Every Session

1. Read `.claude/memory/MEMORY.md` — full project context, stack versions, architecture, and report conventions
2. Check the skills table below — read the relevant skill file before starting any task in that domain

---

## Skills

Project skills live in `.claude/skills/`. Each skill encodes hard-won conventions for a recurring task type. Read the relevant skill before writing any code or running any commands in that domain — do not rediscover what is already documented.

| Task involves | Read before starting |
|---|---|
| Starting the dev server or running Playwright | `.claude/skills/run/SKILL.md` |
| Visual browser verification (theme, layout, rendering) | `.claude/skills/visual-check/SKILL.md` |
| Using or extending the color token system | `.claude/skills/token-usage/SKILL.md` |

When a new skill is added to `.claude/skills/`, this table will be updated.
If a task type is not listed, check whether a skill file exists anyway before proceeding — the table may not yet reflect the latest skills.

---

## Platform: Windows — PowerShell Only

This project runs on a Windows machine. All terminal commands must be PowerShell. Never use bash syntax — it will fail silently or throw errors.

| Do not use | Use instead |
|---|---|
| `npm run dev &` | `Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WindowStyle Hidden` |
| `kill $(lsof -t -i:5173)` | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173 -State Listen).OwningProcess -Force` |
| `curl -s http://...` | `Invoke-WebRequest -Uri "http://..." -UseBasicParsing` |
| `mkdir -p path/to/dir` | `New-Item -ItemType Directory -Force -Path "path/to/dir"` |

---

## Non-Negotiable Rules

**Read before editing.** Always read a file's current contents before modifying it. Never edit blind.

**Session report before every commit.** Every task ends with a Markdown session report saved to `tasks/cc-reports/`. After writing it, paste a short summary into the Claude.ai chat and wait for confirmation before running `git commit`. Full policy: `.claude/memory/session_report_policy.md`.

**Never commit screenshots.** `tasks/screenshots/` is in `.gitignore`.
Screenshots are verification artifacts only — they must not be staged or committed.

**Inline comments on non-obvious code.** The developer (Mahmoud) is confident in HTML/CSS but JavaScript and React are not his primary expertise. Any non-obvious logic, React pattern, or TypeScript feature must have a short inline comment explaining what it does.
