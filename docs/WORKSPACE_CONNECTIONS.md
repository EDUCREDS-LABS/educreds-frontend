# Workspace Connection Graph

How the landing page, auth, and the workspace layer actually wire into the
main `App` component. Read this before adding new workspace UI so the
connections stay coherent.

## 1. The single entry point

`src/App.tsx` → `App()` mounts providers → `AuthProvider` → `AppContent()`.

`AppContent` is the ONLY place routing + the workspace gate live. Everything
below is inside it.

## 2. The flow (traceable, start to finish)

```
/  (LandingPage, public marketing)
        │  "Log in" → /login
        ▼
/login  (ModernAuthUnified)
        │  on success: store token + dispatch 'authStateChange'
        │  then navigate("/select-workspace", { replace: true })
        ▼
AppContent sees user (useAuth re-reads on 'authStateChange')
        │  computes workspaces = getWorkspacesForUser(user)
        │
        ├─ 0 workspaces  → not authenticated → normal public/<Routes> (login page)
        ├─ 1 workspace    → auto-active, skip picker → <Routes> renders that ws home
        └─ >1 workspace  → needsWorkspacePicker = true
        │
        ▼
/select-workspace  (WorkspaceSelector)   [multi-ws only]
        │  pick a tile → setActive(id) (persisted in sessionStorage)
        │  navigate to WORKSPACES[id].homePath
        ▼
Inside a workspace  (Layout + WorkspaceSwitcher in header)
        │  header dropdown switches between the user's workspaces
        └─ switching → setActive + navigate(homePath)
```

## 3. Who renders what

| Component | Role | Key file |
|-----------|------|----------|
| `App` | Provider tree + `BrowserRouter` + `AuthProvider` | `src/App.tsx` |
| `AppContent` | Routing + workspace gate (the gate) | `src/App.tsx` |
| `useActiveWorkspace` | Resolver: derives workspaces, holds active, reads `?ws=` dev override | `src/lib/useActiveWorkspace.ts` |
| `getWorkspacesForUser` | Maps `AuthType` → workspace membership | `src/lib/workspaces.ts` |
| `getCapabilitiesForWorkspace` | The Capability Matrix (nav per workspace × tier) | `src/lib/capabilityMatrix.ts` |
| `WorkspaceSelector` | The "Select Workspace" screen | `src/components/WorkspaceSelector.tsx` |
| `WorkspaceSwitcher` | Header dropdown to jump between workspaces | `src/components/WorkspaceSwitcher.tsx` |
| `AppSidebar` | Institution nav, GENERATED from the matrix | `src/components/AppSidebar.tsx` |
| `ModernAuthUnified` | Login form; on success → `/select-workspace` | `src/components/modern/ModernAuthUnified.tsx` |
| `LandingPage` | Public `/` marketing | `src/pages/auth/LandingPage.tsx` |
| `Layout` | Institution workspace shell (header + sidebar) | `src/components/Layout.tsx` |

## 4. Critical wiring facts (do not break)

- **Login does NOT navigate to a hardcoded tier destination.** It goes to
  `/select-workspace`. The resolver decides the home. If you change login
  success to navigate straight to `/institution/dashboard`, you BYPASS the
  workspace picker and the whole "who" layer becomes dead.
- **`useAuth` updates via the `authStateChange` window event**, dispatched by
  `ModernAuthUnified` after storing the token. The gate in `AppContent`
  only fires because `useAuth` re-reads on that event.
- **`WorkspaceSelector.onCancel` → `/`** (landing), not a hard logout.
- **`/select-workspace`** is addressable so a user can re-open the picker
  (and single-workspace users are redirected to their home by the route).
- **Active workspace is persisted in `sessionStorage`** (`educreds_active_workspace`),
  so a refresh keeps the user inside their chosen workspace.
- **Dev override:** `?ws=verifier,government` seeds membership so the
  multi-workspace picker and other workspaces are exercisable without backend
  claims. This is client-only and does not affect production auth.

## 5. Adding a new workspace surface (the rule)

1. Add the workspace to `WORKSPACES` in `src/lib/workspaces.ts`.
2. Add its capability tree to `getCapabilitiesForWorkspace` in
   `src/lib/capabilityMatrix.ts`.
3. Ensure the user can *reach* it: extend `getWorkspacesForUser`
   (real backend claim, or a dev `?ws=` override).
4. Point `WORKSPACES[id].homePath` at an existing route (do not hand-roll
   a new nav in `AppSidebar` — nav is matrix-generated).
5. Verify: `npx tsc --noEmit` + `npm run build` green; smoke-test
   `/select-workspace` with `?ws=...`.

## 6. Known gaps (deferred to Phase B)

- Non-institution workspaces (verifier/government/developer/admin) currently
  render their home routes inside the institution `Layout` or `PublicLayout`.
  Functionally correct (right page loads) but chrome will be matched to each
  workspace in Phase B.
- `getInstitutionTierDestination` is now unused by the login path (replaced
  by `/select-workspace`); left in `deploymentTier.ts` for backward refs.
