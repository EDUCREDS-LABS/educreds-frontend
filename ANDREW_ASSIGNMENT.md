# EduCreds Frontend — Assignment Brief for Edyelu Andrew
**From:** Eragon (acting CTO on behalf of Abdulmajid Kyotoyinze)  
**Date:** 2026-08-18  
**Scope:** Phase 3 — Integration UX & Developer Portal  
**Branch:** `feat/phase3-integration-devportal`

---

## Context You Must Read First

Before touching any code, read these three files in order:

1. `AUDIT_AND_QUICKWINS.md` — what the audit found and what was already fixed
2. `ENTERPRISE_SAAS_PLAN.md` — the architectural thinking behind the workspace/capability model
3. `FRONTEND_REFACTOR_PLAN.md` — the master plan; your work is Phase 3

The short version of those three documents:

**The core principle:** The frontend must speak in business outcomes, not infrastructure components. A university registrar or an HR director should never see words like "EVF", "connector agent", "DID", "blockchain", "on-chain", or "PoIC" unless they are a developer. Your job in Phase 3 is to make the Integration and Developer surfaces feel like a polished enterprise SaaS product, not a developer tool.

**The architecture that already exists (do not rebuild it):**
- `lib/workspaces.ts` — 6 workspace model (institution, student, verifier, government, developer, admin)
- `lib/capabilityMatrix.ts` — generates navigation per workspace/tier. Navigation is DATA, not hardcoded.
- `lib/dualAuth.ts` — Firebase + dual auth (institution/student). Do not touch.
- `TierGuard` + `ProtectedRoute` — route gating by tier and auth type. Do not touch.
- `AppSidebar.tsx` — reads from capabilityMatrix. Do not rewrite nav logic here.
- All Radix UI + shadcn/ui components in `components/ui/` — use these, don't add new UI libraries.

---

## Your Assignment — Two Deliverables

---

### Deliverable 1 — Integration / SIS Connection Wizard

**File to refactor:** `client/src/modules/integration/ConnectorPage.tsx`

**Current state:** A form that dumps connector configuration fields. An IT admin looking at it has no idea what to do.

**Target state:** A step-by-step wizard that makes connecting a SIS feel like connecting an app on Zapier or Stripe. No command line visible. No raw config files exposed.

#### The 4-step wizard flow:

**Step 1 — Choose connection type**

Three clear options as cards:
```
[Tier 1 — On-Premise Connector]
Your student data stays entirely within your own infrastructure.
Best for: Large universities with strict data residency requirements.

[Tier 2 — Cloud SIS Integration]
Connect EduCreds directly to your existing cloud-based SIS.
Best for: Universities already using a cloud SIS (e.g. Banner Cloud, Workday).

[Tier 3 — EduCreds Workspace]
Use EduCreds as your complete credential management system.
Best for: Institutions without an existing digital SIS.
```

Only show the options relevant to the institution's current deployment tier (use `TierGuard` or the `deploymentTier` value from `useAuth()`).

**Step 2 — Setup instructions (Tier 1 example)**

Do not show a form. Show guided steps:
```
Your data stays in your infrastructure.

1. Install Docker on your server (takes ~5 minutes)
   [View Docker install guide →]

2. Download the EduCreds Connector
   [docker-compose.yml]  [.env template]

3. Fill in your Institution ID and database credentials
   (We'll pre-fill your Institution ID below)

4. Start the connector:
   docker compose up -d

5. Enter your Connector URL once it is running:
   [https://your-server:8443         ]
   [Test Connection]
```

When "Test Connection" is clicked, call `GET /api/institutions/connector/health` (or the existing health endpoint — check `IntegrationHealthDashboardPage.tsx` for the current endpoint). Show:
- ✅ Connected — proceed to Step 3
- ❌ Cannot reach connector — show troubleshooting tips (firewall, port 8443, Docker running)

**Step 3 — Configure field mapping**

Show the student fields EduCreds expects vs. what the institution's SIS provides:

