# Phase 3 — Execution Plan

Owner: Edyelu Andrew
Brief: `ANDREW_ASSIGNMENT.md` (Phase 3 — Integration UX & Developer Portal)
Branch: `feat/phase3-integration-devportal`, currently at `origin/main` `93d1ad7`
Written: 2026-10-06

This plan supersedes the task breakdown in the brief wherever the brief has gone
stale. The brief was written on 2026-08-18 and `main` has advanced 263 commits
since then. Read this document alongside the brief rather than instead of it.

---

## Baseline — what already exists

Most of the brief is already built. The following was established by reading the
files as they stand, not by trusting the brief's description of them.

Deliverable 1, the four-step SIS wizard in
`modules/integration/ConnectorPage.tsx`, is written but not committed. It exists
as uncommitted changes in the working tree, roughly 707 insertions against 400
deletions in that file, plus 65 added lines in `services/connector.ts` providing
`getSisSchema`, `DEFAULT_SIS_FIELDS` and `SisSchemaResponse`. The version
committed on `93d1ad7` is still the old form-based page that imports
`ConnectorForm`.

The uncommitted wizard declares `type WizardStep = 1 | 2 | 3 | 4` and implements
tier-aware option cards, Docker guidance with downloadable `docker-compose.yml`
and `.env` templates, a real `Test Connection` call, a field-mapping table, and
an activation step with live checks. It is not the "form that dumps connector
configuration fields" the brief describes.

This distinction matters for sequencing. Deliverable 1 is not waiting to be
built; it is waiting to be reviewed and committed. Nothing in it is safe from an
accidental checkout or stash until that happens, so Stage 1 below is to get it
onto the branch.

Deliverable 2A, the developer dashboard at `pages/developer-portal/index.tsx`,
is built and wired to live data, but it presents different metrics from the ones
the brief specifies.

Deliverable 2B, API key management, is built in
`pages/developer-portal/components/ApiKeyCard.tsx` with three gaps described in
section 3.3 below.

Deliverable 2C, the API Explorer at `pages/developer-portal/api-explorer.tsx`,
is built and exceeds the brief. It covers roughly 22 endpoints across
Credentials, Verification, Institutions, Students and Webhooks, rather than the
three endpoints requested. It also uses the real backend paths such as
`/api/verify-proxy/verify` instead of the `/v1/evf/verify` paths named in the
brief. Keep the real paths.

Deliverable 2D, webhook delivery history, is the only item not built at all.
`pages/institution/webhooks.tsx` has list, add, delete and test, but no delivery
history.

The work is therefore no longer to build Phase 3. It is to close the remaining
gaps in Phase 3 and fix what is broken inside it. That is a smaller and sharper
job than the brief implies.

---

## Stage 0 — Pre-flight

None of this is code. Complete it before writing anything, so that you are not
debugging your environment later.

### Install and boot

```bash
cd educreds-frontend
npm install
npm run dev          # http://localhost:5000
```

### Learn the tier switch

You do not need three separate accounts to exercise the three deployment tiers.
`useAuth.ts` builds a development institution user whose `deploymentTier` is
taken from `VITE_BYPASS_AUTH_TIER`, defaulting to `enterprise-connector`:

```
VITE_BYPASS_AUTH_TIER=workspace|cloud-connector|enterprise-connector
```

This is how you verify the Stage 1 guard fix and the three distinct Step 2
branches.

### Record the TypeScript baseline

`npx tsc --noEmit` currently fails with eight pre-existing errors, none of them
in Phase 3 files:

- `components/institution/BulkCSVUploader.tsx` reports `Cannot find module 'xlsx'`,
  which is a missing dependency rather than a type error
- `lib/capabilityMatrix.ts` lines 266 and 269 report `allowedTabs` possibly null,
  three times
- `pages/student/dashboard.tsx` line 97 reports `credentialsCount` missing from
  `StudentMe`
- `pages/verify/card.tsx` lines 249 to 251 report `degree`, `graduationDate` and
  `institution` missing from the attributes type, three times

The brief states that this check must pass before each commit. It cannot pass
today, and repairing those files is outside your scope, since
`capabilityMatrix.ts` is explicitly off-limits. Your practical gate is therefore
that you introduce no new errors and leave zero errors in the files you touch.
Agree this baseline with Eragon rather than assuming it.

