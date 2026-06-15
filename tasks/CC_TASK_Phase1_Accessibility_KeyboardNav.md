# CC Task — Phase 1 Accessibility: Keyboard Navigation

**Task file:** `CC_TASK_Phase1_Accessibility_KeyboardNav.md`
**Date:** 15 Jun 2026
**Scope:** Task 2 of 6 in the Accessibility Implementation series.
Fix keyboard navigation across the entire app: resolve SideDrawer tab leakage
when closed, add intentional focus traps to all four overlays, add Escape key
dismissal to all four overlays, and add a global focus-visible ring to all
interactive elements. Requires one new dependency: `focus-trap-react`.

---

## Background

The ARIA labels task (Task 1 of 6) has been executed and committed.
All interactive elements have correct ARIA attributes. This task addresses
the next layer: keyboard reachability and overlay focus management.

Four problems are fixed here:

1. **SideDrawer tab leakage** — The drawer panel is always in the DOM (CSS
   transform animation, not conditional rendering). All 14+ buttons inside the
   closed drawer are permanently in the Tab order. A keyboard user Tabs through
   the bottom bar and immediately falls into the hidden drawer content.
   Fix: `inert` attribute on the panel when `!isOpen`.

2. **No focus traps** — All four overlays (SideDrawer when open,
   ChangelogModal, DeleteConfirmDialog, ImportPage leave-warning) allow Tab
   to escape into the page behind them.
   Fix: `focus-trap-react` wrapping each overlay.

3. **No Escape key** — None of the four overlays close on Escape.
   Fix: `onKeyDown` handler on each overlay's dialog element.

4. **No focus movement on open/close** — Focus doesn't move into overlays when
   they open, and isn't returned to the trigger when they close.
   Fix: `focus-trap-react` with `returnFocusOnDeactivate: true` handles return
   automatically; default `initialFocus` (first tabbable element) handles
   the move-in.

---

## Explicitly excluded — do NOT touch

- **Actogram `ReferenceArea` sleep blocks** — keyboard access deferred to a
  later task.
- **Actogram `TooltipOverlay`** — the tooltip is only reachable via mouse/touch
  (tied to the deferred sleep block keyboard task). Do not add a focus trap.
- **Tab order on individual pages** — all pages have correct natural document
  order already. No changes needed beyond the overlay fixes.
- **Any file not listed in the steps below.**

---

## Step 0 — Read CLAUDE.md

Read `CLAUDE.md` at the project root before doing anything else.

---

## Step 1 — Install focus-trap-react

`focus-trap-react` ships its own TypeScript types since v9. No separate
`@types/` package is needed.

```bash
npm install focus-trap-react
```

After installation, confirm `focus-trap-react` appears in the `dependencies`
section of `package.json` before proceeding.

---

## Step 2 — index.css — global :focus-visible rule

**File:** `src/index.css`

Read the file first.

Insert the following block **immediately after** the `body { font-family: var(--font-sans); }`
rule and **before** the first `@keyframes` block:

```css
/* ── Focus visible indicator ────────────────────────────────────────────────
   Provides a consistent purple ring on keyboard focus for all interactive
   elements that don't already define their own focus-visible style.
   Placed in @layer base so Tailwind utility classes (focus-visible:outline-none,
   focus-visible:ring-*) in @layer utilities always take priority.
   Result:
   - Buttons with no explicit focus-visible class → purple ring on Tab ✓
   - ThemeToggle (focus-visible:outline-none + ring-*) → box-shadow ring ✓
   - Form inputs (focus:outline-none + border color) → border change only ✓  */
@layer base {
  :focus-visible {
    outline: 2px solid var(--circa-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
}
```

Do not alter any other part of the file.

---

## Step 3 — SideDrawer.tsx

**File:** `src/components/layout/SideDrawer.tsx`

Read the file first.

### 3a — Add import

Add after the last existing import line:

```tsx
import FocusTrap from 'focus-trap-react';
```

### 3b — Wrap the drawer panel with FocusTrap

The return statement currently contains a fragment (`<>`) with two children:
(1) a conditionally rendered backdrop `<div>`, and (2) the drawer panel `<div>`.

