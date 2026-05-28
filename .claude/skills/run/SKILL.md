# CircaLog — Dev Server & Browser Automation

## Start the dev server

Run in the background so it stays alive throughout the session:

```bash
npm run dev &
```

Server URL: `http://localhost:5173`

Wait 2–3 seconds before opening a browser or running Playwright.

## Check if already running

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

Returns `200` if live. Skip starting if already alive — do not start a second instance.

## Stop the server

```bash
kill $(lsof -t -i:5173)
```

## Playwright

Already installed as a dev dependency (`npm install --save-dev playwright` was run on
28 May 2026). No extra install step needed between sessions.

First time after a fresh `npm install`, install the browser binary once:

```bash
npx playwright install chromium
```

Standard page setup pattern:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:5173');
// ... run checks
await browser.close();
```

For what to check once the page is open, see `.claude/skills/visual-check/SKILL.md`.

## Screenshots

Save to `tasks/screenshots/`. Create the directory if it does not exist.
Screenshots are for session verification only — never commit them.
