# CC TASK — Phase 0: Project Setup

**Project:** CircaLog  
**Root:** `C:\Projects\CircaLog\`  
**Assigned to:** Claude Code  
**Status:** 🔴 Not started

> ⚠️ Run `CC_TASK_Move_Docs.md` before this task.
> That task moves the project docs to `docs/` and must be committed first.

---

## Goal

Scaffold and fully configure the CircaLog development environment in one
session. This covers five blocked TO-DO items that must be done in sequence
before any app code can be written.

---

## ⚠️ Read This Before Running Anything

The project directory **already has a live Git repo** with committed files.
Do not delete, overwrite, or move these:

```t
.gitattributes
.gitignore                         ← Keep ours — it is more complete than Vite's generated one
.markdownlint.json
.claude/
.vscode/ltex.dictionary.en-US.txt
.vscode/ltex.hiddenFalsePositives.en-US.txt
docs/CircaLog-TO-DO-list.md
docs/CircaLog_DevPlan_QA.md
docs/CircaLog_ProjectInstructions.md
docs/CircaLog-App-Description.md
LICENSE
README.md                          ← Keep ours — discard Vite's generated one
tasks/
```

For full project context (stack decisions, V1 scope, folder conventions),
read `docs/CircaLog_DevPlan_QA.md` if you need it.

---

## TO-DO Items This Task Covers

Mark each one `[x]` in `docs/CircaLog-TO-DO-list.md` as you complete it:

- [ ] 🔴 Initialize React + Vite project
- [ ] 🔴 Install and configure TailwindCSS
- [ ] 🔴 Install Recharts
- [ ] 🔴 Configure ESLint + Prettier
- [ ] 🔴 Set up project folder structure

---

## Step 1 — Scaffold the Vite + React + TypeScript Project

Run from the project root:

```bash
cd C:\Projects\CircaLog
npm create vite@latest . -- --template react-ts
```

The `.` means "scaffold into the current directory" (not a subdirectory).

**When prompted about existing files**, choose:
> **"Ignore files and continue"**

This keeps our existing files in place and only adds the Vite scaffold on top.

After scaffolding, **delete these Vite-generated files** — we don't need them:

```powershell
# PowerShell
Remove-Item src\App.css           # Tailwind handles all styling — no separate CSS files
Remove-Item public\vite.svg       # Vite default logo — not used
Remove-Item src\assets\react.svg  # React logo — not used
```

Also **delete the Vite-generated `README.md` and `.gitignore`** if Vite
created new versions of them (it will only do this if "Ignore files" didn't
protect them). Our originals are correct and should be kept.

**Verify the scaffold worked:**

```bash
npm run dev
```

The browser should open a default Vite + React page. Stop the server with
`Ctrl+C` and continue.

---

## Step 2 — Install and Configure TailwindCSS v4

CircaLog uses **TailwindCSS v4**, which works via a Vite plugin (no PostCSS,
no `tailwind.config.js` required).

**Install:**

```bash
npm install tailwindcss @tailwindcss/vite
```

**Update `vite.config.ts`** — replace its entire contents with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Processes all Tailwind utility classes (e.g. bg-violet-500)
    react(),       // Enables React JSX transformation and fast refresh
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

**Replace the entire contents of `src/index.css`** with:

```css
/* This single line imports all of TailwindCSS's utility classes.
   No other CSS setup needed — Tailwind generates everything from here. */
@import "tailwindcss";
```

Delete any other default CSS that was in the file.

---

## Step 3 — Install Recharts

Recharts is the charting library that will power the actogram and all
other data visualizations in CircaLog.

```bash
npm install recharts
```

Recharts ships with its own TypeScript types — no `@types/recharts` needed.

---

## Step 4 — Configure ESLint + Prettier

Vite's `react-ts` template already installs ESLint 9 with a flat config file
(`eslint.config.js`). We only need to add Prettier and wire them together.

**Install:**

```bash
npm install --save-dev prettier eslint-config-prettier
```

- `prettier` — the code formatter
- `eslint-config-prettier` — turns off any ESLint rules that would conflict
  with what Prettier already handles (so they don't fight each other)

**Read the current `eslint.config.js`** before editing it — Vite may generate
slightly different contents depending on the version. Then update it to match
this structure:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier' // Disables rules Prettier handles

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  prettier, // Must be last — overrides any conflicting rules above
)
```

**Create `.prettierrc` in the project root:**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Create `.prettierignore` in the project root:**

```t
dist/
node_modules/
.env*
```