### Send the backend requests

The four endpoint requests in Stage 4 have lead time and three of them block
Stage 3. Send them on day one rather than waiting until you reach that stage.

---

## Stage 1 — Commit the wizard, then fix the tier guard

### 1.1 Get the uncommitted wizard onto the branch

The wizard and its `getSisSchema` support code are currently untracked work in
the working tree. Before anything else, read the diff, satisfy yourself that it
is the work you want to own, and commit it on
`feat/phase3-integration-devportal`:

```bash
git diff educreds-frontend/client/src/modules/integration/ConnectorPage.tsx
git diff educreds-frontend/client/src/services/connector.ts
```

Commit the two files together, since the page will not compile without the
service additions. Until this is committed, a stray `git checkout`, `git stash`
or branch switch destroys the whole of Deliverable 1.

### 1.2 Fix the tier guard

This comes next because the bug makes a third of Deliverable 1 unreachable, so
you cannot verify or demonstrate the wizard until it is resolved. It also costs
roughly ten minutes.

`App.tsx` line 339 gates the wizard route to two tiers:

```tsx
<Route path="/connect/connector" element={
  <ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout>
    <TierGuard allowedTiers={['cloud-connector', 'enterprise-connector']}>
      <IntegrationConnectorPage />
    </TierGuard>
  </Layout></ProtectedRoute>} />
```

`ConnectorPage.tsx` nonetheless contains a complete Tier 3 branch, keyed on
`step === 2 && selectedKind === 'workspace'`, lists `workspace` in
`CONNECTION_OPTIONS`, and defaults `currentTier` to `'workspace'`. A
workspace-tier institution can never reach the page, so that branch is dead code
sitting behind a guard.

This contradicts two items on the brief's own completion checklist: that the
four-step wizard renders correctly for all three tier options, and that the
Tier 2 and Tier 3 flows are distinct. Two resolutions are defensible, and the
choice belongs to Eragon:

1. Add `'workspace'` to `allowedTiers`, which makes the existing Tier 3 copy
   reachable and lets the checklist pass as written.
2. Delete the `workspace` branch and option, if workspace institutions are
   deliberately meant to use the SIS pages rather than a connector wizard.

Do not guess between them. This is a product decision about who sees the page.

---

## Stage 2 — First pull request: close the Integration wizard

Scope is `modules/integration/ConnectorPage.tsx`, `services/connector.ts`, and
the route line in `App.tsx`. Four items, in the order given.

### 2.1 Wizard commit and tier guard

Carry in both Stage 1 fixes.

### 2.2 Confirm the Institution ID shown to the user

`ConnectorPage.tsx` line 141 reads:

```tsx
const institutionId = user?.id || '';
```

`useAuth()` returns no separate `institutionId` field. The user object is
`{ id, email, name, type, walletAddress, isVerified, deploymentTier,
connectorApiUrl, connectorEndpoint, eduCredsId }`, so `user.id` is the only
candidate available and is very likely correct for an institution session.

The API calls are not at risk, because `getConnectorConfig` and
`updateConnectorConfig` both accept the identifier as `_institutionId` and ignore
it, deriving the institution from the bearer token instead. The exposure is
therefore narrower than it first appears. Three places use the value for real:

- it is displayed to the user as their Institution ID, in step 2, item 3
- it is baked into the downloaded `.env` as `EDUCREDS_INSTITUTION_ID`
- it forms the `saveFieldMappings` localStorage key

A wrong value in those places means IT teams install connectors with a bad
identifier. One confirmation against a real institution login is enough. Do not
refactor this speculatively.

### 2.3 Persist field mappings server-side

`saveFieldMappings` in `services/connector.ts` line 452 writes only to
`localStorage`:

```ts
export const saveFieldMappings = (institutionId: string, mappings: ConnectorFieldMapping[]): void => {
  localStorage.setItem(fieldMappingStorageKey(institutionId), JSON.stringify(mappings));
};
```

The mapping is configuration that the connector itself needs, so browser-local
storage is the wrong home for it: the value is lost when the cache is cleared,
it is invisible to the backend, and it does not follow the user to another
browser. The checklist item stating that the field mapping step renders and
saves correctly is only half met. This needs
`PATCH /api/institutions/connector/field-mappings`, listed as request 1 in
Stage 4. Until that exists, keep `localStorage` as a draft cache and layer the
API call on top of it rather than removing it.

