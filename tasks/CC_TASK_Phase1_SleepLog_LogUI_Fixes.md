# CC Task — Phase 1: Sleep Log UI Fixes

**Batch:** Phase 1 — Batch B Fixes  
**Depends on:** Phase 1 Batch B (Sleep Log UI) — already committed (`ce38835`)  
**Estimated scope:** 3 files modified  
**No new packages required**

---

## Before you start

Read these files first:

1. `docs/CircaLog_ProjectInstructions.md` — stack gotchas, token rules
2. `.claude/skills/token-usage/SKILL.md` — circa-* token reference
3. `.claude/skills/run/SKILL.md` — how to start the dev server
4. `.claude/skills/visual-check/SKILL.md` — Playwright verification

---

## Context

Three issues were found during on-device testing of the Batch B UI:

1. **QualityPicker circles are too small on narrow viewports** — currently
   `w-10 h-10` with `min-w-[44px] min-h-[44px]`, which hard-codes a small
   fixed size. They need to grow fluidly with the viewport.

2. **Elapsed timer shows no running indication** — `0h 22m` is static-looking.
   A blinking colon separator is needed to confirm the timer is live.

3. **Timer flow has no editable sleep start field** — when completing a
   session via the Wake Up screen, `sleepStartUtc` is unconditionally set to
   `bedTimeUtc` (the moment "Start Sleep" was tapped). Patients with insomnia
   need to be able to correct this to when they actually fell asleep.

---

## Files to modify

- `src/components/ui/QualityPicker.tsx`
- `src/pages/log/WakeUpScreen.tsx`

No other files need changes.

---

## Fix 1 — QualityPicker: fluid sizing

### Current code (the button in the `.map`)

```tsx
className={[
  'w-10 h-10 rounded-full border-2 flex items-center justify-center',
  'min-w-[44px] min-h-[44px] transition-colors',
  selected
    ? 'bg-circa-accent border-circa-accent'
    : 'bg-circa-surface border-circa-border',
].join(' ')}
```

### Replace with

```tsx
className={[
  'rounded-full border-2 flex items-center justify-center',
  'aspect-square flex-1 min-w-[44px] max-w-[72px] transition-colors',
  selected
    ? 'bg-circa-accent border-circa-accent'
    : 'bg-circa-surface border-circa-border',
].join(' ')}
```

### Also update the container div

Current:

```tsx
<div className="flex items-center justify-center gap-3">
```

Replace with:

```tsx
<div className="flex items-center justify-center gap-3 w-full px-4">
```

### Explanation

- `flex-1` lets each circle claim an equal share of the available row width.
- `aspect-square` keeps the circle perfectly round regardless of the
  computed width.
- `min-w-[44px]` preserves the minimum tap target floor.
- `max-w-[72px]` caps growth so circles do not become absurdly large on
  tablets or wide desktop viewports.
- `w-full px-4` on the container ensures the row fills available width
  while staying clear of the screen edges on all viewport sizes.
- Remove `w-10 h-10` entirely — these fixed dimensions are replaced by
  the flex + aspect-square approach.

---

## Fix 2 — WakeUpScreen: blinking colon + editable sleep start

Both changes are in `src/pages/log/WakeUpScreen.tsx`.

### 2a — Blinking colon in the elapsed display

#### Add a blink state

Add this state variable near the top of the component, alongside the
existing `elapsed` state:

```tsx
const [colonVisible, setColonVisible] = useState(true);
```

#### Update the existing interval effect

The current effect updates `elapsed` every 1000ms. Extend it to also
toggle `colonVisible`:

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setElapsed(formatElapsed(Date.now() - new Date(inProgress.startedAt).getTime()));
    setColonVisible(v => !v);  // blink the colon on every tick
  }, 1000);
  return () => clearInterval(id);
}, [inProgress.startedAt]);
```

#### Update `formatElapsed` to return parts, not a string

The current `formatElapsed` returns a string like `"7h 34m"`. Replace it
with a version that returns the parts separately so the colon can be
rendered independently:

```ts
// Returns hours and minutes as separate numbers for split rendering
function parseElapsed(ms: number): { h: number; m: number } {
  const totalMin = Math.floor(ms / 60000);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}
```

Keep `formatElapsed` as well (or remove it if nothing else uses it after
this change — check for other call sites in this file first).

#### Update the elapsed display JSX

Current:

```tsx
<p className="text-circa-text-primary font-display text-4xl font-semibold tracking-tight">
  {elapsed}
</p>
```

Replace with:

```tsx
<p className="text-circa-text-primary font-display text-4xl font-semibold tracking-tight">
  {(() => {
    const { h, m } = parseElapsed(
      Date.now() - new Date(inProgress.startedAt).getTime()
    );
    return (
      <>
        {h}
        <span
          className="transition-opacity duration-100"
          style={{ opacity: colonVisible ? 1 : 0 }}
        >
          h{' '}
        </span>
        {String(m).padStart(2, '0')}
        <span className="text-2xl text-circa-text-secondary">m</span>
      </>
    );
  })()}
</p>
```

Wait — using `Date.now()` inside render is fine for the initial value but
will not update on its own. Instead, keep deriving the display from the
`elapsed` state that is already updated by the interval. Do it this way:

Store `{ h, m }` in state instead of a formatted string:

```tsx
// Replace the existing elapsed state + formatElapsed with:
const [elapsed, setElapsed] = useState(() =>
  parseElapsed(Date.now() - new Date(inProgress.startedAt).getTime())
);
```

Update the interval to set the parsed object:

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setElapsed(parseElapsed(Date.now() - new Date(inProgress.startedAt).getTime()));
    setColonVisible(v => !v);
  }, 1000);
  return () => clearInterval(id);
}, [inProgress.startedAt]);
```

