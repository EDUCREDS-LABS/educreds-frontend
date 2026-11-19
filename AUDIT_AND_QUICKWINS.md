# EduCreds Frontend — Product Audit & Quick-Win Implementation Log

**Date:** 2026-07-18
**Scope:** `@educreds-frontend` product/UX/IA audit + implementation of Quick Wins
**Status:** Audit complete; Quick Wins implemented and typechecked (tsc --noEmit passes).

---

## 0. Critical discovery

> **CORRECTION (2026-07-19):** The earlier claim that *"the frontend is a repurposed design-tool codebase (edudesign-pro)"* is **wrong** and has been retracted.
>
> - `package.json` `name: "edudesign-pro"` and its `"description"` are stale boilerplate/branding from project scaffolding — they do **not** mean the app was forked from a design marketplace. The actual EduCreds frontend is purpose-built (auth, issuance, verification, templates/designer, institution + student + admin surfaces).
> - The only real "design marketplace" residue was the **Marketplace** feature (`/marketplace`, `pages/marketplace/*`, `components/marketplace/*`, `marketplaceService`, `useMarketplaceAuth`), which was **deleted** in batch #3 (this session) because it was unused and not part of the product. The institutional **Credential Designer** (`pages/designer.tsx` → `TemplateDesigner`, a GrapesJS/SVG editor that saves to `${API_CONFIG.CERT}/templates`) is a first-class EduCreds feature, not marketplace residue.
> - Structural confusion (split terminology, leftover Penpot references) was caused by additive feature growth over time, **not** by repurposing a third-party codebase.
>
> Any long-term IA work should treat EduCreds as a single, purpose-built app; the stale `package.json` name/description should simply be corrected (see §11).


---

## 1. Full Product Audit (summary of 14 sections)

### Current structure
- **Routes:** ~70 across public/marketing, institution (auth, tier-gated), admin, marketplace, developer portal, templates/designer.
- **Three competing navigation models:** `navModel.ts` (canonical, unused), `AppSidebar.tsx` (real, grouped by *deployment tier*), `Layout.tsx` header (hardcodes "Management Infrastructure"). Plus `PublicLayout`/`ModernHeader` and a dead `EnterpriseLayout` stub.
- **Auth:** Firebase + dual auth (institution/student/admin/wallet) + OTP + wagmi/AppKit wallet.
- **Dashboards:** `ModernDashboard` (strong), admin consoles, usage/health/issuance monitors.

### Personas
Institution Admin, Registrar, Student, Employer/Verifier, Government (no surface), Developer (shallow portal), EduCreds Super Admin, Marketplace User (off-core residue).

### Business capabilities (proposed grouping)
Identity & Access · Credentials · Verification & Trust · Design & Templates · Integrations & Connectors · Analytics & Reporting · Governance & Compliance · Developer Platform · Administration · Billing · Settings.

### Technical leaks (797 grep matches)
blockchain / on-chain / decentralized / mint / wallet / MetaMask / private key / DAO / node / PoIC / IIN / EVF / Connector Agent / Verifier Agent / OID4VC / SD-JWT / DID / IPFS / web3 / wagmi / RPC / ABI / consensus engine. **None of these belong in non-developer UI.**

### Scoring (1–10)
Enterprise readiness 3 · Usability 6 · IA 3 · Navigation 4 · Accessibility 6 · Scalability 5 · Maintainability 4 · Role Separation 5 · Business Orientation 3 · Developer Experience 4. **Overall ~4.3/10.**

### Top problems (condensed)
- 3 nav models; nav grouped by *tier* not task.
- App calls itself "Management Infrastructure" / "node in the DAO".
- Students forced through wallet/key-export mental model.
- Employers must paste IPFS hashes / token IDs / DIDs.
- Dead `EnterpriseLayout`; hardcoded fake stats (+12%, 98.5%).
- 3 parallel issuance UIs; connector setup = shell commands.
- Developer portal shows "Total Requests: --".
- Marketplace/Designer dilutes core positioning.

### Proposed IA (business domains)
```
PUBLIC: Home · How it works · Trust Directory · Verify · Pricing · Docs · Developer Portal
INSTITUTION: Home · Credentials · Recipients · Verification · Insights · Connections · Account · Network
ADMIN: Tenants · Users · Trust & Compliance Ops · Observability · Billing Ops · Support
DEVELOPER: API Keys · Auth Tokens · API Explorer · Webhooks Log · Usage & Limits · SDKs · Status · Docs
```

Full 14-section narrative, priority/impact/risk matrices are in the audit delivered in-chat.

---

## 2. Quick Wins implemented (this session)

