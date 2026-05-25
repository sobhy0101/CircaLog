# CC TASK — Move Project Docs to `docs/`

**Project:** CircaLog  
**Root:** `C:\Projects\CircaLog\`  
**Assigned to:** Claude Code  
**Status:** 🔴 Not started

> ⚠️ Run this task **before** `CC_TASK_Phase0_Setup.md`.
> The Phase 0 task expects these files to already be in `docs/`.

---

## Goal

Move the four project documentation files from the project root into a
`docs/` subdirectory. This keeps the root clean once the Vite scaffold
adds its own files (`src/`, `public/`, `vite.config.ts`, `package.json`, etc.).

---

## What Moves

| From (root) | To |
|---|---|
| `CircaLog-App-Description.md` | `docs/CircaLog-App-Description.md` |
| `CircaLog-TO-DO-list.md` | `docs/CircaLog-TO-DO-list.md` |
| `CircaLog_DevPlan_QA.md` | `docs/CircaLog_DevPlan_QA.md` |
| `CircaLog_ProjectInstructions.md` | `docs/CircaLog_ProjectInstructions.md` |

## What Stays at the Root (do not move)

```t
README.md          — GitHub renders this from the root
LICENSE            — legal convention, must be at root
.env.example       — developers expect this at root
.gitignore         — Git reads this from root
.gitattributes     — Git reads this from root
.markdownlint.json — linter reads this from root
.claude/           — Claude Code memory, stays at root
.vscode/           — VS Code settings, stays at root
tasks/             — CC task files, stays at root
```

---

## Steps

**Create the `docs/` directory and move the files using `git mv`.**

Use `git mv` instead of a plain `mv` or file manager move. `git mv` tells Git
about the rename so it tracks the file history correctly — the file's full
commit history is preserved under the new path.

```powershell
# Run from C:\Projects\CircaLog in PowerShell

# Create the docs directory
New-Item -ItemType Directory -Force -Path docs

# Move each file — git mv keeps the history intact
git mv CircaLog-App-Description.md  docs/CircaLog-App-Description.md
git mv CircaLog-TO-DO-list.md       docs/CircaLog-TO-DO-list.md
git mv CircaLog_DevPlan_QA.md       docs/CircaLog_DevPlan_QA.md
git mv CircaLog_ProjectInstructions.md docs/CircaLog_ProjectInstructions.md
```

**Verify the moves look correct:**

```bash
git status
```

You should see four `renamed:` entries and nothing unexpected.

**Commit:**

```bash
git commit -m "chore: move project docs to docs/"
```

---

## Notes for CC

- **Do not use `Move-Item` or drag-and-drop.** Always use `git mv` for
  moving tracked files — otherwise Git sees a delete + a new untracked file
  instead of a rename, and the file history is lost.
- **Stop on failure.** If any `git mv` command fails, stop and report the
  error before continuing.
- **Do not edit the contents** of any of these files. This task is a move
  only — no content changes.