Replace **only** the drawer panel `<div>` (child #2) with the following
structure. The interior content of the panel — the header, auth zone,
scrollable nav area, and footer — is **entirely unchanged**. Only the
outer wrapper changes.

Before (drawer panel, no FocusTrap):

```tsx
<div
  className={`
    fixed top-0 left-0 h-full w-72 z-50
    bg-circa-surface border-r border-circa-border
    transform transition-transform duration-300 ease-in-out
    flex flex-col
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `}
  role="dialog"
  aria-modal="true"
  aria-label="Navigation menu"
>
  {/* ... interior content ... */}
</div>
```

After (FocusTrap wrapping the panel, with inert and onKeyDown added):

```tsx
{/* FocusTrap wraps the drawer panel only. The backdrop is outside the trap
    so backdrop clicks pass through to onClose normally.
    active={isOpen}: trap activates on open, deactivates on close.
    escapeDeactivates: false — Escape is handled explicitly via onKeyDown.
    returnFocusOnDeactivate: true — returns focus to the element that was
      focused before the drawer opened (typically the hamburger button).
    allowOutsideClick: true — backdrop click must still reach onClose. */}
<FocusTrap
  active={isOpen}
  focusTrapOptions={{
    escapeDeactivates: false,
    returnFocusOnDeactivate: true,
    allowOutsideClick: true,
  }}
>
  {/* inert when closed: removes all child elements from the Tab order
      and blocks keyboard/pointer events on the off-screen panel.
      React 19 types accept inert as '' | undefined on HTMLElement props. */}
  <div
    inert={!isOpen ? '' : undefined}
    onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    className={`
      fixed top-0 left-0 h-full w-72 z-50
      bg-circa-surface border-r border-circa-border
      transform transition-transform duration-300 ease-in-out
      flex flex-col
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}
    role="dialog"
    aria-modal="true"
    aria-label="Navigation menu"
  >
    {/* ── All existing interior content unchanged ── */}
  </div>
</FocusTrap>
```

Keep the closing `</>` of the fragment.

---

## Step 4 — ChangelogModal.tsx

**File:** `src/components/ui/ChangelogModal.tsx`

Read the file first.

### 4a — Add import

Add after the last existing import line:

```tsx
import FocusTrap from 'focus-trap-react';
```

### 4b — Wrap the modal panel with FocusTrap and add onKeyDown

The component conditionally returns `null` when `!isOpen`, so no `inert` is
needed — the entire component is simply not in the DOM when closed.

The return statement contains a full-screen backdrop `<div>` (class
`fixed inset-0 z-60 ...`) with the modal panel `<div>` (with `role="dialog"`)
as its child.

Wrap the modal panel `<div>` with `<FocusTrap>`, and add `onKeyDown` to the
panel div. The modal panel's interior content (header, scrollable entry list,
footer) is **entirely unchanged**.

Before (modal panel, no FocusTrap):

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="changelog-title"
  className="
    w-full sm:max-w-lg
    max-h-[85vh]
    bg-circa-surface border border-circa-border
    rounded-t-2xl sm:rounded-2xl
    flex flex-col
    overflow-hidden
  "
>
  {/* ... interior content ... */}
</div>
```

After:

```tsx
{/* No active prop: FocusTrap defaults to active={true} on mount.
    The component only renders when isOpen is true, so the trap is
    always active while the modal is visible.
    returnFocusOnDeactivate: true — returns focus to the trigger element
      (e.g. the "What's New" button) when the modal closes.
    allowOutsideClick: true — the backdrop has no click handler here,
      but keeping this consistent prevents any interference. */}
<FocusTrap
  focusTrapOptions={{
    escapeDeactivates: false,
    returnFocusOnDeactivate: true,
    allowOutsideClick: true,
  }}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="changelog-title"
    onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    className="
      w-full sm:max-w-lg
      max-h-[85vh]
      bg-circa-surface border border-circa-border
      rounded-t-2xl sm:rounded-2xl
      flex flex-col
      overflow-hidden
    "
  >
    {/* ── All existing interior content unchanged ── */}
  </div>
</FocusTrap>
```

---

## Step 5 — DeleteConfirmDialog.tsx

**File:** `src/components/ui/DeleteConfirmDialog.tsx`

Read the file first.

### 5a — Add import

Add after the last existing import line:

```tsx
import FocusTrap from 'focus-trap-react';
```

### 5b — Wrap the dialog card with FocusTrap and add onKeyDown

The component always renders when mounted (it's only mounted when
`deleteTarget` is set in HistoryPage). The return statement contains a
full-screen backdrop `<div>` (with `onClick={onCancel}`) containing the
dialog card `<div>` (with `role="dialog"` and `onClick={e => e.stopPropagation()}`).

Wrap the dialog card `<div>` with `<FocusTrap>`, and add `onKeyDown` to the
card div. The card's interior content (title, description, Cancel and Delete
buttons) is **entirely unchanged**.

The first focusable element in the card is the Cancel button — correct default.
Do not set `initialFocus`.

Before (card, no FocusTrap):

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="delete-dialog-title"
  className="bg-circa-surface border border-circa-border rounded-2xl w-full max-w-sm p-5"
  onClick={e => e.stopPropagation()}
