# CC TASK — Phase 1: Coming Soon Page

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Status:** 🔴 Not started

---

## Goal

Upgrade the existing coming soon page (`src/pages/ComingSoon.tsx`) with:

1. Email capture form that saves addresses to a new Supabase table
2. GitHub repository text link in the footer
3. "Built by sobhy0101" text link to the GitHub profile in the footer
4. Theme toggle (dark/light) in the top-right corner

The logo, "Coming Soon" headline, and tagline are already in place and must
not be changed. The tagline `"Something's taking shape, hopefully in the dark."`
must be preserved exactly — every word, every punctuation mark.

---

## Context

### What already exists

- `src/pages/ComingSoon.tsx` — has the logo, "Coming Soon" headline, and
  tagline. Read it before touching it.
- `src/hooks/useTheme.ts` — the theme hook. Exports `useTheme` and `THEME_KEY`.
- `src/components/ui/ThemeToggle.tsx` — the theme toggle button component.
  Already used in `src/pages/AppShell.tsx`. Import from `@/components/ui/ThemeToggle`.
- `src/lib/supabase/` — directory exists but is empty (only `.gitkeep`).
  The Supabase client does not exist yet and must be created in this task.
- `.env.example` — has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  The real values live in `.env.local` (not in version control).

### Supabase table

A new table named `waitlist` must be created in Supabase with the following
columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `email` | `text` | Not null, unique |
| `created_at` | `timestamptz` | Default `now()` |

Row-level security must be enabled. One policy is needed:

- **Insert:** allow anonymous insert (so unauthenticated visitors can submit
  their email). Policy name: `"Allow anonymous insert"`.
  Using `anon` role, `WITH CHECK (true)`.

No select/update/delete policies are needed. Emails are write-only from
the client — reads will be done directly from the Supabase dashboard or
a future admin tool.

### Supabase client

Create `src/lib/supabase/client.ts`. It must:

- Import `createClient` from `@supabase/supabase-js`
- Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`
- Export a single `supabase` client instance

### Email capture component

Create `src/components/ui/EmailCapture.tsx`. It must:

- Render a single email input and a submit button
- Validate that the input is a non-empty, correctly formatted email address
  before submitting (basic format check: contains `@` and a `.` after it)
- On submit, call `supabase.from('waitlist').insert({ email })` using the
  client from `src/lib/supabase/client.ts`
- Handle three states visibly in the UI:
  - **Idle:** input + "Notify me" button
  - **Loading:** button disabled, label changes to "Sending..."
  - **Success:** hide the form entirely, show a short confirmation message
    (`"You're on the list."`)
  - **Error (duplicate):** if Supabase returns a unique-constraint violation
    (Postgres error code `23505`), show `"This email is already registered."`
  - **Error (other):** show `"Something went wrong. Please try again."`
- Use `circa-*` color tokens for all styling. No hardcoded hex values.
- Success and error messages must use `text-circa-text-secondary` unless
  overridden by a more specific rule below.
- The error messages must use `text-red-400` in dark mode and `text-red-600`
  in light mode. Use Tailwind's `dark:` variant prefix for this since the
  `.dark` class is on `<html>`.

### ComingSoon.tsx changes

Add the following to the existing page, without changing anything that is
already there:

1. **Theme toggle** — position it absolutely in the top-right corner of the
   page. Use `absolute top-4 right-4` (or `fixed` if the layout warrants it
   after reading the file). Import `ThemeToggle` from
   `@/components/ui/ThemeToggle`.

2. **Email capture** — place `<EmailCapture />` below the tagline paragraph,
   with `mt-10` spacing. Import from `@/components/ui/EmailCapture`.

3. **Footer links** — replace the existing plain `<p>circalog.app</p>` footer
   with the following two items on one line, centered, separated by a
   middot (`·`):

   - Text link to `https://github.com/sobhy0101/CircaLog` with label
     `GitHub`
   - Text link to `https://github.com/sobhy0101` with label `sobhy0101`
     preceded by `Built by`

   The full footer should read:
   `GitHub · Built by sobhy0101`

   Both links must:
   - Open in a new tab (`target="_blank" rel="noopener noreferrer"`)
   - Use `text-circa-text-muted` at rest
   - Use `text-circa-text-secondary` on hover (Tailwind `hover:` prefix)
   - Have no underline at rest, underline on hover

---

## Steps

### Step 1 — Read all files before touching anything

Read these files in full before writing a single line of code:

- `src/pages/ComingSoon.tsx`
- `src/hooks/useTheme.ts`
- `src/components/ui/ThemeToggle.tsx` (verify the import path is correct)
- `src/pages/AppShell.tsx` (see how ThemeToggle is already used)
- `.env.example` (confirm the exact env var names)
- `src/lib/supabase/` directory listing (confirm it only has `.gitkeep`)

### Step 2 — Install Supabase client library

Run in the project root:

```bash
npm install @supabase/supabase-js
```

Note the exact version installed. It goes in the session report.

### Step 3 — Create Supabase `waitlist` table

