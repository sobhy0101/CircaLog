# CC TASK — Reorganize Brand Asset Folders

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Status:** 🔴 Not started

---

## Goal

Restructure `public/images/brand/` from format-named subfolders into
two purpose-named subfolders — `icons/` and `logo/` — then update all
three files that reference those paths.

---

## Current Structure

```text
public/images/brand/
  ├── apple-touch-icon.png
  ├── favicon-96x96.png
  ├── favicon.ico
  ├── favicon.svg
  ├── web-app-manifest-192x192.png
  ├── web-app-manifest-512x512.png
  ├── PNG/   ← logo raster exports
  ├── SVG/   ← circalog-dark-logo.svg, circalog-light-logo.svg
  └── WebP/  ← logo WebP exports
```

---

## Target Structure

```text
public/
  ├── favicon.ico            ← moved to root (browsers request /favicon.ico directly)
  └── images/brand/
        ├── icons/
        │   ├── favicon.svg
        │   ├── favicon-96x96.png
        │   ├── apple-touch-icon.png
        │   ├── web-app-manifest-192x192.png
        │   └── web-app-manifest-512x512.png
        └── logo/
              └── (all files from SVG/, PNG/, WebP/ — flat, no subfolders)
```

---

## Step 1 — Inspect Current State

List all files under `public/images/brand/` including subfolders:

```bash
find public/images/brand -type f
```

Confirm the file list matches what is described in the Current Structure
above. If anything is different, stop and report before continuing.

---

## Step 2 — Create Target Folders

```bash
mkdir -p public/images/brand/icons
mkdir -p public/images/brand/logo
```

---

## Step 3 — Move Icon Files

Move all icon files into `icons/` and move `favicon.ico` to `public/` root:

```bash
mv public/images/brand/favicon.svg          public/images/brand/icons/favicon.svg
mv public/images/brand/favicon-96x96.png    public/images/brand/icons/favicon-96x96.png
mv public/images/brand/apple-touch-icon.png public/images/brand/icons/apple-touch-icon.png
mv public/images/brand/web-app-manifest-192x192.png public/images/brand/icons/web-app-manifest-192x192.png
mv public/images/brand/web-app-manifest-512x512.png public/images/brand/icons/web-app-manifest-512x512.png
mv public/images/brand/favicon.ico          public/favicon.ico
```

---

## Step 4 — Move Logo Files

Move all files from the format subfolders into `logo/` (flat — no subfolders):

```bash
mv public/images/brand/SVG/*  public/images/brand/logo/
mv public/images/brand/PNG/*  public/images/brand/logo/
mv public/images/brand/WebP/* public/images/brand/logo/
```

---

## Step 5 — Delete Empty Subfolders

```bash
rmdir public/images/brand/SVG
rmdir public/images/brand/PNG
rmdir public/images/brand/WebP
```

If any of these fail because the folder is not empty, stop and report
what files remain before deleting anything.

---

## Step 6 — Verify Final Structure

```bash
find public/images/brand -type f
ls public/favicon.ico
```

Confirm:

- ✅ `public/favicon.ico` exists at root
- ✅ `public/images/brand/icons/` contains exactly 5 files
- ✅ `public/images/brand/logo/` contains all logo files (flat)
- ✅ `SVG/`, `PNG/`, `WebP/` subfolders are gone

---

## Step 7 — Update `index.html`

Update the four favicon link hrefs. Old paths → new paths:

| Old | New |
|---|---|
| `/images/brand/favicon.svg?v=20260528` | `/images/brand/icons/favicon.svg?v=20260528` |
| `/images/brand/favicon-96x96.png?v=20260528` | `/images/brand/icons/favicon-96x96.png?v=20260528` |
| `/images/brand/favicon.ico?v=20260528` | `/favicon.ico?v=20260528` |
| `/images/brand/apple-touch-icon.png?v=20260528` | `/images/brand/icons/apple-touch-icon.png?v=20260528` |

Do a targeted edit — do not rewrite the file.

---

## Step 8 — Update `vite.config.ts`

Update the three icon `src` values in the manifest icons array:

| Old | New |
|---|---|
| `/images/brand/favicon.svg` | `/images/brand/icons/favicon.svg` |
| `/images/brand/web-app-manifest-192x192.png` | `/images/brand/icons/web-app-manifest-192x192.png` |
| `/images/brand/web-app-manifest-512x512.png` | `/images/brand/icons/web-app-manifest-512x512.png` |

Do a targeted edit — do not rewrite the file.

---

## Step 9 — Update `src/pages/ComingSoon.tsx`

Update the logo `src` attribute:

| Old | New |
|---|---|
| `images/brand/SVG/circalog-dark-logo.svg` | `/images/brand/logo/circalog-dark-logo.svg` |

Note the corrected leading slash — the old path was missing it.

Do a targeted edit — do not rewrite the file.

---

## Step 10 — Commit

```bash
git add .
git commit -m "refactor: reorganize brand assets into icons/ and logo/ subfolders"
```
