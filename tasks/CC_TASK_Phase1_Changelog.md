# CC Task — Phase 1: In-App Changelog

**Tier:** 2 — new page, new hook, new route, `vite.config.ts` change, `package.json` bump, drawer update, `App.tsx` update

**Prerequisite reads (before writing any code):**

- `CLAUDE.md` — platform rules, React import rules, non-negotiables
- `.claude/memory/MEMORY.md` — full project context
- `.claude/skills/token-usage/SKILL.md` — color tokens (new UI uses design system)
- `.claude/skills/visual-check/SKILL.md` — visual verification procedure
- `.claude/memory/session_report_policy.md` — report format and markdownlint rules

---

## Context

CircaLog uses the Vite PWA plugin with `registerType: 'autoUpdate'` and
`skipWaiting: true`. This means a new service worker activates silently the
next time the user opens the app after an update — but the user currently
has no way to know that anything changed.

This task adds an in-app changelog so that:

1. On the first load after an update, a modal appears automatically showing
   what is new in the current version.
2. At any time, the user can re-open it from the drawer via a "What's New"
   link.

The changelog content lives in `CHANGELOG.md` at the project root. Vite
reads that file at build time and injects its parsed content into the app
bundle as a constant — no runtime file fetch, no network dependency, works
fully offline.

The version string comes from `package.json` via `process.env.npm_package_version`,
exposed by Vite's `define` block as `__APP_VERSION__`. This ensures the
displayed version always matches the deployed build without any manual
synchronization.

---

## Scope

### New files

| File | Purpose |
|---|---|
| `src/hooks/useChangelog.ts` | Parses `__CHANGELOG_CONTENT__`, tracks `lastSeenVersion` in `localStorage`, exposes open/close state |
| `src/components/ui/ChangelogModal.tsx` | Full-screen modal rendering the parsed changelog entries |
| `src/pages/changelog/ChangelogPage.tsx` | Standalone page at `/log/changelog` (for drawer "What's New" link) |

### Modified files

| File | Change |
|---|---|
| `package.json` | Bump `version` from `"0.0.0"` to `"0.1.0"` |
| `vite.config.ts` | Add `define` block: `__APP_VERSION__` and `__CHANGELOG_CONTENT__` |
| `src/App.tsx` | Add route `/log/changelog` |
| `src/components/layout/SideDrawer.tsx` | Add "What's New" drawer entry |
| `src/pages/AppShell.tsx` | Mount `ChangelogModal` and pass open/close handlers |

---

## Step 1 — Read prerequisite files

Read all files listed in the prerequisite block at the top of this task
before writing any code.

---

## Step 2 — Bump version in `package.json`

Read `package.json` before editing.

Change:

```json
"version": "0.0.0"
```

to:

```json
"version": "0.1.0"
```

No other changes to `package.json`.

---

## Step 3 — Update `vite.config.ts`

Read `vite.config.ts` before editing.

Add a `define` block inside the `defineConfig({...})` call, alongside the
existing `plugins`, `build`, `server`, `resolve`, and `test` keys:

```ts
define: {
  // __APP_VERSION__ is replaced at build time with the version string from
  // package.json. Using process.env.npm_package_version means it always
  // matches package.json without any manual synchronisation.
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),

  // __CHANGELOG_CONTENT__ is replaced at build time with the full text of
  // CHANGELOG.md, read from disk. The hook (useChangelog.ts) parses this
  // string into structured entries. Bundling it here means the changelog
  // works fully offline — no network fetch needed at runtime.
  __CHANGELOG_CONTENT__: JSON.stringify(
    require('fs').readFileSync(
      require('path').resolve(__dirname, 'CHANGELOG.md'),
      'utf-8'
    )
  ),
},
```

> **Note on `require` in `vite.config.ts`:** Vite config runs in a Node.js
> CJS context at build time, so `require('fs')` and `require('path')` are
> correct here. Do not use `import fs from 'fs'` — that would conflict with
> the ESM module type declared in `package.json`.

After adding the `define` block, add the following TypeScript declaration at
the top of `vite.config.ts` (below the existing imports, before `export
default`). This tells TypeScript that these two constants exist as globals
anywhere in the app's source code:

