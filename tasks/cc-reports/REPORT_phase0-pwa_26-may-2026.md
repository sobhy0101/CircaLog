# REPORT: Phase 0 — PWA Manifest & Service Worker

**Date:** 26 May 2026
**Task file:** `tasks/CC_TASK_Phase0_PWA.md`
**Status:** ✅ Complete

---

## Summary

Configured CircaLog as an installable Progressive Web App by installing
`vite-plugin-pwa`, wiring the Web App Manifest into `vite.config.ts`,
adding PWA meta tags to `index.html`, creating the `useAppUpdate` hook
skeleton, and adding the TypeScript declaration for the virtual module.
The production build generates `sw.js` and `manifest.webmanifest` with
no errors.

---

## Step-by-Step Outcomes

### Step 1 — Install vite-plugin-pwa ✅

```
npm install --save-dev vite-plugin-pwa
```

**Version installed:** `vite-plugin-pwa@1.3.0`

**Peer dependency check:**

```json
"vite": "^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0"
```

Vite 8 is explicitly listed in the peer dep range. No Vite version
mismatch warnings were emitted.

**Deprecation warnings (not blockers):**

- `source-map@0.8.0-beta.0` — transitive dep of a transitive dep;
  not referenced by our code.
- `glob@11.1.0` — similarly transitive; no action required.

272 packages added, 0 vulnerabilities.

---

### Step 2 — Update vite.config.ts ✅

Added the `VitePWA` import and plugin block. Key configuration choices:

- `registerType: 'autoUpdate'` — silent background updates
- `devOptions.enabled: false` — keeps HMR working during `vite dev`
- `start_url: '/log'` — canonical PWA entry point
- `display: 'standalone'` — hides browser chrome when installed
- `theme_color` / `background_color: '#171717'` — dark charcoal palette
- Icons: single SVG placeholder; full icon set deferred to V1
- `workbox.skipWaiting: true` + `clientsClaim: true` — new SW activates
  and takes control immediately after all tabs are closed

---

### Step 3 — Update index.html ✅

Added five PWA-specific tags inside `<head>`:

- `<meta name="theme-color">` — Android status bar color
- `<meta name="apple-mobile-web-app-capable">` — iOS full-screen mode
- `<meta name="apple-mobile-web-app-status-bar-style">` — iOS bar style
- `<meta name="apple-mobile-web-app-title">` — iOS home screen label
- `<link rel="manifest">` — fallback manifest link for non-plugin builds

Existing `<meta charset>`, `<link rel="icon">`, `<meta name="viewport">`,
and `<title>` were left unchanged.

---

### Step 4 — Create src/hooks/useAppUpdate.ts ✅

Created the hook at `src/hooks/useAppUpdate.ts`.

**Adaptation — property name correction:**

The task spec destructured `needsRefresh` from `useRegisterSW`. The
actual property name in `vite-plugin-pwa@1.3.0` is `needRefresh`
(no trailing 's'). TypeScript caught this immediately:

```
error TS2339: Property 'needsRefresh' does not exist on type '...'
```

The destructuring was corrected to `needRefresh: [needsUpdate]` in the
first build cycle (see Step 6 below). All inline comments and the
`needsUpdate` / `updateApp` public API are unchanged from the spec.

---

### Step 5 — Create src/vite-env.d.ts ✅

File did not exist; created fresh:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
```

The second reference resolves the `virtual:pwa-register/react` module
type so TypeScript doesn't raise "cannot find module" errors.

---

### Step 6 — Build Verification

**First build attempt — ❌ TypeScript error:**

```
src/hooks/useAppUpdate.ts(19,5): error TS2339: Property 'needsRefresh'
does not exist on type '{ needRefresh: [...]; ... }'
```

**Fix:** corrected `needsRefresh` → `needRefresh` in the destructuring.

**Second build attempt — ✅ Clean:**

```
vite v8.0.14 building client environment for production...
✓ 18 modules transformed.

dist/registerSW.js              0.13 kB
dist/manifest.webmanifest       0.37 kB
dist/index.html                 1.62 kB │ gzip:  0.75 kB
dist/assets/index-Q4T6pQFi.css  6.42 kB │ gzip:  1.96 kB
dist/assets/index-D-RyKWfG.js 195.38 kB │ gzip: 61.50 kB

✓ built in 737ms

PWA v1.3.0
mode      generateSW
precache  7 entries (208.10 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

**dist/ artifact verification:**

| File | Size | Status |
|---|---|---|
| `dist/sw.js` | 1 222 bytes | ✅ Present |
| `dist/manifest.webmanifest` | 375 bytes | ✅ Present |
| `dist/workbox-9c191d2f.js` | 15 112 bytes | ✅ Present |
| `dist/registerSW.js` | 134 bytes | ✅ Present |

**Preview server:**

```
npm run preview
➜  Local:   http://localhost:4173/
```

Server started cleanly. DevTools → Application → Service Workers and
Manifest verification must be done manually in a browser — the CLI
agent environment cannot open Chrome. All build artifacts are correct;
the DevTools step is a visual confirmation only.

---

### Step 7 — TO-DO List Updated ✅

Both items marked complete in `docs/CircaLog-TO-DO-list.md`:

```md
- [x] 🟢 Configure PWA manifest (manifest.json)
- [x] 🟢 Configure Vite PWA plugin (service worker)
```

---

## Deviations from Task Instructions

| # | Deviation | Reason |
|---|---|---|
| 1 | `needsRefresh` → `needRefresh` in `useAppUpdate.ts` | Actual API property name in `vite-plugin-pwa@1.3.0` differs from spec. TypeScript caught it on first build. |
| 2 | DevTools verification not performed | CLI agent cannot open a browser. All build artifacts are verified by file presence and size. |

---

## Final File List

### Created

- `src/hooks/useAppUpdate.ts`
- `src/vite-env.d.ts`
- `tasks/cc-reports/REPORT_phase0-pwa_26-may-2026.md` (this file)

### Modified

- `vite.config.ts` — added `VitePWA` import and plugin block
- `index.html` — added 5 PWA meta tags and manifest link
- `docs/CircaLog-TO-DO-list.md` — marked 2 items complete
- `package.json` — `vite-plugin-pwa@1.3.0` added to `devDependencies`
  (written by npm automatically)

---

## Notes for V1

- Replace the SVG icon placeholder with a full PNG icon set
  (192×192, 512×512, maskable variants, Apple touch icon).
- Build the changelog modal UI and wire it to `useAppUpdate`.
- Consider silencing or removing the `console.log` in `onRegistered`
  before public launch.
- Run a Lighthouse PWA audit once routing and the `/log` route exist
  (target score: 95+).
