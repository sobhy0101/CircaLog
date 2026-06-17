---
name: feedback-vitest-vite-conflict
description: "Vitest 4 + Vite 8 type conflict — do not import UserConfig from vitest/config; use `as any` cast on defineConfig"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1a002c84-8857-4c79-a31c-e3aeca4bc8bb
---

`UserConfig` is NOT exported from `vitest/config` in Vitest 4. Do not write `import type { UserConfig } from 'vitest/config'` and do not use `satisfies UserConfig['test']` on the test block — this causes a Vercel deployment failure even when the local build passes.

The correct fix is an `as any` cast on the `defineConfig({...})` call in `vite.config.ts`:

```typescript
export default defineConfig({
  // plugins, resolve, etc.
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: false,
  },
} as any)
```

**Why:** Vite 8 uses `rolldown` internally; Vitest 4 bundles an older `rollup`-based Vite. Their plugin types conflict at the TypeScript level. The `as any` cast bypasses the conflict without affecting runtime behaviour.

**How to apply:** Any time `vite.config.ts` is touched or a new Vitest config is written, use this pattern. Never add a type annotation to the `test` block.

*Discovered during Phase 0.5 Vitest installation (Jun 2026).*