```ts
// Declare build-time constants injected by Vite's `define` block.
// These are replaced with literal values during the build — they are not
// runtime variables.
declare const __APP_VERSION__: string
declare const __CHANGELOG_CONTENT__: string
```

Do not place this declaration inside any function or block.

---

## Step 4 — Implement `src/hooks/useChangelog.ts`

This is a `.ts` file (not `.tsx`) — it contains no JSX. It exports one
hook: `useChangelog`.

### Parsing `__CHANGELOG_CONTENT__`

Parse the injected Markdown string into a structured array of release
entries. The Markdown format is:

```markdown
## [0.1.0] — 2026-06-??

### New

- item
- item

### Improved

- item

### Fixed

- item
```

Rules for the parser:

- Split on lines starting with `## [` to identify release blocks.
- For each release block, extract the version number (e.g. `0.1.0`) and the
  date string (everything after ` — `).
- Within each block, split on `### New`, `### Improved`, `### Fixed` to
  extract the three category arrays.
  <!-- markdownlint-disable-next-line MD038 -->
- Lines starting with `- ` are items; strip the leading `- ` and trim.
- Skip categories that have no items — do not include an empty array in the
  output.
- Categories that are absent from the Markdown for a given version simply
  do not appear in that version's parsed entry.

The returned type for a single release:

```ts
export interface ChangelogEntry {
  version: string          // e.g. "0.1.0"
  date: string             // e.g. "2026-06-??" — raw string, not a Date object
  new?: string[]
  improved?: string[]
  fixed?: string[]
}
```

Parse `__CHANGELOG_CONTENT__` once, outside the hook body, at module level
(so it is only parsed once per app session, not on every render):

```ts
const PARSED_ENTRIES: ChangelogEntry[] = parseChangelog(__CHANGELOG_CONTENT__)
```

Add an inline comment explaining why parsing happens at module level.

### `localStorage` key

```ts
const LAST_SEEN_VERSION_KEY = 'circalog_last_seen_version'
```

### Hook signature

```ts
export function useChangelog(): {
  isOpen: boolean
  entries: ChangelogEntry[]
  currentVersion: string
  open: () => void
  close: () => void
}
```

### Hook behavior

On mount (inside a `useEffect` with an empty dependency array):

1. Read `localStorage.getItem(LAST_SEEN_VERSION_KEY)`.
2. Compare to `__APP_VERSION__`.
3. If they differ (or the key is absent — first ever install), call `open()`
   to show the modal automatically.

`close()` must:

1. Set `isOpen` to `false`.
2. Write `__APP_VERSION__` to `localStorage.setItem(LAST_SEEN_VERSION_KEY, __APP_VERSION__)`.
   This records that the user has seen the current version's changelog, so
   the modal will not auto-open again until the next update.

`open()` simply sets `isOpen` to `true`. It does not write to `localStorage`
— that only happens on close.

Return `{ isOpen, entries: PARSED_ENTRIES, currentVersion: __APP_VERSION__, open, close }`.

---

## Step 5 — Implement `src/components/ui/ChangelogModal.tsx`

A full-screen modal overlay that renders the parsed changelog entries.

### Props

```ts
interface ChangelogModalProps {
  isOpen: boolean
  entries: ChangelogEntry[]
  currentVersion: string
  onClose: () => void
}
```

### Render nothing when closed

```tsx
if (!isOpen) return null
```

### Layout

