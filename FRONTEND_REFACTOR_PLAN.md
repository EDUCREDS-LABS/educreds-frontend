# EduCreds Frontend — Concrete Refactor & Implementation Plan
**Authored by:** Eragon (acting CTO/Product lead on behalf of Abdulmajid)  
**Date:** 2026-08-18  
**Status:** ACTIVE — supersedes ENTERPRISE_SAAS_PLAN.md Phase A onwards

---

## Where We Are

The codebase is more mature than the earlier audit suggests. Since that audit, Phase 0 was implemented:

- ✅ `workspaces.ts` — 6 workspace data model complete
- ✅ `capabilityMatrix.ts` — 210 lines, generates nav per (workspace × tier)
- ✅ `AppSidebar.tsx` — uses capability matrix, not hardcoded nav
- ✅ `WorkspaceSelector` component exists
- ✅ `TierGuard` + `ProtectedRoute` — role/tier gating in place
- ✅ Quick wins applied — "blockchain", "DAO", "node", "Management Infrastructure" purged
- ✅ `InstitutionOverview` — live API stats, no fake metrics
- ✅ 6-workspace shell architecture defined

**The gap between now and the product vision is NOT a rebuild. It is 3 focused phases.**

---

## What Still Needs Doing (Gap Analysis)

### Critical gaps (blocks enterprise sales):
1. **Executive Overview screen is incomplete** — ModernDashboard still mixes technical signals with business metrics. The CEO/Registrar screen needs to be a clean business dashboard.
2. **3 killer journeys are not exceptional** — Bulk issuance, bulk verification, student sharing are functional but not polished enough for a PwC demo.
3. **Verification Center is weak** — `/employer/verify` is a basic form. It needs to become a proper Verification Center (the revenue product).
4. **Student wallet UX is fragmented** — credential cards, sharing controls, and verification activity are separate pages; need to be one coherent flow.
5. **Terminology still leaks** — "On-chain", "PoIC", "DID Management", "EVF" still visible in some page headers and tab labels.
6. **Connector/Integration UI is a form dump** — the ConnectorPage shows raw config fields. Needs to feel like connecting an app, not writing a config file.

### What is good and should NOT be touched:
- Component library (Radix UI + Tailwind) — solid foundation
- `capabilityMatrix.ts` + `workspaces.ts` — keep as is
- Auth system (Firebase + dual auth) — working
- `InstitutionOverview` with live API stats — good pattern to replicate
- Route structure — fine, minor label cleanup only

---

## Implementation Plan

### Phase 1 — The Three Killer Journeys (Abdulmajid + Eragon)
**Goal:** Make these 3 flows exceptional. Everything else waits.  
**Timeline:** 2 weeks  
**Assignee:** Eragon architects, Abdulmajid reviews

#### 1A — Bulk Issuance Journey
File: `client/src/modules/workspace/BatchOperationsPage.tsx`

Current state: functional but raw  
Target state:
```
Step 1: Upload CSV or Connect SIS
         [Drop CSV here] or [Connect to KBS SIS]

Step 2: Preview
         4,821 students detected
         ✓ 4,807 valid    ⚠ 14 require attention
         [Review 14 →]    [Continue]

Step 3: Issue
         Progress bar — real-time via websocket
         ████████████░ 92% — 4,423 issued

Step 4: Complete
         4,807 credentials successfully issued
         [View Report] [Download CSV] [Notify Students]
```
Changes needed:
- Wrap existing `BulkIssuanceForm` inside a 4-step wizard component
- Replace the current spinner with a real progress bar (websocket or polling `/api/jobs/:id`)
- Add validation preview step before issuing
- Add completion screen with download/notify actions

#### 1B — Bulk Verification Journey
File: `client/src/pages/employer/verify.tsx`