| # | Change | File(s) | Why |
|---|---|---|---|
| Q1 | Terminology purge: "Management Infrastructure" → "Institution Console"; "node in the governance DAO" → neutral; "Blockchain & Trust" → "Trust & Verification"; "decentralized infrastructure" → "the platform"; "DAO Governance" → "Network Governance"; "onchain transactions" → "credential activity"; "blockchain-verified" → "verifiable"; "consensus engine" acknowledgement copy softened | `Layout.tsx`, `OnboardingFlow.tsx`, `AdminLayout.tsx`, `ModernDashboard.tsx`, `ChatWidget.tsx`, `ModernFooter.tsx`, `ModernHeader.tsx` | Stops exposing backend architecture to non-technical users |
| Q2 | Removed hardcoded fake KPIs: `+12%` trend removed; `98.5% validity rate` → real `activeCertificates` count; "on the blockchain" empty-state copy removed | `ModernDashboard.tsx` | No fabricated metrics in an enterprise product |
| Q3 | Student claim flow: default to hosted "EduCreds account"; raw private-key export demoted to a collapsed **Advanced** `<details>` with explicit self-custody warning | `ClaimCredentialPage.tsx` | Security + trust: students should not be handed raw keys by default |
| Q4 | Student portal: reordered chooser so **Email** and **SSO** are primary/recommended; Wallet marked "(advanced)" | `student-portal.tsx` | Wallet-first framing is wrong for students |
| Q5 | Employer verify: added default **Share Link** tab (+ 5-tab layout); helper copy rewritten around link/file; result copy "valid on the blockchain" → "currently valid"; not-found covers link method | `employer/verify.tsx` | Employers verify via shared links, not hashes |
| Q6 | Deleted dead `layouts/EnterpriseLayout.tsx` stub (unused, "EduCreds Infrastructure" placeholder) | removed file | Kills ghost component / confusion |
| Q7 | Removed non-functional "EN" language selector from header (+ dropped now-unused `Globe`/`ChevronDown` imports) | `ModernHeader.tsx` | Removes a fake affordance |
| Q8 | Command-search results no longer render raw route paths (`result.path`) to users | `Layout.tsx` | Stops leaking internal URLs |

**Validation:** `npx tsc --noEmit` passes. ESLint shows only pre-existing warnings (unused imports, `any` types) in touched files — no new errors introduced.

---

## 3. Not yet done (deferred — higher effort, tracked from audit)

- Unify all navigation into one model + one design language (replace tier-based grouping).
- Full IA re-architecture per Section 12.
- Consolidate 3 issuance UIs into one progressive form.
- OAuth/API-key connector "connect" (no shell/bootstrap commands).
- Build out Developer Portal: sandbox, API explorer, webhook log, usage/rate-limit charts, SDKs, status page.
- Team & role management; SSO/SAML for institutions.
- Government/accreditation compliance view + audit export.
- Decide Marketplace/Designer scope (spin off or clearly segment).
- Localization framework (real i18n) to replace the removed EN toggle.

---

## 4. How to verify visually
```
cd educreds-frontend
npm run dev
```
Spot-check: institution dashboard (no "blockchain" copy, no fake +12%), student claim flow (key export hidden under Advanced), `/employer/verify` (Share Link is first tab), public footer/header (no DAO/onchain language), global search (no route paths shown).

---

## 5. Refactor Batch #1 (this session, after Quick Wins)

| # | Change | Files | Why |
|---|---|---|---|
| R1 | **Consolidated 3 issuance UIs → 1.** Deleted orphans `BulkCertificateIssuance.tsx`, `EnhancedBulkIssuance.tsx`, `BulkIssuanceFailureTracker.tsx`, and dead `/bulk-issuance` page. All issuance now flows through `EnterpriseCertificateIssuance` (template / PDF / bulk-CSV tabs) → `BulkCSVUploader`. Added `/bulk-issuance` → `/institution/issue` redirect for any legacy links. | `App.tsx`, `EnterpriseCertificateIssuance.tsx`, 4 deleted files | Removes 1149 lines of duplicated issuance UI; single mental model for users |
| R2 | **Navigation unified to business domains.** Sidebar group label changed from tier-based "Workspace Infrastructure"/"Connector Infrastructure" → constant "Institution Console". Groups renamed: "Credentialing"→**Credentials**, "Workspace"→**Insights**, "Integration"→**Connections**, "Governance"+"Compliance"→**Network**. Tier-gating of *features* preserved; tier no longer names the nav. Removed now-unused `Database` import and the unused `tier` param on `getTierGroupLabel`. | `AppSidebar.tsx` | Stops exposing backend architecture/tiers as navigation taxonomy |
| R3 | **Retired dead `navModel.ts`** (unused `useNavModel`/`BRAND` that duplicated the real nav). | deleted `components/layout/navModel.ts` | Kills a second, unused source of truth for nav |
| R4 | **Connector setup de-technicalized.** "Enterprise Agent Runbook" (docker pull/run/bootstrap commands) → "Technical Setup (IT only)" with copy clarifying most institutions connect without it. "Agent Lifecycle + Diagnostics" → "Agent Lifecycle & Diagnostics" with plain copy. | `ConnectorForm.tsx` | Hides self-hosted shell commands from non-technical institution users |
| R5 | **Developer Portal real usage.** Removed fake "Total Requests: -- / Analytics coming soon" card. Replaced with "Active Keys" (shows real last-used, via `lastUsedAt`) and "API Calls (30d)" pointing to per-key last-used. Added `formatLastUsed()` helper. `ApiKeyCard` already renders real `lastUsedAt`. | `developer-portal/index.tsx`, `ApiKeyCard.tsx` | No fabricated/placeholder metrics; surfaces real data |

**Validation:** `npx tsc --noEmit` passes. ESLint shows 0 errors (only pre-existing unused-import/`any` warnings in touched files).

---

## 7. Verification pass (post-batch review requested by stakeholder)

**Problem reported:** "Developer Portal still shows login but no auth route available."

### Root cause found
- `/developer-portal` was routed as `<PublicLayout><DeveloperPortalPage /></PublicLayout>` — **no route-level auth guard**.
- The page's only login escape-hatch linked to **`/auth`**, which **does not exist** as a route (real routes: `/login`, `/student/login`, `/register`). So unauthenticated users hit a dead end.

