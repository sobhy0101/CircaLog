# CircaLog — Color Token System

All app-level UI must use `circa-*` tokens. Never use raw Tailwind palette
classes (`violet-*`, `neutral-*`, `gray-*`, `white`, `black`, etc.) for
anything beyond temporary dev scaffolding.

---

## Full token reference

| Utility class | CSS variable | Dark value | Light value | Use for |
|---|---|---|---|---|
| `bg-circa-bg` | `--circa-bg` | `#0F0F1E` | `#F8F8FF` | App background |
| `bg-circa-surface` | `--circa-surface` | `#17172A` | `#FFFFFF` | Cards, panels |
| `bg-circa-surface-raised` | `--circa-surface-raised` | `#1E1E35` | `#EEECFF` | Elevated cards, dropdowns |
| `border-circa-border` | `--circa-border` | `#2D2D4A` | `#D0D0E8` | Dividers |
| `border-circa-border-strong` | `--circa-border-strong` | `#4A4A70` | `#9090B8` | Focused inputs, active borders |
| `bg-circa-accent` | `--circa-accent` | `#7C3AED` | `#7C3AED` | Primary CTA, active states |
| `bg-circa-accent-subtle` | `--circa-accent-subtle` | `#2D1B6E` | `#EDE9FE` | Badge/chip backgrounds |
| `text-circa-accent-light` | `--circa-accent-light` | `#A78BFA` | `#5B21B6` | Accent text |
| `text-circa-text-primary` | `--circa-text-primary` | `#F0F0FA` | `#1A1A2E` | Headings, body copy |
| `text-circa-text-secondary` | `--circa-text-secondary` | `#A0A0C0` | `#4A4A6A` | Labels, captions |
| `text-circa-text-muted` | `--circa-text-muted` | `#5A5A7A` | `#8A8AAA` | Placeholder, disabled |

Note: `circa-accent` (`#7C3AED`) is identical in both modes — it is vivid
enough to work on dark and light surfaces without adjustment.

---

## JSX usage examples

```tsx
{/* Page wrapper */}
<div className="min-h-screen bg-circa-bg">

  {/* Card */}
  <div className="bg-circa-surface border border-circa-border rounded-lg p-4">

    {/* Heading */}
    <h2 className="text-circa-text-primary font-semibold">Sleep Session</h2>

    {/* Supporting text */}
    <p className="text-circa-text-secondary text-sm">Cycle 42 — 28 May 2026</p>

    {/* Muted detail */}
    <span className="text-circa-text-muted text-xs">Auto-detected: Main sleep</span>

    {/* Accent badge */}
    <span className="bg-circa-accent-subtle text-circa-accent-light text-xs px-2 py-0.5 rounded-full">
      Non-24
    </span>

    {/* Primary CTA */}
    <button className="bg-circa-accent text-circa-text-primary px-4 py-2 rounded-md">
      Log Wake Time
    </button>

  </div>
</div>
```

---

## Adding a new token

Only add tokens when a semantic gap genuinely cannot be filled by an existing one.
Discuss with Claude.ai before adding — do not invent tokens during a CC task.

If approved, add in this exact order in `src/index.css`:

1. `--circa-{name}: {light-value};` inside `:root { }`
2. `--circa-{name}: {dark-value};` inside `.dark { }`
3. `--color-circa-{name}: var(--circa-{name});` inside `@theme inline { }`

Document the new token in the session report with its semantic intent and
both hex values.

---

## The `dark:` variant

`dark:` still works for one-off overrides that are not worth a full token:

```tsx
<div className="shadow-lg dark:shadow-none">
```

Use sparingly. If the same pattern appears in more than one component,
it probably warrants a token.