```tsx
{/* Full-screen backdrop — z-60 to sit above the drawer (z-50) */}
<div className="fixed inset-0 z-60 bg-black/70 flex items-end sm:items-center justify-center">

  {/* Modal panel — full width on mobile (bottom sheet style), max-w-lg centred on larger screens */}
  <div className="
    w-full sm:max-w-lg
    max-h-[85vh]
    bg-circa-surface border border-circa-border
    rounded-t-2xl sm:rounded-2xl
    flex flex-col
    overflow-hidden
  ">

    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-circa-border shrink-0">
      <div>
        <h2 className="font-heading font-semibold text-circa-text-primary">
          What's New
        </h2>
        <p className="text-xs text-circa-text-muted mt-0.5">
          Version {currentVersion}
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close changelog"
        className="p-1.5 rounded-md text-circa-text-secondary hover:text-circa-text-primary hover:bg-circa-surface-raised transition-colors"
      >
        {/* X icon — inline SVG, same as SideDrawer close button */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6"  x2="6"  y2="18" />
          <line x1="6"  y1="6"  x2="18" y2="18" />
        </svg>
      </button>
    </div>

    {/* Scrollable entry list */}
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      {entries.map(entry => (
        <div key={entry.version}>
          {/* Version + date */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-heading font-semibold text-circa-accent">
              {entry.version}
            </span>
            <span className="text-xs text-circa-text-muted">
              {entry.date}
            </span>
          </div>

          {/* New */}
          {entry.new && entry.new.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-circa-text-muted mb-1.5">
                New
              </p>
              <ul className="space-y-1">
                {entry.new.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-circa-text-secondary">
                    <span className="text-circa-accent shrink-0">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improved */}
          {entry.improved && entry.improved.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-circa-text-muted mb-1.5">
                Improved
              </p>
              <ul className="space-y-1">
                {entry.improved.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-circa-text-secondary">
                    <span className="text-circa-text-muted shrink-0">↑</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fixed */}
          {entry.fixed && entry.fixed.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-circa-text-muted mb-1.5">
                Fixed
              </p>
              <ul className="space-y-1">
                {entry.fixed.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-circa-text-secondary">
                    <span className="text-green-400 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Footer — dismiss button */}
    <div className="shrink-0 px-5 py-4 border-t border-circa-border">
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-circa-accent text-white hover:opacity-90 transition-opacity"
      >
        Got it
      </button>
    </div>

  </div>
</div>
```

> **Note on `z-60`:** The existing drawer uses `z-50`. The modal must sit
> above the drawer at `z-60`. Check `.claude/skills/token-usage/SKILL.md`
> to confirm whether `z-60` is already in the token system — if not, use
> Tailwind's built-in `z-[60]` arbitrary value rather than inventing a
> new token.

---

## Step 6 — Implement `src/pages/changelog/ChangelogPage.tsx`

A standalone full page at `/log/changelog` — the destination for the
drawer's "What's New" link. It renders the same content as the modal but
as a scrollable page rather than an overlay.

This page exists so the user can navigate back to the changelog at any
time without the modal automatically re-appearing (which only happens
once per version).

### Layout

```tsx
<div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

  {/* Header — same pattern as ExportPage */}
  <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
    <button onClick={() => navigate(-1)} aria-label="Go back">
      {/* Left chevron SVG — same as ExportPage */}
    </button>
    <div>
      <h1 className="font-heading text-lg font-semibold text-circa-text-primary tracking-wide">
        What's New
      </h1>
      <p className="text-xs text-circa-text-muted">Version {__APP_VERSION__}</p>
    </div>
  </div>

  {/* Scrollable entry list — same rendering logic as ChangelogModal,
      but without the fixed overlay wrapper or the "Got it" footer button */}
  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-lg mx-auto w-full">
    {PARSED_ENTRIES.map(entry => (
      /* same entry rendering as ChangelogModal */
    ))}
  </div>

</div>
```

Import `PARSED_ENTRIES` from `@/hooks/useChangelog` — do not re-parse the
Markdown here. Add an inline comment explaining the import.

Do not use `useChangelog` hook here — this page is for read-only display
and does not need to interact with `localStorage` or modal state.

---

## Step 7 — Update `src/pages/AppShell.tsx`

Read `AppShell.tsx` before editing.

1. Import `useChangelog` from `@/hooks/useChangelog`.
2. Import `ChangelogModal` from `@/components/ui/ChangelogModal`.
3. Call the hook at the top of the `AppShell` component:

   ```ts
   const { isOpen: isChangelogOpen, entries, currentVersion, open: openChangelog, close: closeChangelog } = useChangelog()
   ```

4. Mount `ChangelogModal` inside the returned JSX, alongside the existing
   `Toast` and `SideDrawer`:

   ```tsx
   <ChangelogModal
     isOpen={isChangelogOpen}
     entries={entries}
     currentVersion={currentVersion}
     onClose={closeChangelog}
   />
   ```

