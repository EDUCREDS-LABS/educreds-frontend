# EduCreds Enterprise SaaS — Implementation Plan (v3, workspace-first)

**One platform, six workspaces, one trust engine.**

> One platform = cert_backend (system-of-record) + EVF (trust gateway) + ETA +
> Identity + Connectors + Governance. Six workspaces = each stakeholder gets an
> interface built around their workflow, not the underlying tech. One trust engine
> = every issuance/verification/governance decision is powered by the same
> infrastructure, even though each user experiences it differently.

**Strategic correction (v3):** v2 of this plan assumed a single institution
sidebar with everything present. That is wrong. Enterprise SaaS resolves **who**
is using the platform *before* it decides **what** they can do. The missing
architectural layer is a **Workspace Resolver + Capability Matrix** that
generates each persona's navigation from data instead of hardcoding one nav.
Phase 0 below establishes that foundation; all visual reframing comes after.

---

## 0. Current state (verified, and what it's missing)

**Already built (reuse, do NOT rebuild):**
- `AuthType` enum (`institution` / `student` / `marketplace`) in `client/src/lib/dualAuth.ts`.
- `deploymentTier` (`workspace` / `cloud-connector` / `enterprise-connector`) on the auth user — this is the **Tier** concept, already present.
- `TierGuard` (`client/src/components/TierGuard.tsx`) gating routes by tier.
- `ProtectedRoute` gating by `AuthType`.
- `AppSidebar.tsx` already grouped by business capability (Dashboard / Credentials / Insights / Connections / Network).
- Command palette (`ui/command.tsx`), notifications inbox, enterprise-blue theme.
- 5 workspace modules (Analytics, Batch Ops, Audit Trail, Webhooks, White Label) + governance/Trust (PoIC/ETA) + verification + developer portal.
- Public Layer privacy architecture (Batch #6): backend minimal, EVF presentation policy by mode.

**Missing (the v3 gap):**
1. **No Workspace layer.** Login drops users straight into one institution `Layout`. There is no "Select Workspace" resolution step, no Government / Developer / Verifier / EduCreds-Admin workspaces.
2. **No Capability Matrix.** Nav is hardcoded per-route via `TierGuard`/`ProtectedRoute`. There is no single source of truth mapping (workspace × tier → capabilities) that generates navigation.
3. **Tier only modeled for institutions.** Student / Verifier / Government / Developer / Admin have no tier-aware shell.
4. **Institution tiers not surfaced as distinct products.** Tier 1 (on-prem), Tier 2 (hybrid/external SIS), Tier 3 (EduCreds-managed) should show *different* capability sets, not just permission differences.

---

## 1. Phase 0 — Workspace Architecture (BEFORE any UI refactor)

This is the foundation. Everything else depends on it.

### 0.1 Workspace model (`client/src/lib/workspaces.ts`)
Define the six workspaces as data, not routes:
```ts
type WorkspaceId =
  | 'institution' | 'student' | 'verifier'
  | 'government'   | 'developer' | 'admin';

interface Workspace {
  id: WorkspaceId;
  label: string;            // "Academic Institution", "Student", "Employer / Verifier"…
  icon: LucideIcon;
  /** which deployment tiers apply inside this workspace */
  tiers?: DeploymentTier[]; // institution-only concept
  homePath: string;
}
```
Add `WORKSPACES: Workspace[]` and a `getWorkspacesForUser(user)` that returns
only the workspaces the authenticated user is a member of (an institution admin
may also be a developer; a gov officer is not a student).

### 0.2 Capability Matrix (`client/src/lib/capabilityMatrix.ts`)
The single source of truth. A capability = a business function (Identity,
Credentials, Verification, Trust, Analytics, Integrations, Administration,
Billing, Settings). Each entry declares which (workspace, tier) combos expose it.
```ts
interface Capability {
  id: 'identity' | 'credentials' | 'verification' | 'trust'
    | 'analytics' | 'integrations' | 'administration' | 'billing' | 'settings';
  label: string;
  icon: LucideIcon;
  /** workspace → tiers where this capability is visible */
  availability: Partial<Record<WorkspaceId, DeploymentTier[] | 'all'>>;
  /** route the nav item opens */
  path: string;
  /** optional sub-items (e.g. Credentials → Issue / Issued / Templates) */
  children?: Capability[];
}
```
Concrete availability (drives every nav):
- **Institution** (tiers 1/2/3): identity, credentials, verification, trust, analytics, *integrations (tiers 1 & 2 only)*, administration, billing, settings.
- **Student**: my-identity, my-wallet, my-credentials, share, verification-requests, activity, settings. (Never sees ETA/EVF/Connector.)
- **Verifier**: verify, verification-queue, bulk, evidence, organizations, api, reports, billing, settings. One-Time Verifier = subset (verify + history) — model as a verifier tier.
- **Government**: institutions, trust-monitoring, accreditation, poic, national-registry, investigations, analytics, reports, policies. (Does NOT issue.)
- **Developer**: api-keys, sandbox, sdks, connectors, openapi, usage, logs, webhooks, status. (Nothing about students/credentials.)
- **Admin (EduCreds staff only)**: organizations, institutions, governance, billing, infrastructure, support, monitoring, ai-models, poic-policies, eta-config, feature-flags, audit, incidents.

### 0.3 Workspace Resolver (`client/src/lib/workspaceResolver.ts` + a `WorkspaceGate`)
- After login, read `getWorkspacesForUser(user)`.
- If **1 workspace** → redirect to its `homePath` automatically (Azure behavior).
- If **>1** → render a **Workspace Selection** screen (`Select Workspace` with the six tiles; auto-skip if single). Store `activeWorkspace` in session.
- All subsequent nav is generated by `getNavForWorkspace(workspace, tier)` from the Capability Matrix.

### 0.4 Tier-driven capability collapse (institution only)
Within the Institution workspace, the *same* `AppSidebar` component now renders
different capability sets by tier (replacing the current per-route `TierGuard`
scatter):
- **Tier 1 (On-Premise):** full Integrations (SIS, ERP, Finance, LMS, HR, National Registry, Connector Health, Sync, Logs, Versions). No "cloud storage" / CSV-upload affordances.
- **Tier 2 (Hybrid / External SIS):** "Cloud Connection" (Connected/Healthy/Last Sync) instead of "Connector Service"; external system health + sync.
- **Tier 3 (EduCreds Managed):** Nav collapses to Dashboard / Students / Credentials / Templates / Verification / Analytics / Settings. No Connector, Sync, Database, or Infrastructure entries — EduCreds hosts everything.

### 0.5 Navigation generation
Replace the hardcoded `getNavData(tier)` in `AppSidebar.tsx` with
`getNavForWorkspace(workspace, tier)` reading the matrix. One sidebar component,
six generated nav trees. `TierGuard`/`ProtectedRoute` remain as runtime guards;
the matrix is the *presentation* source of truth.

**Phase 0 verification:** `educreds-frontend` tsc + build green; manually log in
as each persona (seed dev users for student/verifier/gov/developer/admin) and
confirm each sees only its capability set; confirm single-workspace users skip
selection.

---

## 2. Phase A — Reframe labels, theme, shells (after Phase 0)

- **A1.** Six workspace shells, each with its own `Layout` wrapper reusing the
  shared `Sidebar` but different matrix-derived nav + header chrome (workspace
  name, Quick Create scoped to that workspace).
- **A2.** Align color tokens exactly to the vision palette (`index.css`):
  primary `#0057FF`, slate `#1E293B`, success `#16A34A`, warning `#D97706`,
  danger `#DC2626`, bg `#F8FAFC`. Flat, minimal gradients. Inter / IBM Plex Sans.
- **A3.** Strip residual "DAO"/crypto framing from user-visible copy
  (`SystemArchitecture.tsx`, governance labels) — keep PoIC/ETA concepts.
- **A4.** Rename existing nav labels to the canonical taxonomy (Identity,
  Credentials, Verification, Trust, Analytics, Integrations, Developers,
  Administration) — already mostly there; this is a label pass.

---

## 3. Phase B — Net-new enterprise surfaces

- **B1. Quick Create (+) button**, workspace-scoped dropdown (Institution /
  Credential / Template / API Key / Connector / User / Webhook / Policy /
  Verification Request).
- **B2. Resource-detail tab pattern** (Azure style): Institution → Overview /
  Students / Credentials / Trust / Integrations / Activity / Settings on one URL.
- **B3. Identity module pages** (currently thin): Students huge table
  (search, DID, wallet, status, claims, actions); Institution Identity overview
  (DID, accreditation, wallet, connected systems, policies).
- **B4. Permission matrix component** visualizing RBAC roles (Registrar / Dean /
  Admin / Auditor / Gov Officer / Employer / Developer / Support / Owner) over
  the existing guard model.
- **B5. Mobile shell:** notifications, approvals, verification, search, student
  wallet, quick analytics — separate responsive layout, not feature parity.
- **B6. Real global-search results** wiring `command.tsx` to actual targets
  (student / institution / credential / verification / API / settings / docs).

---

## 4. Phase C — Experience polish (OS-for-trust feel)

- **C1.** Confirm/extend UI primitives: status chips, tags, drawers, activity
  timeline, audit-log table, JSON viewer, code block.
- **C2.** Dashboard cards per vision: Institution Health, Trust Score, Credential
  Volume, Verification Requests, Connector Status, Recent Events, System Alerts,
  Pending Actions — all from real `/api/stats` (no fake stats).
- **C3.** Verification Overview cards (Requests Today, API Calls, Avg Time, Trust
  Accuracy, Fraud Detection, Recent Employers) — surface EVF trust/risk.
- **C4.** Trust dashboard flagship: large PoIC/ETA score, radar (risk /
  compliance / issuance quality / transparency / history), ETA explanation
  (approve / confidence / evidence) — no AI jargon.

---

## 5. Sequencing

```
Phase 0  Workspace Resolver + Capability Matrix + 6 shells + tier collapse   → batches #7–#9
Phase A  Labels / theme / workspace shells                                 → #10
Phase B  Net-new surfaces (Quick Create, tabs, Identity, perms, mobile)    → #11–#13
Phase C  Polish / primitives / dashboard cards                            → #14–#15
```

**Per-change verification (non-negotiable):**
- `cert_backend` `npx tsc --noEmit` → 0
- `verification-framework` `npx tsc --noEmit` → 0
- `educreds-frontend` `npx tsc --noEmit` → 0; `npm run build` → success
- `npm run dev`, smoke-test each persona's workspace + capability set

**Scope guard:** backend/EVF stay system-of-record + gateway. New Identity/Admin
surfaces that read PII MUST go through EVF `api`/`trusted` mode, never the public
backend route (preserves Batch #6 Public Layer).

---

## 6. What we are NOT doing

- No rewrite of cert_backend / EVF.
- No new blockchain/NFT/DID features — implementation details, hidden from users.
- No Marketplace / Penpot resurrection (removed).
- No single "one nav serves all" interface — that is the anti-pattern this plan
  exists to prevent.
- No staging/prod bicep deployment here (separate infra track).