```
Map your student fields to EduCreds fields

EduCreds Field          Your SIS Field
─────────────────────────────────────────
Student ID          ←   [student_id    ▾]
Email               ←   [email         ▾]
First Name          ←   [first_name    ▾]
Last Name           ←   [last_name     ▾]
Graduation Date     ←   [grad_date     ▾]
Programme           ←   [programme_name▾]
```

SIS field options come from `GET /api/connector/sis-schema` if available, or the existing data mapping page at `IntegrationDataMappingPage.tsx` — reuse that component's logic here.

**Step 4 — Test & Activate**

```
Testing connection...

✓ Connector reachable
✓ Authentication valid
✓ 4,892 student records accessible
✓ Required fields mapped

[Activate Integration]
```

On activation, call the existing backend endpoint to register the connector endpoint. Refer to `ConnectorPage.tsx` and `HealthDashboardPage.tsx` to find the current API calls — wire up the same endpoints, just with this new UX.

#### Technical notes for ConnectorPage:
- Use the existing `useAuth()` hook for `deploymentTier` and `institutionId`
- Wizard state: use `useState` with a `step` number (1–4). Do NOT use a routing-based wizard (no new routes).
- Use existing `Card`, `Button`, `Badge`, `Progress` components from `components/ui/`
- The wizard replaces the current ConnectorPage — it is not an addition to it
- TypeScript: no `@ts-nocheck`. Fix types properly.

---

### Deliverable 2 — Developer Portal

**Files to update:** `client/src/pages/developer-portal/` (all files)

**Current state:** Partially built. Most metrics show "--". API Explorer is a stub. Webhooks are a form with no delivery history.

**Target state:** A functional developer portal that a technical integration engineer at an employer or institution can actually use.

#### 2A — Developer Dashboard (the landing page)

File: `pages/developer-portal/index.tsx` or whatever the current entry is

Current: shows static "--" metrics  
Target: wire to real API endpoints

```
Developer Dashboard

API Health
● Operational   [View status →]

Your Applications
[Production]  [Sandbox]  [+ Create Application]

This Month
API Requests: [from /api/developer/usage]
Errors:       [from /api/developer/usage]
Latency p99:  [from /api/developer/usage]
```

API endpoint to call: `GET /api/developer/usage` — check `server/routes.ts` or `api/` folder for the existing route. If it doesn't exist yet, mock it with realistic structure and add a `// TODO: wire to backend` comment.

#### 2B — API Keys

File: `modules/integration/APIKeyManagementPage.tsx`

Current state: basic form  
Target state:

```
API Keys

[+ Create API Key]

Production Key
ec_live_••••••••••••••••  [Show] [Copy] [Rotate] [Revoke]
Created: 12 Aug 2026
Last used: 2 minutes ago
Scopes: verify, batch_verify, webhooks

Sandbox Key
ec_test_••••••••••••••••  [Show] [Copy] [Rotate] [Revoke]
Created: 1 Aug 2026
Last used: 1 hour ago
Scopes: verify
```

Scopes to display: `verify`, `batch_verify`, `issue`, `webhooks`, `identity`, `admin`

Wire to existing API key endpoints (already in `APIKeyManagementPage.tsx` — the logic is there, update the display).

Secret key: show only once on creation. After that, show masked with a [Reveal] button that requires re-authentication or a confirmation dialog.

#### 2C — API Explorer

File: wherever the current API Explorer stub lives

This is the most impactful thing for developer adoption.

Build a simple interactive request builder for the 3 most important endpoints:

**Endpoint 1 — Verify Credential**
```
POST /v1/evf/verify

Request
{
  "credentialId": "[text input]"
}

[Send Request]

Response (from staging backend)
{
  "status": "verified",
  "issuer": "Kampala Business School",
  "issuedAt": "2025-12-12",
  "evidence": {
    "credentialIntegrity": true,
    "issuerIdentity": true,
    "revocationStatus": "active",
    "trustScore": 94
  }
}
```

**Endpoint 2 — Batch Verify**
```
POST /v1/evf/verify/batch
[list of credential IDs]
```

**Endpoint 3 — Issue Credential** (institution only)
```
POST /v1/credentials/issue
```