Current state: single paste-field form  
Target state — full Verification Center:
```
Verify a Credential
[Paste link]  [Scan QR]  [Upload file]  [Credential ID]

→ VERIFYING...
  ✓ Credential found
  ✓ Issuer authenticated
  ✓ Cryptographic proof valid
  ✓ Not revoked
  ✓ Institution trusted (Trust Score: 94)

→ VERIFIED   [View Evidence] [Download Report]
```
And for Enterprise (API key holder):
```
Bulk Verification
[Upload candidate list CSV]

→ Processing 1,000 candidates...
   987 Verified ✓
     8 Revoked ✗
     5 Require Review ⚠
[Download Full Report]
```
Changes needed:
- Redesign `/employer/verify` as the Verification Center
- Add 4 input methods (link, QR scan, file upload, ID entry)
- Add clear evidence display (not raw JSON — structured cards)
- Add bulk upload flow for enterprise verifiers

#### 1C — Student Sharing Flow
Files: `client/src/pages/claim/ClaimCredentialPage.tsx`, student portal

Current state: fragmented across pages  
Target state — Credential Sharing Wizard:
```
Who are you sharing with?
  ○ Employer   ○ University   ○ Government   ○ Anyone

What to include:
  ✓ Name          ✓ Degree
  ✓ Institution   ✓ Graduation date
  □ GPA           □ Transcript

Purpose: [Employment verification ▾]

[Create Verification Link]
→ Link valid for 30 days
→ Abdulmajid Kyotoyinze has been notified when this is verified
```
Changes needed:
- New `CredentialSharingWizard` component (3-step)
- Selective disclosure UI (checkboxes per attribute)
- Expiry/purpose controls
- Verification activity feed ("ABC Holdings verified your credential 2 hours ago")

---

### Phase 2 — Executive Overview & Terminology Cleanup (Eragon)
**Goal:** The dashboard a Registrar sees on first login is a business dashboard.  
**Timeline:** 1 week  
**Assignee:** Eragon — Andrew reviews

#### 2A — Terminology purge (remaining)
Global find-replace across all page headers, tab labels, and card titles:

| Current label | Replace with |
|---|---|
| DID Management | Organization Identity |
| PoIC | Trust Score |
| EVF | Verification |
| Connector Agent | Integrations |
| Governance Workspace | Network Governance |
| On-chain | (remove entirely) |
| Trust Agent | Trust Intelligence |
| Issuance Monitor | Credential Activity |
| Audit Trail | Activity Log |

Script this — do not do it manually.

#### 2B — Executive Overview screen
File: `client/src/pages/institution/overview.tsx`

Restructure the Overview screen into 5 clear business panels:

```
Panel 1 — Credential Operations
  [Total Issued]  [This Month]  [Pending]  [Revoked]

Panel 2 — Verification
  [Total Verifications]  [Success Rate]  [Flagged]

Panel 3 — Trust
  Institution Trust Score: 92/100 — Healthy
  (5 dimension breakdown collapsible)

Panel 4 — Operations (live status)
  SIS Connection     ● Healthy
  Issuance Pipeline  ● Healthy
  Verification API   ● Healthy
  Identity           ● Healthy

Panel 5 — Plan & Usage
  Plan: Professional
  Credentials: 42,920 / 50,000
  Next billing: 12 days
```

Remove: any remaining "On-chain", PoIC score as a raw number without context

#### 2C — Navigation label cleanup
File: `client/src/lib/capabilityMatrix.ts`

Update labels to match the business language:
- "Trust" → "Trust Intelligence"
- "Compliance" → "Governance"
- "Connect" → "Integrations"
- "Audit Trail" → "Activity Log"

---

### Phase 3 — Integration UX & Developer Portal (Andrew — see ANDREW_ASSIGNMENT.md)
**Goal:** Connecting a SIS feels like connecting an app, not running a script.  
**Timeline:** 2 weeks  
**Assignee:** Andrew Edyelu (full brief in ANDREW_ASSIGNMENT.md)