Update the display JSX:

```tsx
<p className="text-circa-text-primary font-display text-4xl font-semibold tracking-tight tabular-nums">
  {elapsed.h}
  <span
    className="transition-opacity duration-100"
    style={{ opacity: colonVisible ? 1 : 0 }}
  >
    h{' '}
  </span>
  {String(elapsed.m).padStart(2, '0')}
  <span className="text-2xl text-circa-text-secondary">m</span>
</p>
```

`tabular-nums` prevents the number from shifting left/right as digit width
changes each second.

Remove the old `formatElapsed` function if it is no longer used.

---

### 2b — Editable sleep start field

Patients with insomnia often lie awake for a long time after tapping
"Start Sleep." The Wake Up screen needs an editable "Fell Asleep" field
so they can record when they actually fell asleep, separate from when
they got into bed.

#### Add state for the new field

Add these two state variables near the top of the component, grouped with
the existing `wakeDate` / `wakeTime` state:

```tsx
// Sleep start — pre-filled from inProgress.bedTimeUtc, editable
const [sleepDate, setSleepDate] = useState(() => {
  const d = new Date(inProgress.bedTimeUtc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
const [sleepTime, setSleepTime] = useState(() => {
  const d = new Date(inProgress.bedTimeUtc);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
});
```

Add a validation error state:

```tsx
const [sleepError, setSleepError] = useState('');
```

#### Add the field to the JSX

Insert this field **between** the elapsed timer block and the Wake Time
field. It must come before Wake Time in visual order:

```tsx
{/* Fell Asleep — pre-filled from bed time, editable */}
<div>
  <label className="block text-sm font-medium text-circa-text-primary mb-1">
    Fell Asleep
    <span className="text-circa-text-muted font-normal text-xs ml-1">
      (adjust if you lay awake)
    </span>
  </label>
  <div className="flex gap-2">
    <input
      id="sleepDate"
      type="date"
      value={sleepDate}
      onChange={e => setSleepDate(e.target.value)}
      className={`${inputClass} flex-1`}
    />
    <input
      id="sleepTime"
      type="time"
      value={sleepTime}
      onChange={e => setSleepTime(e.target.value)}
      className={`${inputClass} w-32`}
    />
  </div>
  {sleepError && <p className="text-red-400 text-xs mt-1">{sleepError}</p>}
</div>
```

#### Update `handleComplete` to use the new field

Current `createEntry` call sets:

```ts
sleepStartUtc: inProgress.bedTimeUtc,
```

Replace with:

```ts
sleepStartUtc: toUtcIso(sleepDate, sleepTime)!,
```

Also add validation for the new field inside `handleComplete`, before the
existing wake time validation:

```ts
if (!sleepDate || !sleepTime) {
  setSleepError('Sleep start time is required.');
  valid = false;
} else {
  setSleepError('');
}
```

---

## Step 3 — Verification

### 3a — Build check

```bash
npm run build
```

Must complete with zero TypeScript errors and zero ESLint errors.

### 3b — Dev server + Playwright

Start the dev server. Run the standard theme verification scenarios from
`.claude/skills/visual-check/SKILL.md`.

Then run these targeted scenarios:

**Scenario A — QualityPicker at narrow viewport (375px)**

```js
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('http://localhost:5173/log');
await page.click('text=Log manually');
await page.screenshot({ path: 'tasks/screenshots/quality-picker-narrow.png' });
// Confirm: all 5 circles are visible and not clipped
// Confirm: circles fill the available width with padding on both sides
```

**Scenario B — QualityPicker at wide viewport (768px)**

```js
await page.setViewportSize({ width: 768, height: 1024 });
await page.screenshot({ path: 'tasks/screenshots/quality-picker-wide.png' });
// Confirm: circles are larger than at 375px but not exceeding ~72px each
```

**Scenario C — Timer blink (Wake Up screen)**

```js
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('http://localhost:5173/log');
await page.click('text=Start Sleep');
// Wait 2.5 seconds to capture a blink cycle mid-state
await page.waitForTimeout(2500);
await page.screenshot({ path: 'tasks/screenshots/timer-blinking.png' });
// Confirm: elapsed counter is visible
// Note: the blink itself cannot be reliably asserted in a static screenshot —
// just confirm the timer display renders without errors
```

**Scenario D — Fell Asleep field on Wake Up screen**

```js
await page.goto('http://localhost:5173/log');
await page.click('text=Start Sleep');
await page.screenshot({ path: 'tasks/screenshots/wakeup-sleep-start-field.png' });
// Confirm: "Fell Asleep" label and its date+time inputs are visible
// Confirm: "Wake Time" field is also visible below it
// Confirm: the sleep start inputs are pre-filled (not empty)
```

---

## Step 4 — Session report

Write a comprehensive Markdown report and save to `tasks/cc-reports/`:

```
REPORT_phase1-logui-fixes_{DD}-{mon}-{YYYY}.md
```

Follow the policy in `.claude/memory/session_report_policy.md`.

Include:

- Each fix and its outcome
- Confirmation that no new packages were installed
- Build output
- All Playwright scenario results (table format)
- Deviations from these instructions, if any
- Final list of all files modified

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before committing.

---

## Step 5 — Git commit (only after Claude.ai confirms)

```bash
git add -A
git commit -m "fix(phase1): QualityPicker fluid sizing, timer blink, editable sleep start"
git push
```
