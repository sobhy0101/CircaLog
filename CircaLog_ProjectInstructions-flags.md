# 🌙 CircaLog — Flags & Questions
## Amendment to project documentation — raised May 2026

This file documents issues found during a full codebase scan conducted when
setting up `CircaLog_ProjectInstructions.md`. Each item is numbered, labeled
by severity, and linked to the file it concerns.

---

## 🔴 FLAG 1 — `gitignore` is missing its leading dot

**File:** `C:\Projects\CircaLog\gitignore`
**Severity:** Critical — Git is currently ignoring nothing

The ignore file is named `gitignore` instead of `.gitignore`. Git only
recognizes the dotfile form. As it stands, all the rules inside it
(node_modules, dist, .env, .env.local, build output, OS junk, etc.) are
completely inactive. If you commit right now, `node_modules/` and
`.env.local` could be pushed to GitHub.

**Fix (one command in Claude Code or any terminal):**
```bash
git mv gitignore .gitignore
git add .gitignore
git commit -m "fix: rename gitignore to .gitignore"
```
Or if Git hasn't been initialised yet, just rename the file in Explorer or VS
Code and make sure `.gitignore` is the name going forward.

---

## 🟡 FLAG 2 — `~$rcaLog_ProjectInstructions.md` temp file in project root

**File:** `C:\Projects\CircaLog\~$rcaLog_ProjectInstructions.md`
**Severity:** Medium — should not be committed to GitHub; may cause write
conflicts

This is a Microsoft Office lock file. Word (or another Microsoft 365 app)
creates a `~$` prefixed file whenever it has a document open. This means
`CircaLog_ProjectInstructions.md` was opened in Word at some point — or is
open right now.

**Two things to check:**
1. If the file is still open in Word, close it. The `~$` file will disappear.
2. Once closed, add this pattern to `.gitignore` so it can never be committed:

```gitignore
# Microsoft Office lock files
~$*
```

**Note:** This lock file is also why the write to `CircaLog_ProjectInstructions.md`
failed during this session — the file was locked. Close it in Word first, then
the instructions file can be updated.

---

## 🟡 FLAG 3 — `README.md` contains a placeholder GitHub URL

**File:** `C:\Projects\CircaLog\README.md`
**Severity:** Medium — incorrect clone URL for anyone (including your future
self) who follows the Getting Started section

The README currently has:
```bash
git clone https://github.com/[username]/circalog.git
```

Now that the repo URL is confirmed, this should be updated to:
```bash
git clone https://github.com/sobhy0101/CircaLog.git
```

**Fix:** A targeted single-line edit to `README.md` — Claude.ai can do this
directly once you confirm it's ready.

---

## 🟢 NOTE 4 — `.vscode/` contains only LTeX personal dictionary files

**Files:**
- `C:\Projects\CircaLog\.vscode\ltex.dictionary.en-US.txt`
- `C:\Projects\CircaLog\.vscode\ltex.hiddenFalsePositives.en-US.txt`

**Severity:** Low / informational

The current `.gitignore` (once renamed) allows `.vscode/extensions.json`
and `.vscode/settings.json` but ignores everything else in `.vscode/`.
The two LTeX files present are personal spell-check dictionaries and would
be ignored by Git — which is correct behavior, since they're personal.

No action needed unless you want to share your LTeX dictionary with future
contributors. If so, the `.gitignore` whitelist would need updating.

---

## 🟢 NOTE 5 — `.env.example` is minimal but correct for V1

**File:** `C:\Projects\CircaLog\.env.example`
**Severity:** Low / informational

Current contents:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

This is correct for V1 since cloud sync and auth are V2 features.
However, the `README.md` Getting Started section tells developers to
"create a `.env.local` file" but does not mention `.env.example` as the
template to copy from. Minor improvement to README wording when convenient.

When V2 Supabase auth is set up (Google Sign-In), the following key will
likely need to be added:
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
```
No action needed now — just a reminder for V2.

---

## 🟢 NOTE 6 — `.claude/memory/` files exist from a prior Claude Code session

**Files:**
- `C:\Projects\CircaLog\.claude\memory\MEMORY.md`
- `C:\Projects\CircaLog\.claude\memory\project_circalog.md`

**Severity:** Low / informational

Claude Code has already been used on this project and created its own memory
files. The content in `project_circalog.md` is accurate but less detailed
than `CircaLog_ProjectInstructions.md`. No conflict — they serve different
purposes:

- `.claude/memory/` → Claude Code's working memory (auto-managed by CC)
- `CircaLog_ProjectInstructions.md` → the authoritative human-readable
  instruction document for both Claude.ai and Claude Code

No action needed. Claude Code will update its own memory files as the project
evolves. Do not manually edit them unless Claude Code asks you to.

---

## 🟢 NOTE 7 — TO-DO-list uses `[✅]` instead of `[x]` for completed items

**File:** `C:\Projects\CircaLog\CircaLog-TO-DO-list.md`
**Severity:** Cosmetic / informational

GitHub's task list syntax for checked items is `- [x]`, not `- [✅]`.
The emoji variant will render as a plain unchecked box on GitHub, making
completed items look the same as pending ones.

Current (won't render as checked on GitHub):
```markdown
- [✅] 🟢 Write `README.md`
```

Correct GitHub task list syntax:
```markdown
- [x] 🟢 Write `README.md`
```

**Fix:** A find-and-replace of `[✅]` → `[x]` across the TO-DO file.
Claude.ai can do this directly when you're ready.

---

*Flags raised by Claude.ai during project documentation setup.*
*Resolve or acknowledge each item before first public commit to GitHub.*
