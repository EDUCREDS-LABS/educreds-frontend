# EduCreds — Core Documentation

## 1. Platform overview

EduCreds is an enterprise credential infrastructure platform that enables educational institutions to issue, govern, and verify academic credentials on-chain using W3C Verifiable Credentials, decentralised identifiers (DIDs), and blockchain-anchored proof.

---

## 2. System architecture

EduCreds is organised into three deployment tiers, two core service planes, and a set of shared platform services.

### 2.1 Deployment tiers

| Tier | Name | Description |
|---|---|---|
| 1 | Enterprise On-Prem | Institution runs its own SIS / ERP / registrar database. The EduCreds Enterprise Connector is deployed inside the institution boundary and communicates with the platform via mTLS. |
| 2 | SIS Cloud External | Institution uses a cloud-based SIS or ERP. The Cloud Connector bridges the SIS API to the EduCreds platform over a secure authorised API channel. |
| 3 | EduCreds Workspace | Fully managed by EduCreds. Institution staff use the Workspace UI directly. No external system integration required. |

### 2.2 Core service planes

**EduCreds Backend API (`cert_backend`)**
- Auth and MFA
- Institutions and onboarding
- Certificates and issuance pipeline
- Templates and field mapping
- Governance (PoIC, proposals, disputes, DAO)
- Blockchain integration and W3C Credentials
- LMS import and sync
- Webhook and infrastructure services
- Provider registry and event-driven orchestration
- Queue and background processors

**EduCreds Trust Agent (`educreds_trust_agent`)**
- LLM-powered governance advice
- PoIC computation and behavioral risk scoring
- Credential and document verification
- Domain credibility assessment
- Governance tracing and observability

### 2.3 Shared platform services

- PostgreSQL — primary relational store
- Redis — queue broker and cache
- Azure Key Vault — secrets at rest
- Azure Application Insights + Log Analytics — observability
- IPFS (Pinata) — encrypted metadata and W3C VC storage
- Base / EVM smart contracts — on-chain credential proof and revocation

---

## 3. Key concepts

### Proof of Institutional Credibility (PoIC)

PoIC is a multi-dimensional reputation score (0–100) that determines an institution's trust level and issuance capacity.

| Dimension | Weight | Signals |
|---|---|---|
| D1 — Legal and accreditation | 25% | Government registration, accreditation credibility and stability |
| D2 — Operational authenticity | 20% | Digital footprint, faculty verifiability, registry consistency |
| D3 — Issuance behaviour | 25% | Stability, entropy, anomaly score, revocation ratio |
| D4 — Verification and feedback | 15% | Verification rate, diversity, reverification |
| D5 — Governance and disputes | 15% | Base score adjusted for dispute count and severity |

| Score | Status | Issuance capacity |
|---|---|---|
| 80–100 | APPROVE | 10 000 / month |
| 70–79 | APPROVE_WITH_MONITORING | 5 000 / month |
| 50–69 | RESTRICT | 1 000 / month |
| 0–49 | SUSPEND | 0 |

### Institution Identity NFT (IIN)

Each approved institution receives an IIN — an ERC-721 token minted on-chain after DAO governance approval. Only IIN holders can issue credentials.

### W3C Verifiable Credentials

All credentials are issued as W3C Verifiable Credentials signed with ES256 (ECDSA P-256). Sensitive student metadata is encrypted off-chain and only a SHA-256 hash is anchored on-chain.

### On-chain data policy

Only the following data is written on-chain: credential NFT ID, institution IIN ID, recipient wallet address, IPFS URI of the W3C VC, metadata hash, PoIC score, timestamps, and revocation status. Student PII (name, email, grades) is never written on-chain.

---

## 4. Institution onboarding flow

1. Institution registers via the EduCreds platform or API.
2. Trust Agent evaluates legitimacy via LLM analysis.
3. PoIC score is computed and submitted on-chain.
4. Governance Council votes (reputation-weighted).
5. If approved, Institution Identity NFT is minted.
6. Institution can begin issuing credentials up to their tier capacity.

---

## 5. Credential issuance flow

1. Institution submits issuance request (via Workspace UI, Connector API, or LMS sync).
2. Provider Registry routes the request to the correct data provider (Tier 1, 2, or 3).
3. Issuance Orchestration Service queues a `single-from-orchestrator` job.
4. CertificatesService creates student DID, encrypts metadata, generates W3C VC.
5. W3C VC and encrypted metadata are stored on IPFS.
6. Smart contract mints credential NFT with metadata hash and IPFS URI.
7. `CredentialIssuedEvent` is emitted — WebhookService notifies the institution.

---

## 6. Frontend modules

The `educreds-frontend` client is organised into three canonical module groups:

| Module group | Path prefix | Audience |
|---|---|---|
| Workspace | `/institution/*` | Tier 3 workspace institutions |
| Integration | `/connect/*` | Tier 1 and 2 connector institutions |
| Compliance / Governance | `/compliance/*` | All institution tiers |

---

## 7. CI/CD and environments

| Environment | Branch | Approval |
|---|---|---|
| Dev | `develop` | Automatic on merge |
| Staging | Manual dispatch | Staging environment gate |
| Production | Manual dispatch | 2 required reviewers |

---

## 8. Key repositories

| Repository | Purpose |
|---|---|
| `cert_backend/` | NestJS backend platform |
| `educreds_trust_agent/` | AI intelligence microservice |
| `educreds-frontend/` | React / Vite frontend client |
| `educreds-protocol/` | Smart contract interfaces |
| `educreds-infrastructure/` | Azure Bicep IaC templates |
| `documentation/` | All authoritative documentation |