5. Pass `openChangelog` down to `SideDrawer` as a new prop so the drawer's
   "What's New" button can open the modal directly (in addition to the
   `/log/changelog` page route).

   Update the `SideDrawer` props interface accordingly:

   ```ts
   interface SideDrawerProps {
     isOpen: boolean
     onClose: () => void
     onOpenChangelog: () => void   // ← new
   }
   ```

   And in `AppShell.tsx`:

   ```tsx
   <SideDrawer
     isOpen={isDrawerOpen}
     onClose={() => setIsDrawerOpen(false)}
     onOpenChangelog={openChangelog}
   />
   ```

---

## Step 8 — Update `src/components/layout/SideDrawer.tsx`

Read `SideDrawer.tsx` before editing.

Two changes:

**Change A — Accept the new `onOpenChangelog` prop.**

Update the `SideDrawerProps` interface (must match the update made in Step 7):

```ts
interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
  onOpenChangelog: () => void
}
```

Destructure it in the component signature:

```ts
export default function SideDrawer({ isOpen, onClose, onOpenChangelog }: SideDrawerProps) {
```

**Change B — Add "What's New" entry in the More section.**

Insert a new drawer entry near the top of the "More" section, above
"Settings". The button opens the changelog modal and closes the drawer:

```tsx
{/* What's New */}
<button
  onClick={() => { onOpenChangelog(); onClose(); }}
  className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {/* Sparkles / star icon */}
    <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
  </svg>
  What's New
</button>
```

Do not remove or reorder any existing drawer entries.

---

## Step 9 — Add route in `src/App.tsx`

Read `src/App.tsx` before editing.

Add the new route inside the `/log` block:

```tsx
<Route path="changelog" element={<ChangelogPage />} />
```

Import `ChangelogPage` from `@/pages/changelog/ChangelogPage`.

---

## Step 10 — Visual verification

Follow `.claude/skills/visual-check/SKILL.md`.

Check all of the following:

- [ ] `npm run build` completes with no TypeScript errors and no Vite errors
- [ ] `__APP_VERSION__` resolves to `"0.1.0"` in the built output
      (search the built JS files in `dist/` for the string `"0.1.0"`)
- [ ] `__CHANGELOG_CONTENT__` resolves to the full CHANGELOG.md text
      (confirm the built output contains text from the changelog)
- [ ] On first load (after clearing `circalog_last_seen_version` from
      localStorage), the changelog modal appears automatically
- [ ] Modal renders correctly in dark mode — all text readable, no tokens
      missing, no layout overflow
- [ ] Modal renders correctly in light mode
- [ ] "Got it" button closes the modal
- [ ] After closing, refreshing the page does NOT re-open the modal
      (because `lastSeenVersion` now matches `__APP_VERSION__`)
- [ ] Drawer "What's New" button opens the modal from any page
- [ ] `/log/changelog` page renders all entries correctly in dark and light modes
- [ ] Back button on `/log/changelog` navigates correctly
- [ ] All three categories (New / Improved / Fixed) render correctly when present
- [ ] Categories absent from a version entry do not render an empty section
- [ ] No TypeScript errors (`npm run build` clean)

---

## Step 11 — Session report

Write the session report to `tasks/cc-reports/` following the naming
convention in `.claude/memory/session_report_policy.md`:

```txt
REPORT_phase1-changelog_{DD}-{mon}-{YYYY}.md
```

The report must include:

- Every step and its outcome (✅ / ❌ / ⚠️ adapted)
- Packages installed (none expected — confirm explicitly)
- Build output (clean or full error text)
- `__APP_VERSION__` value confirmed in built output
- All visual verification results
- Any deviations from these instructions and the reason
- Complete list of files created and modified

After writing the report, paste a short summary into the Claude.ai chat and
**wait for confirmation** before running `git commit`.

---

## Step 12 — Commit (after Claude.ai confirms)

```powershell
git add -A
git commit -m "feat: in-app changelog modal and What's New drawer entry (v0.1.0)"
git push
```

---

## Files this task must NOT touch

- Any file under `src/lib/circadian/` (pure engine layer)
- Any file under `src/hooks/` except the new `useChangelog.ts`
- Any existing page files other than `AppShell.tsx`
- `supabase/` migrations — no database schema changes in this task
- `CHANGELOG.md` — already written; read it, do not modify it