### Fixes applied in this pass
| Fix | File | Detail |
|---|---|---|
| Guard dev portal route | `App.tsx` | `/developer-portal` now wrapped in `<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout>…</Layout></ProtectedRoute>` → redirects unauthenticated users to `/login`. |
| Fix broken login link | `developer-portal/index.tsx` | `window.location.href = "/auth"` → `"/login"`. |
| Terminology leak missed earlier | `admin/AdminSidebar.tsx`, `admin/AdminLayout.tsx` | "DAO Governance"→"Network Governance", "On-Chain Ledger"→"Credential Ledger", "Infrastructure Logs"→"Audit Logs". |
| Fake `+12%` stat (unreachable page) | `pages/certificate-management.tsx` | Replaced with neutral copy. |
| Dead link `/certificate-management` | `dashboard/InstitutionDashboard.tsx` | Repointed to real `/institution/certificates`. |
| **Double header on `/trust-registry`** | `pages/registry/index.tsx`, `components/PublicLayout.tsx`, `App.tsx` | Page self-rendered `ModernHeader`+`ModernFooter` while also wrapped in `PublicLayout` (which renders them) → two nav headers. Removed self-rendered header/footer from the page. |
| **Same double-header bug on `/designer` & `/marketplace`** | `pages/designer/index.tsx`, `pages/marketplace/index.tsx`, `App.tsx` | Both self-rendered `ModernHeader`. Removed self-render; `PublicLayout` now accepts optional `onStudentPortalClick` so those routes keep their student-portal CTA without re-rendering a header. |

> After this pass, the only pages that still self-render `ModernHeader` are `EduCredsLabsLanding` (`/infra`) and `about` (`/about`) — both routed **standalone** (not in `PublicLayout`), so they are correct.

### Verification performed
- `npx tsc --noEmit` → **pass (exit 0)**.
- `npx vite build` → **success**; every import resolves and connects.
- Grep audit: `/trust-registry`, `/designer`, `/marketplace` no longer self-render `ModernHeader`; all three still render correctly inside `PublicLayout`.

### Current route map (verified real routes in App.tsx)
**Public / guest:** `/`, `/about`, `/login`, `/student/login`, `/register`, `/register/verify-otp`, `/forgot-password`, `/infra`, `/claim/:token`, `/identity/:eduCredsId`, `/terms`, `/privacy`, `/careers`, `/blog`, `/press`, `/documentation`, `/api-reference`, `/pricing`, `/student-portal`, `/trust-registry`, `/verify`, `/employer/verify`, `/governance/public-vote`, `/marketplace*`, `/designer`
**Institution (auth + Layout):** `/institution/dashboard`, `/issue`, `/certificates`, `/manage-specs`, `/lms-import`, `/profile`, `/settings`, `/subscription`, `/governance-workspace`, `/analytics`, `/batch-operations`, `/audit-trail`, `/webhooks`, `/white-label`, `/issuance-monitor`
**Connections (connector tiers):** `/connect/connector`, `/connect/api-keys`, `/connect/data-mapping`, `/connect/health-dashboard`, `/connect/delegated-signing`
**Compliance:** `/compliance/enterprise-overview`, `/compliance/verification`, `/compliance/intelligence`, `/compliance/notification-settings`
**Developer Portal (auth):** `/developer-portal` ✅ now guarded
**Admin:** `/admin/login`, `/admin/*` (dashboard, security, users, infrastructure, recovery, governance, compliance, audit, observability, pending-mints)
**Redirects:** `/bulk-issuance`→`/institution/issue`; many legacy `/workspace/*`, `/integration/*`, `/governance/*`, `/certificate-issuance*` → canonical paths.
**Fallback:** `/`→`*`→`NotFound`.

> Note: `/auth` and `/certificate-management` were pre-existing dead routes/links; both now resolved.

---

## 9. Refactor Batch #2 — terminology & UX cohesion (this session)

Focus: remaining **user-facing** architecture leaks on public/institution surfaces + onboarding + landing.