>
  {/* ... interior content ... */}
</div>
```

After:

```tsx
{/* allowOutsideClick: true — the backdrop's onClick={onCancel} must still fire
    when the user taps outside the card. */}
<FocusTrap
  focusTrapOptions={{
    escapeDeactivates: false,
    returnFocusOnDeactivate: true,
    allowOutsideClick: true,
  }}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-dialog-title"
    className="bg-circa-surface border border-circa-border rounded-2xl w-full max-w-sm p-5"
    onClick={e => e.stopPropagation()}
    onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
  >
    {/* ── All existing interior content unchanged ── */}
  </div>
</FocusTrap>
```

---

## Step 6 — ImportPage.tsx — leave-warning dialog

**File:** `src/pages/log/ImportPage.tsx`

Read the file first.

### 6a — Add import

Add `FocusTrap` to the existing import block. Do not disturb any other import.

```tsx
import FocusTrap from 'focus-trap-react';
```

### 6b — Wrap the leave-warning dialog card with FocusTrap and add onKeyDown

The leave-warning block (`{showLeaveWarning && (...)}`) renders a fragment
containing: (1) an `aria-hidden="true"` backdrop `<div>` and (2) a positioning
`<div>` (`fixed inset-0 z-50 flex items-center justify-center px-6`) that
contains the dialog card `<div>` (with `role="dialog"`).

Wrap the dialog card `<div>` with `<FocusTrap>`. The `FocusTrap` sits inside
the positioning `<div>`. Add `onKeyDown` to the card div. Pressing Escape in
a "leave during import?" dialog means "no, stay" — wire it to `cancelLeave`.

The card's interior content (heading, body text, Stay and Leave buttons)
is **entirely unchanged**.

The first focusable element in the card is the "Stay" button — correct
safe default. Do not set `initialFocus`.

Before (card, no FocusTrap):

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center px-6">
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="leave-warning-title"
    className="w-full max-w-sm rounded-2xl bg-circa-surface border border-circa-border p-6 space-y-4"
  >
    {/* ... interior content ... */}
  </div>
</div>
```

After:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center px-6">
  {/* allowOutsideClick: false — the positioning div has no click handler;
      the import dialog has no "tap outside to dismiss" behaviour. */}
  <FocusTrap
    focusTrapOptions={{
      escapeDeactivates: false,
      returnFocusOnDeactivate: true,
      allowOutsideClick: false,
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-warning-title"
      className="w-full max-w-sm rounded-2xl bg-circa-surface border border-circa-border p-6 space-y-4"
      onKeyDown={(e) => { if (e.key === 'Escape') cancelLeave(); }}
    >
      {/* ── All existing interior content unchanged ── */}
    </div>
  </FocusTrap>
</div>
```

---

## Step 7 — Build verification

From the project root, run:

```bash
npm run build
```

Confirm the build completes with zero TypeScript errors and zero Vite
warnings. If any TypeScript errors appear related to `inert` or
`focus-trap-react` types, fix them before proceeding.

**Common TypeScript fix if `inert` type errors appear:**
`@types/react@19.x` types `inert` as `'' | undefined` on `HTMLAttributes`.
The expression `inert={!isOpen ? '' : undefined}` is correct. If TS still
complains, add a comment `{/* @ts-expect-error — inert is valid HTML */}`
on the line before the prop. Do not use any other workaround.

**Common TypeScript fix if focus-trap-react import errors appear:**
`focus-trap-react` ships its own types. If the default import causes an error,
try the named import instead: `import { FocusTrap } from 'focus-trap-react'`.

---

## Step 8 — Session report

Write a comprehensive Markdown report covering:

- All 6 file-level steps and their outcomes (index.css, SideDrawer,
  ChangelogModal, DeleteConfirmDialog, ImportPage, plus the npm install)
- Exact version of `focus-trap-react` installed (from `package.json`
  or `npm list focus-trap-react`)
- Any deviations from these instructions, and why
- The complete list of all files created or modified
- Build output (confirm zero errors)
- Anything that could not be completed as specified

Save the report to:

```text
tasks/cc-reports/REPORT_phase1-keyboard-nav_{DD}-{mon}-{YYYY}.md
```

Follow markdownlint rules: blank line before and after every fenced code
block, zero warnings.

Paste a short summary (5–10 lines) into the Claude.ai chat and **wait for
confirmation before running the git commit**.

---

## Step 9 — Git commit (after Claude.ai confirmation only)

```bash
git add -A
git commit -m "a11y: keyboard nav — focus traps, Escape key, inert drawer, focus-visible ring (Task 2 of 6)"
```
