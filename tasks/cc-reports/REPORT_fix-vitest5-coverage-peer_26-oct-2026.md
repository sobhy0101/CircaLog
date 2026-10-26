# Fix: Vercel build broken by vitest 5 peer conflict

**Date:** 26 Oct 2026
**Branch:** `fix/vitest5-coverage-peer`

## Problem

Vercel deployments failed at `npm install` with `ERESOLVE`:

```text
Found: vitest@5.0.5
Could not resolve dependency:
peer vitest@"4.1.11" from @vitest/coverage-v8@4.1.11
```

## Root cause

Dependabot PR **#5** (`npm_and_yarn-59c788e105`, titled "bump @vitest/mocker"),
merged 24 Oct, was framed as an indirect security bump but also changed
`package.json`:

- `vitest` `^4.1.8` → `^5.0.5` (a major version)
- `vite` `^8.0.12` → `^8.3.5`

It did not bump `@vitest/coverage-v8`, which pins an exact peer of the same
vitest version. The two became uninstallable together.

PR **#6** (serialize-javascript 7.1.2 → 7.1.4) is harmless. Its preview failed
only because its branch sits on top of the broken `main`.

## Fix

- `@vitest/coverage-v8` `^4.1.8` → `^5.0.5` (peer: `vitest@5.0.5`)
- `package-lock.json` regenerated

## Verification

- `npm ci`: succeeds (matches what Vercel runs)
- `npm run build` (`tsc -b && vite build`): succeeds
- `npx vitest run`: 67 passed, 1 failed. The failure is
  `engine.test.ts > calculateDrift > returns a positive drift for the real dataset`
  (`expected -93 to be greater than 0`). **It fails identically on the pre-merge
  vitest 4 baseline (`f6e1889`)**, so it is pre-existing and unrelated.

## Follow-ups

- After merging, rebase/recreate PR #6 (`@dependabot rebase`) so its preview goes green, then merge.
- Investigate the pre-existing `calculateDrift` test failure separately.
- Consider grouping `vitest` + `@vitest/*` in `dependabot.yml` so they always bump together.
