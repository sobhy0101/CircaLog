# CC Task — Fix Dependabot Preview Build Failure

**Date:** 08 Jun 2026
**Assigned to:** Claude Code
**Complexity:** Tier 2 (requires GitHub MCP, shell commands, Vercel diagnosis)
**Risk:** Low — no app code changes expected

---

## Background

A Dependabot branch (`dependabot/npm_and_yarn/npm_and_yarn-4825ac1e2e`) was
merged into `main`. It introduced a `UserConfig` import from `'vitest/config'`
into `vite.config.ts`. This import does not exist in Vitest 4.x and causes the
TypeScript build to fail with:

```log
vite.config.ts(6,15): error TS2305: Module '"vitest/config"' has no exported member 'UserConfig'.
Error: Command "npm run build" exited with 2
```

This error only affects Vercel **Preview** builds. The Production build on
`main` is currently passing. The repo has **no open branches** — only `main`.

The local `vite.config.ts` on `main` does NOT contain this bad import (already
verified by Claude.ai). The broken commit was merged from Dependabot and may
have been reverted or may still be present in the deployed state Vercel is
using for Preview.

---

## Goal

Diagnose the exact state of affairs — why Vercel Preview is still failing when
`main` looks clean locally — and fix it so that both Production and Preview
build successfully.

---

## Steps

### Step 1 — Read the skills

Read `.claude/skills/run/SKILL.md` before running the dev server or any build.

### Step 2 — Confirm the current state of `vite.config.ts` on disk

Run:

```powershell
Get-Content C:\Projects\CircaLog\vite.config.ts | Select-Object -First 20
```

Confirm there is NO `UserConfig` import from `'vitest/config'`. If there is,
that is the root cause and needs to be removed (see Step 5).

### Step 3 — Check git log for the Dependabot merge

Run:

```powershell
cd C:\Projects\CircaLog
git log --oneline -20
```

Look for the Dependabot commit (`chore(deps-dev): bump vitest` or similar).
Note its hash and what files it touched:

```powershell
git show <commit-hash> --stat
```

If `vite.config.ts` was modified by that commit, check what changed:

```powershell
git show <commit-hash> -- vite.config.ts
```

### Step 4 — Use GitHub MCP to inspect the repo state

Use the GitHub MCP to:

1. List all branches on `sobhy0101/CircaLog` — confirm only `main` exists.
2. Check the latest commit on `main` and confirm `vite.config.ts` content
   does not contain `UserConfig`.
3. Check if any Vercel deployments are still queued or running against a
   stale branch reference.

### Step 5 — Fix `vite.config.ts` if the bad import is present

If `vite.config.ts` contains any import of `UserConfig` from `'vitest/config'`,
remove it. The correct file must:

- Import `defineConfig` from `'vite'` only (not from `'vitest/config'`)
- Have `} as any)` at the end of the `defineConfig({...})` call
- Have a `test: { ... }` block inside `defineConfig`
- Have NO `UserConfig` type annotation anywhere

The current clean version is already on disk — do NOT rewrite the file unless
the bad import is actually present.

### Step 6 — Run a local build to verify

```powershell
cd C:\Projects\CircaLog
npm run build
```

Build must complete with zero TypeScript errors. Note the full output.

### Step 7 — If a fix was made, commit and push

If `vite.config.ts` was modified in Step 5:

```powershell
git add vite.config.ts
git commit -m "fix(build): remove UserConfig import from vitest/config (Vitest 4.x compat)"
git push origin main
```

If no file changes were needed, skip this step.

### Step 8 — Use Vercel MCP to investigate the Preview failure

Use the Vercel MCP to:

1. List recent deployments for the `circalog` project.
2. Find the failing Preview deployment and fetch its build logs.
3. Identify the exact commit SHA it was built from.
4. Check if that SHA corresponds to the Dependabot merge commit — i.e., whether
   Vercel is rebuilding an old commit that pre-dates any local fix.

If the failing Preview deployment is building an old commit that no longer
exists as a branch, it may be a stale Vercel deployment that can be cancelled
or will naturally expire.

### Step 9 — Write the session report

Write a comprehensive Markdown report covering:

- What was found in `vite.config.ts` on disk
- What `git log` showed about the Dependabot merge
- What the GitHub MCP confirmed about branch state
- What the Vercel MCP showed about the failing deployment
- Whether any files were modified
- The result of `npm run build`
- Full list of files created or modified (if any)

Save the report to:

```text
tasks/cc-reports/REPORT_fix-dependabot-preview-build_08-jun-2026.md
```

Follow all markdownlint rules — blank line before and after every fenced code
block. Zero warnings allowed.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running any git commit.

---

## What NOT to Do

- Do not rewrite `vite.config.ts` unless the `UserConfig` import is actually
  present on disk.
- Do not merge or create any new branches.
- Do not change any dependencies in `package.json`.
- Do not modify any source files in `src/`.