### 2.4 Restore connector-config.yaml generation (done)

The wizard's on-premise step now downloads three files: `docker-compose.yml`,
`.env`, and `connector-config.yaml`. Compose mounts the YAML at
`/etc/educreds/connector-config.yaml`, which is the path the on-prem agent
reads. The YAML is generated from `buildConnectorConfigYaml` with PostgreSQL
defaults (or a saved advanced profile if one exists).

An "Advanced technical setup" disclosure re-exposes `ConnectorForm` with
`hideCoreRouting`, so IT can change the database adapter, SQL mapping, and
host-side security without seeing a second copy of the wizard's tier and
endpoint controls. Docker command blocks stay hidden in that mode; the wizard
already covers them in plain language.

This was previously listed as a delete of `ConnectorForm`. That would have
permanently removed YAML generation. The form stays.

### Definition of done for the first pull request

All three tiers render and advance through steps 1 to 4. `Test Connection`
succeeds against a running connector and shows the troubleshooting path on
failure. Mappings survive both a hard refresh and a different browser.
`tsc --noEmit` reports no errors in the files you touched.

---

## Stage 3 — Second pull request: close the Developer Portal

Ordered so that the cheapest and least blocked work comes first, which keeps the
pull request substantial even if the backend requests land late.

Items 3.1 and 3.2 are done, in commits `1885af1` and `4e8b405`. The notes below
are retained as the record of what was wrong and why.

### 3.1 Repair the webhooks page before extending it

`pages/institution/webhooks.tsx` makes unauthenticated, relative-path calls:

```ts
const res = await fetch("/api/institutions/me/webhooks");
```

There are two problems here. No `Authorization` header is sent, and the URL is
relative, so in the deployed static-site configuration it resolves against the
frontend host rather than the API. For comparison, `services/connector.ts` uses
`API_CONFIG.INSTITUTIONS.BASE` together with a bearer token from
`getAnyAuthToken()`. The page is very likely non-functional in any environment
without a development proxy. Fix this before anything else in this stage, since
adding a delivery-history tab on top of broken fetches would only conceal the
problem.

Note also that `modules/workspace/WebhooksPage.tsx` is a single-line re-export
of this same file, so there is one real page here, not two.

### 3.2 Webhook delivery history

This is Deliverable 2D and the only wholly missing item in the brief. Add a
`Tabs` split between "Configured", which is today's list, and "Delivery
History". Each history row should carry a timestamp, the event name, the
response status, and a detail view, with a retry action on failures. This needs
`GET /api/webhooks/:id/deliveries`, listed as request 2 in Stage 4. If that is
not ready, follow the brief and render a realistic mock shape with a
`// TODO: wire to /api/webhooks/:id/deliveries` comment.

### 3.3 Close the API key gaps

`ApiKeyCard.tsx` masks the key correctly, rendering
`{apiKey.prefix}••••••••••••••••`, and offers Copy and Revoke behind a
confirmation dialog. Three items from the brief are missing.

Rotate has neither UI nor a client method. `developerPortalApi` exposes only
`getKeys`, `generateKey` and `revokeKey`, so this needs a backend route, listed
as request 3 in Stage 4.

Scopes are not displayed. The brief asks for `verify`, `batch_verify`, `issue`,
`webhooks`, `identity` and `admin`. The `ApiKey` interface has no `scopes`
field, so this needs the type, the API response, and the badges.

Reveal does not exist. The "Copy Key Prefix" button only ever copies the prefix,
which is not a usable key. Either add the confirmation-gated reveal the brief
specifies, or, if the backend genuinely cannot return the secret after creation,
which is the correct security posture, relabel the button honestly and explain
the decision in the pull request. Do not leave a button that appears to copy a
key but does not.

### 3.4 Dashboard metrics

`index.tsx` is wired to real data for subscription status and keys, but the third
card reads:

```tsx
{activeKeys.length > 0 ? "Tracked per key" : "—"}
```

