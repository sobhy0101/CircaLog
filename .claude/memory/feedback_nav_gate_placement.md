---
name: feedback-nav-gate-placement
description: "Auth gates belong on destination pages, not in navigation entries. Drawer items always render unconditionally."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9357b8e1-3650-4cd6-a06f-462a36ad9440
---

Navigation entries in the SideDrawer (and any future nav surface) must always render unconditionally — do not wrap them in `{user && (...)}`.

**Why:** The user corrected this during Phase 1 CSV import. The Import button was gated in the drawer, but the sign-in prompt already lives on the destination page (`ImportPage.tsx` shows `GoogleSignInButton` when `user` is null). Hiding nav items based on auth state is redundant and confusing — users can't discover a feature if the entry point is invisible.

**How to apply:** When adding any new drawer/nav entry, render it unconditionally. Put all auth-gating logic inside the destination page component itself.
