# CC TASK — Phase 0: PWA Manifest & Service Worker

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Status:** 🔴 Not started

---

## Goal

Configure CircaLog as a fully installable Progressive Web App (PWA) by:

1. Installing and configuring `vite-plugin-pwa`
2. Writing the Web App Manifest (app name, colors, icons, start URL)
3. Setting up a Workbox service worker with silent auto-update
4. Adding a `useRegisterSW` hook skeleton so the V1 changelog modal has
   something to hook into when it's built
5. Updating `index.html` with the required PWA meta tags

This task covers **Phase 0 only** — basic installability and update
infrastructure. The full icon set, offline fallback page, splash screen,
and in-app changelog modal UI are **V1 items** and are not part of this task.

---

## Current State (Read Before Touching Anything)

| File | State |
|---|---|
| `vite.config.ts` | Has TailwindCSS + React plugins. No PWA plugin. |
| `public/` | Contains only `favicon.svg`. No icons, no manifest. |
| `index.html` | Basic HTML shell. No PWA meta tags. |
| `package.json` | `vite-plugin-pwa` is **not installed**. |
| `src/hooks/` | Folder exists and is empty (`.gitkeep` only). |

---

## ⚠️ Notes Before Running Anything

- **Read every file before editing it.** The current contents of
  `vite.config.ts` and `index.html` are above — do not blindly overwrite.
  Patch only what needs to change.
- **Vite version is `^8.0.12`** — verify `vite-plugin-pwa` supports it
  before installing. Check the plugin's releases/changelog if needed.
- **Windows / PowerShell** — all commands are for PowerShell on Windows 11.
- **Inline comments are required** on every non-obvious line. Mahmoud is
  learning React and needs to understand what each part does.
- **Stop on failure.** Report the exact error before proceeding.

---

## TO-DO Items This Task Covers

Mark each one `[x]` in `docs/CircaLog-TO-DO-list.md` when complete:

```md
- [ ] 🟢 Configure PWA manifest (manifest.json)
- [ ] 🟢 Configure Vite PWA plugin (service worker)
```

---

## Step 1 — Install vite-plugin-pwa

```bash
cd C:\Projects\CircaLog
npm install --save-dev vite-plugin-pwa
```

After installing, confirm the version added to `package.json` is compatible
with Vite 8. If the install logged any peer dependency warnings about Vite
version mismatches, stop and report them before continuing.

---

## Step 2 — Update vite.config.ts