The brief asks for API Requests, Errors and Latency p99, drawn from
`/api/developer/usage`. That route does not exist.
`server/routes/developer-portal.ts` defines only `GET /keys`, `POST /keys`,
`DELETE /keys/:id` and `GET /subscription-status`. Either wire the three metrics
to a new endpoint, listed as request 4 in Stage 4, or render an em dash with a
TODO comment, following the brief's own rule against invented numbers. Two
further pieces of 2A are also absent: the API Health indicator and the
"Your Applications" block with its Production and Sandbox entries.

### 3.5 Surface the pages in navigation

`AppSidebar.tsx` line 55 gives the developer workspace exactly one entry:

```ts
developer:[{ label: "Settings",    href: "/developer-portal"  }],
```

Both `/developer-portal/api-explorer` and `/developer-portal/usage` are routed,
at `App.tsx` lines 287 and 288, but they are reachable only by typing the URL
directly, and the single existing entry is mislabelled as "Settings". Navigation
is generated from `capabilityMatrix.ts`, which the brief forbids you from
restructuring, so raise this rather than editing it, or confirm with Eragon that
adding entries without changing the structure falls within scope. A finished API
Explorer that nobody can navigate to is worth very little.

### Definition of done for the second pull request

Webhook list, add, delete and test all work against the real API with
authentication. Delivery history renders either real data or clearly marked mock
data. Key cards display scopes and offer rotation. Dashboard metrics are either
live or honestly blank. `tsc --noEmit` reports no errors in the files you
touched.

---

## Stage 4 — Backend requests

The brief instructs you to raise missing endpoints immediately rather than
invent them. All four below are confirmed absent, so send them to Abdulmajid on
day one.

1. `PATCH /api/institutions/connector/field-mappings`, to persist the Step 3
   mapping. Blocks item 2.3.

2. `GET /api/institutions/me/webhooks/deliveries`, to expose delivery history.
   This is smaller than it first appears, and smaller than the brief implies.
   The data already exists: `webhook.service.ts` writes every attempt to the
   `webhook_delivery_logs` table via the `WebhookDeliveryLog` entity, with
   `eventType`, `targetUrl`, `payload`, `attempt`, `statusCode`, `success`,
   `errorMessage`, `latencyMs` and `createdAt`, retained for
   `WEBHOOK_LOG_RETENTION_DAYS`. Nothing exposes it over HTTP. So the request is
   a read endpoint over an existing table, not a new feature.

   Note also that the brief's suggested shape, `GET /api/webhooks/:id/deliveries`,
   does not fit the schema. Those rows are keyed by `institutionId` and
   `targetUrl`, with no webhook id, so the natural endpoint is institution-scoped
   with an optional `targetUrl` filter. The frontend in item 3.2 is already
   written against the entity's field names.

   If a manual replay control is wanted, that needs a second endpoint. The
   service retries internally up to `WEBHOOK_MAX_ATTEMPTS` but exposes no way to
   re-fire a specific delivery.

3. `POST /api/developer-portal/keys/:id/rotate`, together with a `scopes` field
   on the key payload. Blocks item 3.3.

4. `GET /api/developer/usage`, returning request count, error count and p99
   latency. Blocks item 3.4.

Separately, confirm the status of
`GET /api/institutions/connector/sis-schema`. `services/connector.ts` line 422
already carries a TODO for it and falls back to six hardcoded field names, which
means Step 3 currently offers the same fixed list to every institution
regardless of what their SIS actually contains.

---

## Why this order

Committing the wizard precedes everything because it is currently uncommitted
work that any branch operation would destroy. The tier guard follows immediately
because it is the difference between being able to see the wizard in all three
tiers and not being able to see it at all.

Stage 2 precedes Stage 3 because the brief mandates one pull request per
deliverable and the first one is nearly finished. Shipping it starts the review
cycle while backend work is still landing.

Within Stage 3, the webhooks authentication fix precedes the delivery-history
feature so that the new tab is built on working fetches rather than on top of
calls that silently fail.

Stage 4 is scheduled during Stage 0 because three of its four items gate Stage 3
work.

---

## Out of scope

Per the brief: the authentication system, the structure of
`capabilityMatrix.ts`, `lib/dualAuth.ts`, `TierGuard` and `ProtectedRoute`. No
new npm packages without asking first. No `@ts-nocheck` in anything you write.
