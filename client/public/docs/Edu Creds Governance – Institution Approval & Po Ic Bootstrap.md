# EduCreds Governance: Institution Approval & PoIC Bootstrap

This document records the **canonical governance logic** for how institutions are approved, how initial PoIC scores are assigned, and how voting power works in EduCreds.

This exists to:

* Prevent future design drift
* Align human contributors and AI agents
* Serve as a reference for audits, whitepapers, and implementations

---

## 1️⃣ The Approval Body: EduCreds Governance Council

The approval mechanism is **not a public token DAO**.
It functions more like a **jury**, not a parliament.

### Eligible Voting Members

Only wallets that meet **at least one** condition may vote on institution approvals:

1. **Verified Institutions**

   * Must already hold an **Institution Identity NFT (IIN)**

2. **EduCreds Foundation / Core DAO**

   * Operates via multisig during bootstrap
   * Temporary safety + continuity role

3. **Independent Verifiers (optional, later phase)**

   * Accreditation bodies
   * Auditors
   * NGOs or regulators

❌ Students do not vote
❌ Random token holders do not vote

> Institution legitimacy is **not a popularity contest**.

---

## 2️⃣ How Voting Power Is Calculated (Reputation-Weighted)

Voting power is **not**:

* 1 wallet = 1 vote
* Token-weighted

Voting power is **reputation-weighted**.

### Conceptual Formula

```
Voting Power = Base Weight × Credibility Score × Age Factor
```

### A. Base Weight

| Voter Type           | Base Weight     |
| -------------------- | --------------- |
| Institution          | 1.0             |
| Foundation Multisig  | 1.5 (temporary) |
| Independent Verifier | 1.2             |

---

### B. Credibility Score (PoIC)

* Derived from **PoICRegistry**
* Updated via:

  * On-chain behavior
  * Verified feedback
  * Quack AI risk signals

Example:

* PoIC = 80 / 100 → multiplier = **0.8**

---

### C. Age Factor

Prevents newly admitted institutions from dominating governance.

| Institution Age | Factor |
| --------------- | ------ |
| < 3 months      | 0.5    |
| 3–12 months     | 0.8    |
| > 12 months     | 1.0    |

---

## 3️⃣ Institution Approval Flow (End-to-End)

### Step-by-Step

1. **Institution applies** (off-chain)

   * Legal docs
   * Domains
   * Accreditation proofs

2. **Quack AI analyzes** (off-chain)

   * Consistency checks
   * Registry verification
   * Risk assessment
   * Outputs:

     * Legitimacy score
     * Recommended initial PoIC
     * Issuance caps

3. **Governance proposal created**

   * "Approve Institution X"
   * Includes:

     * IIN minting
     * Initial PoIC assignment
     * Issuance limits

4. **Eligible voters vote**

   * Yes / No / Abstain

5. **Threshold met**

   * Example: ≥ 60% weighted approval

6. **Timelock execution**

   * Institution Identity NFT minted
   * Institution activated
   * Initial PoIC written on-chain

✅ No manual minting
✅ No admin buttons

---

## 4️⃣ Bootstrap PoIC (Cold Start Resolution)

### Important Clarification

* **PoIC is NOT an NFT**
* PoIC is a **registry-based reputation score**

### Bootstrap Rule

> Initial PoIC is **granted**, not earned.
> Future PoIC is **earned**, not granted.

For early institutions:

* DAO assigns a **conservative baseline PoIC**
* Lower issuance caps
* Lower governance influence

This resolves the reputation cold-start problem safely.

---

## 5️⃣ Why Existing Institutions Can Approve New Ones

This is safe because of **self-regulating constraints**:

### Safeguards

* Voting power caps
* Age factor penalties
* Collusion detection via Quack AI
* Fraud reports trigger disputes
* Bad approvals reduce approver PoIC

> If you approve bad actors, **you lose power**.

---

## 6️⃣ Role of Quack AI (Precisely Defined)

Quack AI **does NOT**:

* Vote
* Mint NFTs
* Override governance

Quack AI **DOES**:

* Analyze applicants
* Score risk and legitimacy
* Recommend PoIC ranges
* Simulate governance outcomes
* Trigger anomaly alerts

> Think of Quack AI as a **super-intelligent advisor**, not a ruler.

---

## 7️⃣ Canonical Governance Invariants

These rules must never be violated:

1. No issuance without IIN
2. No IIN without governance approval
3. No PoIC without registry record
4. No execution without timelock
5. No AI authority without DAO execution

---

**Status:** Canonical reference document
**Applies to:** EduCreds V2.0 and later