| # | Change | File(s) | Why |
|---|---|---|---|
| B1 | Landing page de-technicalized | `ModernLanding.tsx` | Badge "Blockchain-Powered Certificates"→"Verifiable Digital Credentials"; hero "on the blockchain"→"that anyone can trust"; "Blockchain Security"→"Tamper-Proof Security"; "smart contracts"→"share link / QR / file"; Harvard quote "blockchain security"→"cryptographic verification". |
| B2 | Onboarding jargon | `OnboardingFlow.tsx` | "secure blockchain batch issuance"→"issue credentials in bulk, securely". |
| B3 | Delegated signing copy | `DelegatedSigningPage.tsx` | "sign blockchain transactions"→"issue credentials"; "irreversible on-chain actions"→"issue credentials in your institution's name" (kept security warning substance). |
| B4 | Student dashboard intro | `StudentDashboard.tsx` | "audit achievements on the blockchain"→"track your educational achievements". |
| B5 | Connector runbook (from batch #1 follow-up) | `ConnectorForm.tsx` | "Enterprise Agent Runbook" already relabeled to "Technical Setup (IT only)"; "Connector Agent Version" label kept (accurate for self-hosted). |

**Deliberately left as-is (correct for audience):**
- Admin console (`/admin/*`): "Credential Ledger", "Consensus Round Telemetry", "Oracle Management", node health — these are EduCreds *staff* ops tools; backend terminology is appropriate there.
- `BlockchainIndexerDashboard`, `NetworkIntegrity`, wallet-connected `StudentDashboard` stats ("On-chain") — internal/technical dashboards.
- `TierGuard`: already shows an "Access Restricted" screen with current/required tier + Upgrade CTA (no silent redirect). `isWorkspaceLocked` correctly hides upgrade and points to account manager.

**Verification:** `tsc --noEmit` exit 0; `vite build` success.

---

## 11. Refactor Batch #3 — Marketplace removal + Designer wiring + credential visual (this session)

User correction: the "edudesign-pro repurposed codebase" claim (§0) was **wrong** and retracted — see §0 correction. `package.json` name/description updated to `educreds-frontend`.

### A. Deleted the Marketplace feature entirely (it was unused, not part of the product)
- **Pages:** `pages/marketplace/*` (index, login, register, verify, auth-callback, [id]), `pages/MarketplacePage.tsx`, `pages/designer/index.tsx` (the "Coming Soon" stub), `pages/templates/Designer.tsx` (wrongly imported the stub), `pages/TemplateLibraryPage.tsx`.
- **Components:** `components/marketplace/*` (SuperiorMarketplace, MarketplaceAuth, TemplateCard, TemplateDetails, TemplateEditor, TemplateGrid, FilterSidebar, PaymentModal), `CertificateMarketplace.tsx`, `InstitutionTemplateLibrary.tsx`, `components/dashboard/InstitutionMarketplaceDashboard.tsx`, `DesignerAnalyticsDashboard.tsx`.
- **Lib/store/hooks:** `lib/marketplaceService.ts`, `lib/marketplaceApi.ts`, `lib/marketplace-auth.ts`, `store/marketplaceStore.ts`, `hooks/useMarketplaceAuth.ts`.
- **Auth:** removed the `marketplace` principal from `providers/AuthProvider.tsx` (import, type, state, logout, priority); `ProtectedRoute` no longer redirects to `/marketplace`.
- **Routes/nav:** removed the 4 `/marketplace/*` routes and the public `/designer` stub route from `App.tsx`; removed "Marketplace" from `Layout.tsx` search routes and `PublicLayout.tsx` doc comment.
- **UI references cleaned:** `InstitutionDashboard` (removed marketplace fetch + "Purchased Templates"/"Browse Marketplace" → Credential Designer CTA), `EnterpriseCertificateIssuance` ("Get Templates"→"Design Templates" → `/institution/manage-specs`), `ModernDashboard` (`/marketplace`→`/institution/manage-specs`), `templates/Browse` heading "Template Marketplace"→"Template Library", `templates/MyTemplates` ("Browse Marketplace"→"Browse Library", "Open Studio"→"Open Designer"), `DevPanel` link, `blog` post title, `legal/terms` feature bullet.

> Left dormant (low-risk, not user-visible): `dualAuth.ts` / `api.ts` still contain `marketplaceLogin`/`canAccessMarketplace` helpers and `authStorage` `getMarketplaceToken`. These are harmless dead code and were left to avoid destabilizing `DualAuth.getUser`. Can be removed in a later pass.

### B. Designer consumed correctly by Tier 3 (EduCreds Workspace)
- Root cause found: `/institution/templates/designer` **redirected back to `/institution/manage-specs`** (App.tsx legacy redirect), so the real `TemplateDesigner` (`pages/designer.tsx`, GrapesJS/SVG editor that POSTs to `${API_CONFIG.CERT}/templates`) was unreachable — a broken loop.
- Fix: `/institution/templates/designer` now mounts the real `TemplateDesigner`, gated to `workspace` (Tier 3) via `TierGuard`. Removed the two dead stub files that masked it. The "Design New Specification" button in `ManageSpecs` and "Open Designer" in `MyTemplates` both reach it.
- Design → save (draft/publish to CERT backend with `htmlContent` SVG + `placeholders` + `grapesJsData`) → appears in `ManageSpecs` library → selectable at issuance. Loop is now seamless for Tier 3.

### C. Credential visual shown in the student wallet
- `CertificateCard` now renders a **credential visual** at the top: `imageUrl` (img) or `htmlContent` (sanitized SVG via DOMPurify), with a graceful fallback to the existing text card when neither is present.
- `StudentDashboard.loadCertificates` enriches each credential with its designed template visual by `templateId` (fetch `${API_CONFIG.CERT}/templates/{id}`), attaching `htmlContent`/`imageUrl` so students see the actual certificate image. Wrapped in try/catch so missing/forbidden templates degrade silently.

**Verification:** `tsc --noEmit` exit 0; `vite build` success (only chunk-size warning).

---

## 12. Remaining deferred work (from audit + batches #1–#3)
- Full IA re-architecture into PUBLIC / INSTITUTION / ADMIN / DEVELOPER surfaces.
- OAuth/API-key connector "connect" flow (guided SIS connect; hide raw DB/mTLS fields behind Advanced).
- Build out Developer Portal: sandbox, API explorer, webhook log, rate-limit charts, SDKs, status page.
- Team & role management; SSO/SAML for institutions.
- Government/accreditation compliance view + audit export.
- Real i18n framework (replace removed EN toggle).
- Render designed-template SVG thumbnails in `ManageSpecs` library grid (designer saves `htmlContent` but no `thumbnail`; library currently shows a placeholder). Backend `getTemplateSpecs` should return `htmlContent`/`thumbnail` to close this gap.
- Light-touch: remaining internal mentions of "mint"/"on-chain" in `PdfCertificateUpload`, `IssueTemplateModal`, `IssuanceMonitorPage` status labels (technical but user-visible on issuance confirmations).
- Remove dormant marketplace auth helpers from `dualAuth.ts`/`api.ts`/`authStorage` when a safe auth-regression pass is scheduled.

---

## 13. Refactor Batch #4 — issuance terminology + library visual + orphan cleanup (this session)

| # | Change | File(s) | Why |
|---|---|---|---|
| D1 | Issuance toasts/copy de-blockchained | `EnterpriseCertificateIssuance.tsx` | "anchored on blockchain"→"issued and secured"; "credential minted"→"credential issued"; "issuing on-chain credentials"→"issuing credentials"; "on-chain anchoring"→"valid, tamper-proof credential". Keeps verification/IIN guard semantics. |
| D2 | PDF upload + template modal toasts | `PdfCertificateUpload.tsx`, `IssueTemplateModal.tsx` | "Certificate Minted"/"issued and minted"→"Credential Issued"/"issued"; "Transaction Pending"→"Issuance Pending". |
| D3 | Student wallet stat labels | `StudentDashboard.tsx` | "Immutable / On-chain"→"Secured / Issued"; "On-chain Integrity … Base protocol immutability"→"Tamper-Proof … cryptographically signed, verifiable, unaltered". |
| D4 | Library renders designed template | `ManageSpecs.tsx` | Added `htmlContent?` to `TemplateSpec` and render the sanitized SVG (DOMPurify) in grid + list when no `thumbnail` — closes the "designed template has no visual in library" gap from §11. |
| D5 | Orphan cleanup | `pages/system-test.tsx`, `components/dashboard/DesignerDashboard.tsx` | Deleted; neither was imported or routed (both referenced only marketplace/legacy residue). |

**Deliberately left as-is:** `BlockchainIndexerDashboard`, `NetworkIntegrity`, admin `Credential Ledger`/`Consensus Round Telemetry` — internal/ops surfaces where the language is accurate for EduCreds staff. Dormant marketplace auth helpers in `dualAuth.ts`/`api.ts` (flagged §11 for a later safe pass).

**Verification:** `tsc --noEmit` exit 0; `vite build` success (only chunk-size warning).

---

## 14. Refactor Batch #5 — make the credential image actually render (backend-grounded)

Investigated `cert_backend` (`@cert_backend`) to verify assumptions before touching the student wallet. Key findings:

- `Certificate` entity already generates a **`previewImageIPFSHash`** at issuance (rendered PNG of the template via puppeteer). So a real certificate image exists per credential.
- **Bug confirmed:** `GET /api/certificates/wallet/:address` (`certificates.service.ts → getCertificatesByStudent`) returned `id/studentName/courseName/…/ipfsHash/tokenId/issuanceStatus` but **omitted `previewImageIPFSHash`** — so the frontend had nothing to render. (Also: the credential has no `templateId` column, so the earlier frontend template-fetch enrichment could never fire.)
- `/templates/specs` returns `thumbnail`/`previewUrl` but **not** `htmlContent` — so the §13 `ManageSpecs` SVG render only helps if a `thumbnail` is present; harmless fallback otherwise.

### Changes
| # | Layer | File(s) | What |
|---|---|---|---|
| E1 | Backend | `certificates/service.ts` | Added `resolveIpfsUrl(hash)` (mirrors `StorageService` gateway list, prefers `IPFS_GATEWAY_URL` → `gateway.pinata.cloud`) and exposed `previewImage` (raw hash) + `previewImageUrl` (gateway URL) on the wallet DTO. **No DB migration.** |
| E2 | Frontend | `CertificateCard.tsx` | Renders `previewImageUrl` (image) with a download button, falling back to `imageUrl` → `htmlContent` (sanitized SVG). Badge "Credential" on the visual. |
| E3 | Frontend | `StudentDashboard.tsx` | Passes the backend `previewImageUrl` straight through (removed the non-firing per-credential template fetch; `API_CONFIG` import dropped). |

**Result:** students now see the actual issued certificate image (the designed template rendered to PNG) in the wallet, with a download link — satisfying "the certificate image must be displayed in a wallet or student portal."

**Note (deferred, optional):** to also show the live editable SVG in the library/wallet, add a `templateId` column to `Certificate` + persist it in `issueCertificate`, and return `templateHtml` in the wallet DTO. Not required for the image to display (preview PNG already does).

**Verification:** `cert_backend` `tsc --noEmit` exit 0; frontend `tsc --noEmit` exit 0; `vite build` success.

## 15. Refactor Batch #6 — Enterprise Verification Architecture (privacy-by-design)

Enforced the Enterprise Trust Gateway model: `cert_backend` = credential
system-of-record; EVF = the ONLY external verification gateway with a
Presentation Policy that decides disclosure per mode. Previously EVF's
`validateCredential` / `identity.validation` copied `recipientName` / `grade`
into every result regardless of mode, so a **public QR scan leaked the student
name + grade**. Public Layer contract documented in
`ENTERPRISE_VERIFICATION_ARCHITECTURE.md` (repo root).

### Changes
| # | Layer | File(s) | What |
|---|---|---|---|
| F1 | Backend | `fast-verification.service.ts` | Added `PublicVerificationView` interface + `verifyCertificatePublic()` that projects to the minimal Public Layer (existence, issuer, credential type, issued year, revoked). No holder identity/grade/dates. |
| F2 | Backend | `certificates.controller.ts` | The three anonymous `GET /api/certificates/verify/{id\|ipfs\|token}` routes now return `verifyCertificatePublic()` (defense-in-depth: direct backend hit can never leak PII). |
| F3 | EVF | `engine/presentation-policy.ts` | `viewForMode()` + `projectPackage()` — `public` mode redacts `holder` (name/did/email/wallet), `grade`, exact `completionDate` (kept as issued year), `ipfsHash`; other modes return full evidence package. |
| F4 | EVF | `response/response-builder.service.ts` | `buildResult()` now applies `projectPackage(pkg, mode)` before assembling the `VerificationResult`. |
| F5 | Frontend | `lib/api.ts` | Added `api.verifyPublicCertificate(id)` → backend public minimal route. `api.verifyCertificate(id, {mode})` (merged) routes to EVF proxy for authorized employer disclosure. |
| F6 | Frontend | `components/CertificateVerification.tsx` | Public verify page now uses `verifyPublicCertificate` and renders only Credential Type / Issuing Authority / Issued Year / Status — **no Recipient row**. Handles both legacy and Public Layer shapes. |
| F7 | Frontend | `pages/employer/verify.tsx` | Employer verify now goes through EVF proxy `mode:'api'` (full authorized attributes); `normalizeCredential` maps EVF `issuer/holder/credential` → legacy field names. |

**Result:** public scans disclose zero PII; employer verifies with full
authorized attributes via the gateway; backend external surface is minimal by
default. Data model is now consistent across all four layers.

**Verification:** `cert_backend` `tsc --noEmit` exit 0; `verification-framework` `tsc --noEmit` exit 0; frontend `tsc --noEmit` exit 0; `vite build` (from `educreds-frontend`) success.

## 16. Phase 0 — Workspace Architecture (the missing foundational layer)

Per the corrected enterprise vision: **one platform, six workspaces, one trust
engine.** Before any nav/visual refactor, we established *who* is using the
platform (Workspace Resolver + Capability Matrix) so navigation is generated
from data instead of one hardcoded nav trying to serve everyone.

### New files
| File | What |
|------|------|
| `client/src/lib/workspaces.ts` | 6 `WorkspaceDef`s (institution / student / verifier / government / developer / admin) + `getWorkspacesForUser(user)` deriving membership from `AuthType` (+ session override for dev/backend claims). |
| `client/src/lib/capabilityMatrix.ts` | The single source of truth: per-workspace `NavCapability[]` (primary + secondary), with institution tier restrictions (Tier 1 full connectors / Tier 2 hybrid / Tier 3 simplified). No blockchain/NFT/OID4VC/EVF/ETA labels. |
| `client/src/lib/useActiveWorkspace.ts` | Resolver hook: 0 workspaces→not authed; 1→auto-active; >1→show picker. Persists active ws in sessionStorage. Reads `?ws=verifier,government` for dev/testing. |
| `client/src/components/WorkspaceSelector.tsx` | Azure-style "Select Workspace" tile screen. |

### Changes
| # | File | What |
|---|------|------|
| G1 | `client/src/App.tsx` | Imported resolver + selector; `AppContent` now gates multi-workspace authed users with the picker before rendering routes (non-destructive — single-workspace users skip it, behaviour unchanged). |
| G2 | `client/src/components/AppSidebar.tsx` | `getNavData(tier)` now GENERATED from `getCapabilitiesForWorkspace('institution', tier)` — proving nav is matrix-driven and tier-collapses (Tier 3 shows no Integrations; Tier 1/2 show full connector surface). |

### Behaviour
- Dev user (`VITE_BYPASS_AUTH`, institution, enterprise-connector tier) → 1 workspace → no picker, identical to before. **Non-destructive.**
- `?ws=verifier,government` (dev) → 3 workspaces → Select Workspace screen appears; picking enters that workspace's home route.
- Institution nav now collapses by tier straight from the matrix.

**Verification:** frontend `tsc --noEmit` exit 0; `npm run build` success. (Stale dev server on :5002 confirmed the app still boots.)

## 17. Phase A — Workspace shells, palette, labels

Building on Phase 0's workspace layer, this phase makes the "who" layer
tangible and aligns the visual language to the enterprise vision.

### Changes
| # | File | What |
|---|------|------|
| A1 | `client/src/index.css` | Aligned palette to the vision exactly: primary `#0057FF`, secondary `#1E293B`, success `#16A34A`, warning `#D97706`, danger `#DC2626`, bg `#F8FAFC` (light `@theme` + `:root`). Flat, minimal. |
| A2 | `client/src/components/WorkspaceSwitcher.tsx` | NEW — Azure-style workspace switcher in the top bar. Shows active workspace; multi-workspace users get a dropdown to jump between workspaces (no logout). Single-workspace users see a static label. |
| A3 | `client/src/components/Layout.tsx` | Replaced the hardcoded "Institution Console" label with `<WorkspaceSwitcher />`. Header now reflects the active workspace. |
| A4 | `client/src/components/SystemArchitecture.tsx` | Softened residual "DAO + PoIC" / "DAO governs…" copy to "Governance + PoIC" / "EduCreds governs…". (The architecture page is a deliberate technical view; only user-facing framing was adjusted.) |
| A5 | `client/src/components/AppSidebar.tsx` | Already matrix-driven from Phase 0; nav labels are canonical (Identity / Credentials / Verification / Trust / Analytics / Integrations / Administration). No further label work needed. |

### Behaviour
- Institution workspace header now reads the workspace name and offers switching.
- Palette is the exact enterprise-blue vision spec.
- `?ws=verifier,government` dev override still triggers the Phase 0 picker; picking a workspace navigates to its home route.

**Verification:** frontend `tsc --noEmit` exit 0; `npm run build` success.

### Deferred to Phase B (net-new surfaces)
Resource-detail tab pattern, Identity module pages (Students huge table),
permission matrix component, mobile shell, real global-search results, and
per-workspace Layout shells for non-institution workspaces (currently they
render in the institution `Layout`; functionally correct, chrome will be matched
in Phase B).

## 18. Phase B — Net-new enterprise surfaces

Built on the connected workspace layer (Phase 0/A + WORKSPACE_CONNECTIONS.md),
these surfaces plug into existing routes/nav — no orphan components.

### New files
| File | What |
|------|------|
| `client/src/components/QuickCreateButton.tsx` | Azure-style "Create" dropdown, workspace-scoped catalog (`QUICK_CREATE` per workspace). Wired into `Layout` header next to search. |
| `client/src/components/ResourceTabs.tsx` | Reusable Azure resource-tab primitive (one URL, tabs). Used by the institution overview. |
| `client/src/pages/institution/overview.tsx` | Institution resource view: Overview cards + tabs (Students / Credentials / Trust / Integrations / Activity / Settings) linking to real pages. |
| `client/src/components/StudentsTable.tsx` | Identity module Students huge table (search, name, wallet, status, claims, actions) reusing `api.getCertificates` (real data). |
| `client/src/components/PermissionMatrix.tsx` | RBAC matrix (roles × capabilities) read-only visualization. |
| `client/src/components/MobileQuickActions.tsx` | Mobile bottom bar: Search / Verify / Wallet / Activity (route-connected, not feature parity). |

### Changes (wiring)
| # | File | What |
|---|------|------|
| B1 | `client/src/components/Layout.tsx` | Added `<QuickCreateButton />` and `<MobileQuickActions />`; extended header search with overview/students/permissions/workspace entries. |
| B2 | `client/src/App.tsx` + `capabilityMatrix.ts` | `/institution/overview` route + "Dashboard" group now has Overview/Home children. |
| B3 | `client/src/App.tsx` + `capabilityMatrix.ts` | `/institution/students` route + "Students" child under Identity nav. |
| B4 | `client/src/App.tsx` + `capabilityMatrix.ts` | `/institution/permissions` route + "Roles & Permissions" in institution secondary nav. |

### Behaviour
- Header now has Create (+) dropdown scoped to the active workspace.
- Institution > Dashboard > Overview opens the tabbed resource view.
- Identity > Students opens the real-data Students table.
- Administration/Settings area exposes the RBAC matrix.
- Mobile shows a quick-action bar; desktop shows the full console.

**Verification:** frontend `tsc --noEmit` exit 0; `npm run build` success.

### Deferred to Phase C (polish)
Dashboard cards wired to real `/api/stats` (no fake stats) — the overview cards
currently use representative static values; connect to live stats feed.
Verification/Trust dashboard flagship cards (trust accuracy, fraud detection,
PoIC radar) — reuse EVF trust/risk once surfaced. Permission matrix grants are
mocked; source from the RBAC service when available.

## 19. Phase C — Experience polish (live data)

Close-out of the enterprise SaaS plan: wire dashboard cards to real data and
confirm the trust flagship uses live trust signals.

### Changes
| # | File | What |
|---|------|------|
| C1 | `client/src/pages/institution/overview.tsx` | Overview cards now fetch live `/api/stats` (`poicScore`, `monthlyIssuance`, `totalStudents`, `activeCertificates`) via `useQuery`. No fake stats; cards render "—" gracefully when the backend is unavailable (dev bypass). |
| C2 | Trust flagship (existing) | Confirmed `compliance/enterprise-overview` already surfaces real `poicScore` (Profile-of-Institutional-Credibility, /1000, healthy ≥700). No change needed — trust signals are live, not mocked. |

### Notes / deferred
- The vision's "Verification Overview" cards (Requests Today, API Calls, Avg
  Time, Trust Accuracy, Fraud Detection, Recent Employers) require an EVF
  aggregate endpoint per institution. EVF already returns `trust.level` /
  `risk.score` on individual verifications (employer flow), but there is no
  institution-scoped trust-summary endpoint yet. Adding those cards depends on
  that backend aggregate — left as a backend follow-up, not faked here.
