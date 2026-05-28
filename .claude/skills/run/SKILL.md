# CircaLog — Dev Server & Browser Automation

> Windows machine. All commands are PowerShell. Do not use bash syntax
> (`&`, `kill`, `curl`, `lsof`) — it will fail.

---

## Start the dev server

`Start-Process` creates a truly detached process that survives after the
command returns. Use `cmd.exe /c` as the wrapper so npm.cmd resolves correctly:

```powershell
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WindowStyle Hidden
Start-Sleep -Seconds 3
```

Server URL: `http://localhost:5173`

The 3-second sleep gives Vite time to finish binding the port before any
Playwright call tries to open the page.

## Check if the server is already running

```powershell
try {
    $status = (Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2).StatusCode
    Write-Host "Server running — HTTP $status"
} catch {
    Write-Host "Server not running"
}
```

If the server is already running, skip the Start-Process step — do not start
a second instance.

## Stop the server

```powershell
$conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

## Playwright

Already installed as a dev dependency (`npm install --save-dev playwright` was
run on 28 May 2026). No extra install step needed between sessions.

First time after a fresh `npm install`, install the browser binary once:

```powershell
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

Save to `tasks/screenshots/`. Create the directory if it does not exist:

```powershell
New-Item -ItemType Directory -Force -Path "tasks/screenshots"
```

Screenshots are for session verification only — `tasks/screenshots/` is in
`.gitignore` and must never be committed.
