# EduCreds Governance: Institution Approval and PoIC Bootstrap

Canonical governance logic for institution approval, initial PoIC score assignment, and voting power in EduCreds.

---

## 1. The approval body: EduCreds Governance Council

Institution approval is handled by the EduCreds Governance Council, not a public token DAO.

Eligible voting members:
1. Verified institutions holding an Institution Identity NFT (IIN)
2. EduCreds Foundation / Core DAO via multisig (bootstrap phase)
3. Independent verifiers — accreditation bodies, auditors, NGOs (later phase)

Students and random token holders do not vote. Institution legitimacy is not a popularity contest.

---

## 2. Voting power

Voting power is reputation-weighted, not token-weighted.

```
Voting Power = Base Weight × Credibility Score × Age Factor
```

- Base weight — assigned at IIN mint (equal for all initially)
- Credibility score — derived from PoIC score (0–100)
- Age factor — time-decay multiplier rewarding established institutions

---

## 3. PoIC bootstrap

New institutions have no historical data. Initial PoIC score is established from:
1. Trust Agent AI assessment (domain, registration, faculty, infrastructure signals)
2. Governance Council human review for scores in the 50–84 range
3. Foundation multisig override during bootstrap phase

Bootstrap score bands:

| Score | Action |
|---|---|
| >= 85 | Auto-approved; IIN minted; full issuance capacity |
| 60 – 84 | Queued for DAO vote; limited capacity until approved |
| < 60 | Rejected; institution must remediate and reapply |

---

## 4. PoIC dimensions

| Dimension | Weight | What it measures |
|---|---|---|
| D1 — Legal and accreditation | 25% | Government registration, accreditation credibility and stability, legal risk |
| D2 — Operational authenticity | 20% | Website longevity, faculty verifiability, registry consistency, student body evidence |
| D3 — Issuance behaviour | 25% | Issuance volume stability, entropy, anomaly detection, revocation ratio |
| D4 — Verification and feedback | 15% | Verification rate, verifier diversity, reverification, failure rate |
| D5 — Governance and disputes | 15% | Base credibility score adjusted for dispute count and severity |

Note: Institutions do not self-report PoIC dimension values. The Trust Agent computes all dimensions from objective signals.

---

## 5. On-chain governance flow

```
1. Trust Agent scores institution (PoIC bootstrap)
2. Score > 60: Governance proposal created on-chain
3. IIN holders vote (reputation-weighted, 7-day window)
4. Passed: GovernanceDAO queues execution
5. After timelock: ExecutionController mints IIN
6. Institution begins issuing under PoIC capacity tier
```

---

## 6. Ongoing PoIC updates

- D3 behavioral scoring: recomputed each monitoring cycle (MonitoringService)
- D5 dispute adjustments: updated automatically when a governance dispute resolves
- AI behavioral risk: Trust Agent analyzes issuance patterns and emits anomaly alerts for HIGH/CRITICAL deviations
- On-chain anchoring: PoICRegistry.updateInstitutionScore() called after each update

---

## 7. Issuance capacity tiers

| PoIC Score | Tier | Max issuances / month |
|---|---|---|
| 80–100 | EXTENDED | 10 000 |
| 70–79 | MONITORED | 5 000 |
| 50–69 | RESTRICTED | 1 000 |
| < 50 | SUSPENDED | 0 |

---

## 8. Smart contract addresses (environment variables)

| Variable | Contract |
|---|---|
| `INSTITUTION_NFT_ADDRESS` | InstitutionIdentityNFT |
| `CREDENTIAL_ISSUER_ADDRESS` | CredentialIssuer |
| `POIC_REGISTRY_ADDRESS` | PoICRegistry |
| `GOVERNANCE_DAO_ADDRESS` | GovernanceDAO |
| `EXECUTION_CONTROLLER_ADDRESS` | ExecutionController |

Full interface freeze and on-chain data policy: `cert_backend/src/modules/blockchain/contracts/interface-freeze.ts`