- Permission matrix grants (B4) remain mocked pending the RBAC service.

**Verification:** frontend `tsc --noEmit` exit 0; `npm run build` success.

---

# Status: Phases 0–C complete

The enterprise "operating system for educational trust" foundation is in place:
- **Phase 0** Workspace layer (Resolver + Capability Matrix + 6 workspaces + tier collapse).
- **Phase A** palette `#0057FF` + workspace switcher + canonical labels.
- **Connection fix** login → `/select-workspace` (was bypassing the gate); documented in `docs/WORKSPACE_CONNECTIONS.md`.
- **Phase B** Quick Create, resource tabs, Students table, RBAC matrix, mobile bar, search.
- **Phase C** live stats on overview; trust flagship already live.

All changes verified with `tsc --noEmit` + `npm run build`. Backend privacy
architecture (Batch #6) preserved end-to-end.

## 20. Backend follow-up — live trust-summary + RBAC matrix

Implements the two Phase C backend dependencies so the enterprise surfaces use
real data instead of mocks.

### cert_backend
| # | File | What |
|---|------|------|
| D1 | `modules/institutions/trust-summary.service.ts` | NEW — `getTrustSummary(institutionId)` aggregates PoIC score (`PoICScoringService.calculatePoICScore`), trust signals (`calculateAllSignals`), and live counts (`StatsService.getStats`) into `{ poicScore, trustAccuracy, fraudDetection, revocationRate, verificationVolume, avgConfidence, signals }`. Powers the Verification Overview / Trust dashboard cards. |
| D2 | `modules/institutions/institutions.controller.ts` + `institutions.module.ts` | `GET /api/institutions/trust-summary` (guarded `auth: 'institution'`, returns own summary). Registered `TrustSummaryService`; imported `StatsModule` + `Certificate` entity. |
| D3 | `modules/auth/rbac.service.ts` | NEW — canonical role × capability grant map (9 roles × 10 capabilities) + `getMatrix()` / `hasCapability()`. |
| D4 | `modules/auth/rbac.controller.ts` + `auth.module.ts` | `GET /api/auth/rbac/matrix` (static reference) + `POST /api/auth/rbac/check`. Registered `RbacService`/`RbacController`. |

### educreds-frontend
| # | File | What |
|---|------|------|
| D5 | `client/src/lib/api.ts` | Added `getRbacMatrix()` and `getTrustSummary()` (auth headers, cert_backend base). |
| D6 | `client/src/components/PermissionMatrix.tsx` | Now fetches `/api/auth/rbac/matrix` (real grants) instead of mock `GRANTS`. |
| D7 | `client/src/pages/institution/overview.tsx` | Overview now also shows **Trust Accuracy** and **Fraud Detection** cards from `getTrustSummary()`. |

### Notes
- Trust summary derives trust accuracy from PoIC `issuanceAccuracy` and fraud
  detection from `100 - aiRiskScore` — same EVF/PoIC signals, no new event store.
- RBAC matrix is the server-side source of truth; frontend `PermissionMatrix`
  no longer carries hardcoded grants.

**Verification:** `cert_backend` `tsc --noEmit` exit 0; `educreds-frontend` `tsc --noEmit` exit 0; `npm run build` success.

## 21. Verify split — Public Layer vs Advanced (Employer / Agency Verifier)

Separates anonymous basic verification from authenticated, attribute-disclosing
verification as requested. Government agency verifier reuses the advanced page
(no separate route yet).

### Public Layer — `/verify` (`pages/verify.tsx` → `CertificateVerification`)
| # | File | What |
|---|------|------|
| E1 | `components/CertificateVerification.tsx` | Removed the **Evidence (EVF)** tab and the direct `handleEvfVerify` / `EvfResultView` (EVF feature). The component is now the PUBLIC LAYER only. |
| E2 | `components/CertificateVerification.tsx` | `handleVerify` now routes every lookup (IPFS / token / cert ID) through `api.verifyPublicCertificate` (anonymous backend route) → minimal `PublicVerificationView` (existence + issuer + type + issued year + revoked). No PII. |
| E3 | `components/CertificateVerification.tsx` | Header now labelled "Public Verification" with a **Public Layer** badge + a link to advanced (`/employer/verify`). Wording: no personal data disclosed. |

### Advanced — `/employer/verify` (Employer / Agency Verifier workspace)
| # | File | What |
|---|------|------|
| E4 | `App.tsx` | Route `/employer/verify` now lazy-loads the real `pages/employer/verify.tsx` (previously a stub `verification-portal.tsx` that just re-rendered `CertificateVerification`). Stub deleted. |
| E5 | `pages/employer/verify.tsx` | Title changed to **"Employer / Agency Verifier"**; subtitle states advanced EVF attribute disclosure. |
| E6 | `pages/employer/verify.tsx` | Gated behind `DualAuth.isAuthenticated()`: search buttons disabled + a "Sign in to run advanced verification" card with a Sign-in CTA when unauthenticated. `handleSearch` bails with a prompt if not signed in. |
| E7 | `lib/api.ts` (existing) | Advanced path uses `api.verifyCertificate(id, { mode: 'api' })` via the EVF proxy — full authorized attributes (the same flow serves employer and government agency verifiers). |

### Effect
- `/verify` = anonymous, basic, EVF-free. `/employer/verify` = authenticated advanced EVF (employer **and** government agency). No dedicated government route needed for now.

**Verification:** `educreds-frontend` `tsc --noEmit` exit 0; `npm run build` success.

## 22. Unified enterprise verification UX

Single, consistent enterprise look across the verification flow; public verify is
the primary page with an in-page link to advanced verification.

| # | File | What |
|---|------|------|
| F1 | `components/CertificateVerification.tsx` (`/verify`) | The public enterprise page now carries a prominent **"Advanced Employer Verification"** button (black, rounded-2xl, uppercase) linking to `/employer/verify`. Public Layer still EVF-free, anonymous. |
| F2 | `pages/employer/verify.tsx` (`/employer/verify`) | Restyle to match the enterprise `CertificateVerification` aesthetic: centered `max-w-4xl` hero with `ShieldCheck` badge, title "Advanced Verification", `rounded-[40px] shadow-2xl` cards, neutral primary palette (removed blue/amber Bootstrap-ish boxes). Sign-in gate + search buttons use the same black enterprise button style. |
| F3 | `pages/employer/verify.tsx` | Header label "Employer / Agency Verifier" → "Advanced Verification" with "Advanced · Employer / Agency" pill; imports `ShieldCheck`. |

Result: only one verification surface style (enterprise). `/verify` = public basic;
its CTA opens `/employer/verify` = advanced EVF (employer + government agency).

**Verification:** `educreds-frontend` `tsc --noEmit` exit 0; `npm run build` success.