#### 3A — Integration / Connector UX
File: `client/src/modules/integration/ConnectorPage.tsx`

Current state: raw config form  
Target state: step-by-step "Connect your SIS" wizard:
```
Step 1: Choose connection type
  [Tier 1 — On-Premise]  [Tier 2 — Cloud SIS]  [Tier 3 — EduCreds Workspace]

Step 2 (Tier 1 example):
  Your data stays in your infrastructure.
  1. Download the EduCreds Connector (Docker)
  2. Run: docker compose up -d
  3. Enter your Connector URL:  [https://your-server:8443]
  [Verify Connection ✓]

Step 3: Configure
  Database: [Postgres ▾]
  Map your student fields → EduCreds fields
  [student_id → studentId] [email → email] [graduation_date → issuedAt]

Step 4: Test
  Fetching test student record...
  ✓ Connection successful
  ✓ 4,892 student records found
  [Activate →]
```

#### 3B — Developer Portal
File: `client/src/pages/developer-portal/`

Current state: partially built, metrics show "--"  
Target state (Andrew's full scope):
- API health status (live, not "--")
- Applications list with Create/manage
- API Keys with scopes, last used, rotation
- API Explorer — interactive request builder
- Webhook configuration + delivery history
- Usage charts (real data from `/api/developer/usage`)

---

## File Map (What Gets Touched)

```
Phase 1 (Killer journeys):
  modules/workspace/BatchOperationsPage.tsx      — bulk issuance wizard
  pages/employer/verify.tsx                      — verification center rebuild
  pages/claim/ClaimCredentialPage.tsx            — sharing wizard
  NEW: components/issuance/BulkIssuanceWizard.tsx
  NEW: components/verification/VerificationCenter.tsx
  NEW: components/sharing/CredentialSharingWizard.tsx

Phase 2 (Overview + terminology):
  pages/institution/overview.tsx                 — executive overview
  lib/capabilityMatrix.ts                        — label updates
  scripts/terminology-purge.ts                   — NEW: scripted find-replace
  components/modern/ModernDashboard.tsx          — remove remaining tech leaks

Phase 3 (Andrew — see ANDREW_ASSIGNMENT.md):
  modules/integration/ConnectorPage.tsx          — SIS connect wizard
  pages/developer-portal/                        — all files
  modules/integration/APIKeyManagementPage.tsx   — wired to live API
  modules/integration/HealthDashboardPage.tsx    — live metrics
```

---

## Constraints (Do Not Break)

1. **Do not touch auth** — Firebase + dual auth is working. Don't refactor it.
2. **Do not touch `capabilityMatrix.ts` structure** — only update labels and paths
3. **Do not rebuild components** — refactor/extend existing ones (BulkIssuanceForm, TierGuard, etc.)
4. **TypeScript strict** — `npx tsc --noEmit` must pass after every PR
5. **No fake/hardcoded stats** — every metric must come from a real API call or show "—"
6. **Azure ACR builds** — Docker not available locally; all container builds go through Azure ACR
7. **No new dependencies without discussion** — package.json is already large

---

## Review Cadence

- Each phase = one PR per major change (not one giant PR)
- Eragon reviews Phase 3 PRs from Andrew
- Abdulmajid reviews Phase 1 completed journeys before Phase 2 starts
- TypeScript check must pass before any PR is considered complete

---

## Success Criteria

Phase 1 done when:
- A non-technical registrar can issue 100 credentials in under 3 minutes with zero confusion
- An HR manager can verify 10 credentials in under 60 seconds
- A student can share a credential with selective disclosure in under 2 minutes

Phase 2 done when:
- Zero technical terms (blockchain, DID, EVF, PoIC, on-chain, connector agent) visible in any non-developer UI path
- Executive overview shows 5 clean business panels with real data

Phase 3 done when:
- Connecting a SIS requires no command-line knowledge
- Developer portal shows live API metrics, not "--"
- API Explorer returns a real response from staging backend