**Add a `format` script to `package.json`** so we can run Prettier manually.
Read `package.json` first, then add `"format"` to the existing `"scripts"` block:

```json
"format": "prettier --write \"src/**/*.{ts,tsx,css}\""
```

**Create `.vscode/settings.json`** (this file is committed — see `.gitignore`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**Create `.vscode/extensions.json`** (recommends extensions to any developer
who opens this project for the first time):

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Step 5 — Set Up Project Folder Structure

**Install Node type definitions** (needed so TypeScript understands the
`path` module we used in `vite.config.ts`):

```bash
npm install --save-dev @types/node
```

**Update `tsconfig.app.json`** to recognize the `@` import alias in
TypeScript. Read the file first, then add these two lines inside
`compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}
```

**Create the folder structure** under `src/`:

```powershell
# Run from C:\Projects\CircaLog in PowerShell
$folders = @(
  'src/assets',
  'src/components/ui',
  'src/hooks',
  'src/lib/db',
  'src/lib/supabase',
  'src/pages',
  'src/types',
  'src/utils'
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Force -Path $folder
  # .gitkeep is an empty placeholder file — Git ignores empty folders,
  # so this forces Git to track the folder so it appears in the repository.
  New-Item -ItemType File -Force -Path "$folder/.gitkeep"
}
```

**What each folder is for** (for reference — do not fill these yet):

| Folder | Purpose |
|---|---|
| `src/assets/` | Images, icons, fonts |
| `src/components/` | Reusable UI components shared across pages |
| `src/components/ui/` | Primitive building-block components (Button, Input, Card…) |
| `src/hooks/` | Custom React hooks (e.g. `useSleepLog`, `useTheme`) |
| `src/lib/db/` | IndexedDB service — all local data read/write logic |
| `src/lib/supabase/` | Supabase client setup and cloud sync logic (V2) |
| `src/pages/` | Page-level components (Log, Chart, History, Insights, Landing) |
| `src/types/` | TypeScript type and interface definitions |
| `src/utils/` | Pure helper functions (date formatting, calculations, etc.) |

**Replace `src/App.tsx`** with a clean shell (removes all Vite boilerplate):

```tsx
// App.tsx — the root component of CircaLog.
// React Router and the main layout will be added in the next phase.
// For now, this is a placeholder that confirms the stack is working.

function App() {
  return (
    // min-h-screen: makes the div at least as tall as the browser window
    // bg-neutral-950: very dark charcoal background (our default dark mode color)
    // text-white: white text for contrast
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* This paragraph will be replaced with the real app layout */}
      <p className="p-4 text-violet-400">CircaLog — development build ✓</p>
    </div>
  )
}

export default App
```

The violet text on dark background is a quick visual confirmation that
TailwindCSS and the `@` alias are both working correctly.

---

## Step 6 — Final Verification

**Run the dev server:**

```bash
npm run dev
```

Confirm all the following:

- ✅ Dev server starts without errors
- ✅ Browser shows a **dark background** with **violet text** reading
  "CircaLog — development build ✓" (confirms Tailwind is working)
- ✅ No errors in the terminal
- ✅ No red squiggles in `App.tsx` or `vite.config.ts`

Stop the server (`Ctrl+C`), then run the linter:

```bash
npm run lint
```

Should complete with no errors. Warnings about unused variables in Vite's
default files are acceptable and will clear as we build.

---

## Step 7 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md` and mark all five items as complete:

```markdown
- [x] 🔴 Initialize React + Vite project
- [x] 🔴 Install and configure TailwindCSS
- [x] 🔴 Install Recharts
- [x] 🔴 Configure ESLint + Prettier
- [x] 🔴 Set up project folder structure
```

---

## Step 8 — Commit Everything

```bash
git add .
git commit -m "chore: Phase 0 setup — Vite, TailwindCSS, Recharts, ESLint, Prettier, folder structure"
```

---

## Notes for CC

- **Inline comments are required.** Add a short comment above every
  non-obvious line of config or code. Mahmoud is learning React and needs to
  understand what each part does as he reads it.
- **Stop on failure.** If any step produces an error, stop and report the
  exact error message before proceeding to the next step.
- **Do not install React Router yet.** That is a separate task in the V1
  routing phase.
- **Do not set up Supabase yet.** `src/lib/supabase/` is created but left
  empty for now.
- **Do not install the PWA plugin yet.** That is also a separate Phase 0 task.
- **Windows note.** All shell commands above are written for PowerShell on
  Windows 11. If a command fails, try the equivalent `cmd` syntax and note
  the difference.