Read the current `vite.config.ts` first, then patch it to add the PWA plugin.
The final file should look like this:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Processes all Tailwind utility classes
    react(),       // Enables React JSX transformation and fast refresh

    VitePWA({
      // 'autoUpdate' means the service worker updates silently in the background.
      // The new version becomes active after the user closes and reopens the app.
      // We pair this with a hook (see Step 4) that can show a changelog prompt.
      registerType: 'autoUpdate',

      // Generate the service worker and its assets during 'vite build'.
      // During 'vite dev', the service worker is inactive so it doesn't
      // interfere with hot module replacement (HMR).
      devOptions: {
        enabled: false,
      },

      // The Web App Manifest — tells the browser how to present the app
      // when installed on a device (name, icons, colors, start screen, etc.)
      manifest: {
        name: 'CircaLog',
        short_name: 'CircaLog',
        description:
          'Sleep tracking for Non-24-Hour Sleep-Wake Disorder and other circadian rhythm conditions.',

        // start_url is the page that opens when the user launches the installed app.
        // '/log' is the permanent home of the CircaLog PWA.
        start_url: '/log',

        // 'standalone' makes the app look like a native app — no browser chrome
        // (no address bar, no navigation buttons from the browser).
        display: 'standalone',

        // Orientation: allow both portrait and landscape.
        orientation: 'any',

        // theme_color sets the color of the browser/system chrome around the app
        // (e.g. the status bar on Android). Matches our dark charcoal palette.
        theme_color: '#171717',

        // background_color is shown on the splash screen while the app loads.
        background_color: '#171717',

        // Icons — placeholder set for Phase 0.
        // The full production icon set (all sizes, maskable variants) is a V1 task.
        // These reference the SVG favicon that already exists in /public/.
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },

      // Workbox controls the service worker caching strategy.
      workbox: {
        // Cache all built assets (JS, CSS, images) with a cache-first strategy.
        // 'globPatterns' tells Workbox which files in the dist/ folder to precache.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // When a new service worker is waiting to activate, skip the waiting phase
        // and activate immediately. Combined with 'autoUpdate', this means the
        // app will use the new version as soon as all tabs are closed and reopened.
        skipWaiting: true,

        // After the new service worker activates, take control of all open tabs
        // immediately without requiring a page reload.
        clientsClaim: true,
      },
    }),
  ],

  resolve: {
    alias: {
      // Allows clean imports like: import Foo from '@/components/Foo'
      // instead of messy relative paths like: '../../components/Foo'
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Step 3 — Update index.html

Read the current `index.html` first. Then add the PWA meta tags inside
`<head>`. The final file should look like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <!-- Standard favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- Tells mobile browsers to use the device's full width and prevent
         auto-zoom. Critical for any mobile-first PWA. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Page title shown in browser tab and in the OS app switcher -->
    <title>CircaLog</title>

    <!-- PWA: color of the browser/OS chrome surrounding the app on Android -->
    <meta name="theme-color" content="#171717" />

    <!-- PWA: tells iOS Safari to allow "Add to Home Screen" as a full-screen app -->
    <meta name="apple-mobile-web-app-capable" content="yes" />

    <!-- PWA: sets the iOS status bar style when running as a home screen app -->
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <!-- PWA: the name shown below the app icon on iOS home screens -->
    <meta name="apple-mobile-web-app-title" content="CircaLog" />

    <!-- vite-plugin-pwa injects the manifest link automatically during build.
         The line below is a fallback for environments that don't use the plugin. -->
    <link rel="manifest" href="/manifest.webmanifest" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Step 4 — Create the useRegisterSW Hook

This hook is the bridge between the service worker's update lifecycle and
the app's UI. Phase 0 sets up the infrastructure only. The actual changelog
modal that calls this hook is a V1 task.

Create `src/hooks/useAppUpdate.ts`:

```ts
// useAppUpdate.ts
//
// This hook detects when a new version of CircaLog has been downloaded
// in the background by the service worker.
//
// In V1, the changelog modal will import { needsUpdate, updateApp } from
// this hook to show a "New version available" prompt.
//
// 'virtual:pwa-register/react' is a module injected by vite-plugin-pwa
// at build time — it does not exist as a real file in node_modules.
// It exposes useRegisterSW(), which wraps the browser's service worker
// registration API with React state.
import { useRegisterSW } from 'virtual:pwa-register/react'

export function useAppUpdate() {
  const {
    // needsRefresh: true when a new service worker has been downloaded and
    // is waiting to activate. This is when we'd show the changelog modal.
    needsRefresh: [needsUpdate],

    // updateServiceWorker: call this to tell the waiting service worker to
    // activate now. Pass 'true' to also reload the page after activation.
    updateServiceWorker,
  } = useRegisterSW({
    // onRegistered fires once when the service worker registers successfully.
    // Useful for debugging — remove or silence in production later.
    onRegistered(registration) {
      console.log('[CircaLog] Service worker registered:', registration)
    },

    // onRegisterError fires if registration fails (e.g. in an unsupported browser).
    onRegisterError(error) {
      console.error('[CircaLog] Service worker registration failed:', error)
    },
  })

  // updateApp triggers the new service worker to activate and reloads the page.
  // The V1 changelog modal will call this after the user dismisses the prompt.
  const updateApp = () => updateServiceWorker(true)

  return { needsUpdate, updateApp }
}
```

---

## Step 5 — Add TypeScript Declaration for the Virtual Module

`virtual:pwa-register/react` is a virtual module generated by the plugin at
build time. TypeScript doesn't know it exists unless we declare it.

Check whether `src/vite-env.d.ts` already exists. If it does, add the
reference to it. If it doesn't exist, create it at `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
```

The second line tells TypeScript about the `virtual:pwa-register/react`
module so it stops showing "cannot find module" errors.

---

## Step 6 — Verify the Build

Run a production build (the service worker is only generated during build,
not during `vite dev`):

```bash
npm run build
```

Confirm all of the following:

- ✅ Build completes with no errors
- ✅ `dist/` contains a `sw.js` file (the service worker)
- ✅ `dist/` contains a `manifest.webmanifest` file
- ✅ No TypeScript errors about `virtual:pwa-register/react`

Then run the preview server to test the built output locally:

```bash
npm run preview
```

Open the URL it prints (usually `http://localhost:4173`). Open Chrome DevTools
→ Application tab → Service Workers. Confirm the service worker shows as
"Activated and running".

Also check Application → Manifest — you should see the CircaLog manifest
loaded with the correct name, colors, and start URL (`/log`).

Stop the preview server (`Ctrl+C`) when done.

---

## Step 7 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md` and mark both items complete:

```md
- [x] 🟢 Configure PWA manifest (manifest.json)
- [x] 🟢 Configure Vite PWA plugin (service worker)
```

---

## Step 8 — Write Session Report

Before committing, write a comprehensive Markdown report covering everything
done in this session: all steps, methods, decisions, adaptations, problems
encountered, and how they were fixed. The report is a permanent reference for
both Claude.ai and Mahmoud.

**Naming convention** (from `feedback_report_conventions.md`):

```txt
REPORT_phase0-pwa_{DD}-{mon}-{YYYY}.md
```

Example: `REPORT_phase0-pwa_26-may-2026.md`

**Save to:** `tasks/cc-reports/`

**Markdownlint rules** (strictly enforced — zero warnings allowed):

- Every fenced code block must have a blank line before the opening fence
  and a blank line after the closing fence, without exception
- This applies even when a label line (e.g. `vite.config.ts:`) immediately
  precedes the block — insert a blank line between the label and the fence

**The report must include:**

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- The exact `vite-plugin-pwa` version installed
- Any peer dependency warnings from `npm install` and how they were resolved
- Full output of `npm run build` (clean or errors)
- Confirmation that `sw.js` and `manifest.webmanifest` appeared in `dist/`
- DevTools Service Workers panel result
- Any deviations from the task instructions and the reason for each
- Final file list of everything created or modified

Once the report file is written and saved, paste a short summary into this
chat and wait for confirmation from Claude.ai before running the commit.

---

## Step 9 — Commit

```bash
git add .
git commit -m "chore: Phase 0 PWA — manifest, service worker, useAppUpdate hook"
```

---

## Notes for CC

- **Do not build the changelog modal UI** — that is a V1 item. This task
  only sets up the infrastructure (`useAppUpdate` hook) that the modal will
  later consume.
- **Do not create the full icon set** — the production icon set (192×192 PNG,
  512×512 PNG, maskable variants, Apple touch icon) is a V1 task. The SVG
  favicon placeholder is sufficient for Phase 0.
- **Do not enable `devOptions.enabled: true`** — this causes the service
  worker to run during `vite dev`, which breaks hot module replacement.
  Always leave it `false`.
- **Inline comments are required** on every non-obvious configuration key.
- **Stop on failure.** Report the exact error message before proceeding.