For each endpoint:
- Show the request fields as inputs (not raw JSON editing — use form fields)
- Use the institution's sandbox API key automatically
- Actually call the staging backend: `API_CONFIG.EVF` or `API_CONFIG.CERT` (check `client/src/config/api.ts`)
- Display the real response in a formatted code block

If staging calls are not viable, show a realistic mock response and add `// TODO: connect to staging` comment.

#### 2D — Webhooks

File: `modules/workspace/WebhooksPage.tsx`

Current state: configuration form only  
Target state: add delivery history tab

```
Webhooks

[+ Add Webhook]

Configured Webhooks:
https://company.com/educreds/webhook   ● Active
Events: credential.issued, verification.completed
[Edit] [Test] [Delete]

Delivery History:
2026-08-18 14:32  credential.issued    200 OK     [View]
2026-08-18 14:30  verification.done   200 OK     [View]
2026-08-17 09:12  credential.revoked  503 Failed [Retry] [View]
```

Delivery history endpoint: `GET /api/webhooks/:id/deliveries` — if not built in backend, mock with realistic data and add TODO comment.

---

## Standards You Must Follow

**1. No @ts-nocheck**  
Most existing files have `// @ts-nocheck` at the top. Do not add it to new files. Fix types properly using the types already defined in `client/src/types/`.

**2. No fake/hardcoded data**  
Every metric must come from a real API call or show `—` (em dash). No `+12%` or `98.5%` invented numbers. If an endpoint doesn't exist, mock the structure but clearly comment `// TODO: wire to /api/...`

**3. Use existing components**  
All UI components are in `client/src/components/ui/`. Use `Card`, `Button`, `Badge`, `Tabs`, `Progress`, `Dialog`, `Input`, `Select`. Don't install new libraries.

**4. TypeScript check must pass**  
Run `npx tsc --noEmit` from the `educreds-frontend/` directory before each commit. It must pass.

**5. Business language only**  
Your pages are developer-facing, so technical language is appropriate in the Developer Portal. But in the Integration wizard (ConnectorPage), the audience is university IT admins — use plain language. No "HMAC", no "mTLS", no "DID" in user-facing strings. Those can be in tooltips/advanced sections only.

**6. One PR per deliverable**  
- PR 1: Integration/ConnectorPage wizard
- PR 2: Developer Portal (all four 2A–2D sections)

Do not bundle both into one PR.

---

## How to Run Locally

```bash
cd educreds-enterprise/educreds-frontend
npm install
npm run dev
```

The app starts at `http://localhost:5000`. Log in with an institution account.

To see the Integration pages: navigate to Integrations in the sidebar (requires enterprise-connector or cloud-connector tier — check `TierGuard`).

To see the Developer Portal: navigate to `/developer-portal` or use the sidebar.

---

## Questions & Coordination

Direct questions to Eragon (via Abdulmajid's WhatsApp) before making architectural decisions.

**Do not:**
- Change the auth system
- Change `capabilityMatrix.ts` structure (labels are being updated separately)
- Rebuild components that already exist — extend them
- Add new npm packages without asking first

**Raise immediately if:**
- A backend endpoint you need doesn't exist (we may need Abdulmajid to build it)
- You find a major bug in an existing page while working on adjacent code
- TypeScript check fails and you can't fix it within 30 minutes

---

## Completion Checklist

**Phase 3A — Integration Wizard:**
- [ ] 4-step wizard renders correctly for all 3 tier options
- [ ] Tier 1: "Test Connection" calls real health endpoint
- [ ] Field mapping step renders and saves correctly
- [ ] Tier 2 and Tier 3 flows are distinct (not just relabeled Tier 1)
- [ ] No command-line instructions visible to user
- [ ] `npx tsc --noEmit` passes

**Phase 3B — Developer Portal:**
- [ ] Dashboard shows live metrics (or clear "--" with TODO comment)
- [ ] API Keys: masked display, create/rotate/revoke actions wired
- [ ] API Explorer: 3 endpoints, interactive, returns real or clearly-mocked response
- [ ] Webhooks: delivery history tab added
- [ ] `npx tsc --noEmit` passes

When both checklists are complete, tag Eragon for review before opening the PRs.