In the Supabase dashboard for the CircaLog project:

1. Open the SQL editor
2. Run the following SQL:

    ```sql
    create table if not exists public.waitlist (
      id         uuid        primary key default gen_random_uuid(),
      email      text        not null unique,
      created_at timestamptz not null default now()
    );

    alter table public.waitlist enable row level security;

    create policy "Allow anonymous insert"
      on public.waitlist
      for insert
      to anon
      with check (true);
    ```

3. Verify the table appears in the Table Editor with the correct columns
4. Verify RLS is enabled and the policy is listed under the `waitlist` table

### Step 4 — Create the Supabase client

Create `src/lib/supabase/client.ts`:

```ts
// client.ts — Supabase client singleton for CircaLog.
//
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local.
// They are never committed to version control.
// The anon key is safe to expose in the browser — RLS policies on every
// table control what anonymous clients can actually do.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnon)
```

### Step 5 — Create the EmailCapture component

Create `src/components/ui/EmailCapture.tsx` per the spec in the Context
section above. Use `useState` from React for the three UI states (idle,
loading, success, error). Do not use a `<form>` element — use a `<div>`
with an `onClick` handler on the button instead.

After writing the file, re-read it and confirm:

- No hardcoded hex color values
- No `import React from 'react'` at the top (the project uses
  `"jsx": "react-jsx"` — the automatic transform handles it; adding the
  import will produce a TS6133 unused-variable error)
- Named React hook imports only: `import { useState } from 'react'`
- The duplicate-email error check uses Postgres code `'23505'`

### Step 6 — Update ComingSoon.tsx

Read `src/pages/ComingSoon.tsx` again immediately before editing it (Step 1
was for orientation; this read is the one you patch from).

Apply the three changes listed in the Context section:

1. Theme toggle (top-right, absolute/fixed)
2. EmailCapture below the tagline
3. Footer replacement

After writing, re-read the file and confirm:

- The tagline `"Something's taking shape, hopefully in the dark."` is
  unchanged, word for word and character for character
- No `import React from 'react'` line added
- All three new additions are present

### Step 7 — Run a production build

```bash
npm run build
```

The build must complete with zero errors and zero TypeScript errors.
Copy the full terminal output (last 30 lines minimum) into the session report.

If the build fails, fix the error before proceeding. Do not skip to Step 8.

### Step 8 — Start the dev server and verify visually

Read `.claude/skills/run/SKILL.md` before starting the server.
Read `.claude/skills/visual-check/SKILL.md` for screenshot conventions.

Start the dev server and open `http://localhost:5173/` in the browser.

Verify all of the following and capture a screenshot for each theme:

**Dark mode checks:**

- [ ] Logo is visible
- [ ] "Coming Soon" headline is visible
- [ ] Tagline is visible and unchanged
- [ ] Theme toggle button is in the top-right corner and functional
- [ ] Email input and "Notify me" button are present
- [ ] Submitting an empty or malformed email shows no network call (validation
      blocks it)
- [ ] Submitting a valid email shows the "Sending..." loading state, then
      either success or error
- [ ] Footer shows `GitHub · Built by sobhy0101`, both as links
- [ ] Both footer links open in a new tab

**Light mode checks (toggle to light, re-verify):**

- [ ] All elements above remain correct in light mode
- [ ] No color token appears broken (no invisible text, no missing backgrounds)

Save screenshots to `tasks/screenshots/` following the
`.claude/skills/visual-check/SKILL.md` naming convention.

### Step 9 — Update the TO-DO list

File: `docs/CircaLog-TO-DO-list.md`

Mark the following items as complete (change `[ ]` to `[x]`):

```markdown
- [x] 🟢 Design and build coming soon page
- [x] 🟢 App name + tagline
- [x] 🟢 "Get notified at launch" email capture (optional, simple)
```

The sub-task `- [ ] 🟢 Brief description of what CircaLog is and who it's for`
is intentionally left unchecked — no description was included in this build.

The sub-task `- [ ] 🟢 Link to /log for early access` has been removed from
scope. Do not check it and do not delete it — leave it as-is.

### Step 10 — Write session report

Write a comprehensive Markdown session report and save it to
`tasks/cc-reports/` using the naming convention in
`.claude/memory/feedback_report_conventions.md`:

```text
REPORT_phase1-coming-soon_{DD}-{mon}-{YYYY}.md
```

The report must include:

- Every step and its outcome (succeeded / failed / adapted)
- Exact version of `@supabase/supabase-js` installed
- Full build output (last 30 lines minimum)
- Supabase table creation confirmation (columns, RLS, policy)
- Visual verification results for both themes with screenshot paths
- Any deviations from these task instructions and the reason why
- Full list of files created or modified

Zero markdownlint warnings. Every fenced code block must have a blank line
before the opening fence and a blank line after the closing fence.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

### Step 11 — Commit

After receiving confirmation from Claude.ai:

```bash
git add .
git commit -m "feat: coming soon page — email capture, footer links, theme toggle"
git push
```
