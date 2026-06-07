---
name: feedback-react-tsx-patterns
description: "Non-obvious React + TypeScript rules specific to this project's setup"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 62080887-95ed-4786-bf47-48a186764391
---

## No `import React` in `.tsx` files

Do NOT add `import React from 'react'` in any `.tsx` file. The project uses
`"jsx": "react-jsx"` (automatic transform) + `"noUnusedLocals": true`. The
combination will produce `TS6133: 'React' is declared but its value is never read.`

**How to apply:** In `.tsx` files, import only what is used: `import { useState } from 'react'`.
In `.ts` files that call React APIs directly, named imports are fine.

## `JSX.Element` is not available without an import

Using `JSX.Element` as a type annotation in `.tsx` files will fail with
`TS2503: Cannot find namespace 'JSX'` because the automatic JSX transform does
not put `JSX` in the global scope.

**Use `ReactElement` instead:**

```typescript
import { type ReactElement } from 'react';
// then annotate as ReactElement, not JSX.Element
```

**Why:** Caught at build time in this project when typing the icon component map
in `Toast.tsx`. The fix is always `ReactElement` from `'react'`.

**How to apply:** Any time a function returns JSX and needs an explicit return type,
use `ReactElement`. Never use `JSX.Element` bare.
