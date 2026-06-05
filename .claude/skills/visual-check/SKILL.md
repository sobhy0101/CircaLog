# CircaLog — Visual Verification with Playwright

Use this skill whenever a task requires confirming that the app renders correctly
in a browser. Start the dev server first — see `.claude/skills/run/SKILL.md`.

---

## ⚠️ Scope limit — read this first

Playwright is for **static rendering checks only**: theme tokens, CSS variable
values, and screenshots of the initial page state.

Playwright is **not** for:
- Simulating user interactions (clicks, form fills, filter toggles)
- Seeding or reading IndexedDB data
- Verifying dynamic UI behaviour (state changes, filtered lists, animations)

If a visual check item requires interaction or live data, mark it as
**"manual check"** in the session report and move on. Do NOT attempt to
work around this by writing custom Playwright interaction scripts — that
path burns tokens without reliable results. One failed Playwright
interaction attempt = stop, mark manual, continue.

---

## Standard theme verification scenarios

Every task that touches `index.css`, `index.html`, or any component using
`circa-*` tokens must run all three scenarios below.

### Scenario 1 — Dark default (no stored preference)

```js
await page.evaluate(() => localStorage.clear());
await page.reload();
const htmlClass = await page.evaluate(() => document.documentElement.className);
// htmlClass must include 'dark'
await page.screenshot({ path: 'tasks/screenshots/dark-default.png' });
```

Expected:
- `<html>` has `class="dark"` ✅
- Background is deep charcoal (`#0F0F1E`) ✅

### Scenario 2 — Light mode via localStorage

```js
await page.evaluate(() => localStorage.setItem('circalog-theme', 'light'));
await page.reload();
const htmlClass = await page.evaluate(() => document.documentElement.className);
// htmlClass must NOT include 'dark'
await page.screenshot({ path: 'tasks/screenshots/light-mode.png' });
```

Expected:
- `<html>` has no `dark` class ✅
- Background is near-white (`#F8F8FF`) ✅

### Scenario 3 — Dark restored after removing key

```js
await page.evaluate(() => localStorage.removeItem('circalog-theme'));
await page.reload();
const htmlClass = await page.evaluate(() => document.documentElement.className);
// htmlClass must include 'dark'
await page.screenshot({ path: 'tasks/screenshots/dark-restored.png' });
```

Expected:
- `<html>` has `class="dark"` ✅

---

## Checking CSS variable values

To confirm a token resolves to the correct hex value:

```js
const value = await page.evaluate(() =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--circa-bg')
    .trim()
);
// value should be '#0F0F1E' in dark mode, '#F8F8FF' in light mode
```

Replace `--circa-bg` with any `--circa-*` variable to check it.

---

## Reporting results

In the session report, document each scenario as a table row:

| Scenario | `html` class | CSS var value | Screenshot |
|---|---|---|---|
| Dark default | `dark` ✅ | `#0F0F1E` ✅ | dark-default.png |
| Light mode | `` (none) ✅ | `#F8F8FF` ✅ | light-mode.png |
| Dark restored | `dark` ✅ | `#0F0F1E` ✅ | dark-restored.png |

Screenshots are saved to `tasks/screenshots/` and are never committed.
