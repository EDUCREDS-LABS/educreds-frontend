/**
 * Unit tests for card-indicators.ts
 * Tests the three new indicator helpers:
 *   1. deriveVerificationSource
 *   2. deriveOnChainStatus
 *   3. deriveIssuerCredibility
 */

import { describe, it, expect } from "vitest";
import {
  deriveVerificationSource,
  deriveOnChainStatus,
  deriveIssuerCredibility,
} from "./card-indicators";

// ── 1. deriveVerificationSource ──────────────────────────────────────────────

describe("deriveVerificationSource", () => {
  it("returns registry_fallback when evfUnavailable=true", () => {
    const r = deriveVerificationSource({ evfUnavailable: true });
    expect(r.type).toBe("registry_fallback");
  });

  it("returns registry_fallback when verificationSource='fallback'", () => {
    const r = deriveVerificationSource({ verificationSource: "fallback" });
    expect(r.type).toBe("registry_fallback");
    expect(r.label).toBe("Registry Fallback");
  });

  it("includes fallbackReason in description when provided", () => {
    const r = deriveVerificationSource({
      evfUnavailable: true,
      fallbackReason: "Institution API timeout",
    });
    expect(r.description).toContain("Institution API timeout");
  });

  it("returns live_sync when verificationSource='evf'", () => {
    const r = deriveVerificationSource({ verificationSource: "evf" });
    expect(r.type).toBe("live_sync");
    expect(r.label).toBe("Live Institution Sync");
  });

  it("returns live_sync when engineUsed='evf'", () => {
    expect(deriveVerificationSource({ engineUsed: "evf" }).type).toBe("live_sync");
  });

  it("returns live_sync when engineUsed='evf_ai'", () => {
    expect(deriveVerificationSource({ engineUsed: "evf_ai" }).type).toBe("live_sync");
  });

  it("returns public_registry when verificationSource='public'", () => {
    const r = deriveVerificationSource({ verificationSource: "public" });
    expect(r.type).toBe("public_registry");
    expect(r.label).toBe("Public Registry");
  });

  it("returns public_registry when engineUsed='public'", () => {
    expect(deriveVerificationSource({ engineUsed: "public" }).type).toBe("public_registry");
  });

  it("returns unknown when no source fields are present", () => {
    expect(deriveVerificationSource({}).type).toBe("unknown");
  });

  it("prefers evfUnavailable=true over verificationSource='evf'", () => {
    // evfUnavailable overrides any source claim
    const r = deriveVerificationSource({
      evfUnavailable: true,
      verificationSource: "evf",
    });
    expect(r.type).toBe("registry_fallback");
  });
});

// ── 2. deriveOnChainStatus ───────────────────────────────────────────────────

describe("deriveOnChainStatus", () => {
  it("returns valid_onchain when positive tokenId is present", () => {
    const r = deriveOnChainStatus({ tokenId: 42, isValid: true });
    expect(r.status).toBe("valid_onchain");
    expect(r.description).toContain("42");
  });

  it("returns valid_onchain for string tokenId '17'", () => {
    expect(deriveOnChainStatus({ tokenId: "17" }).status).toBe("valid_onchain");
  });

  it("returns valid_onchain when isMinted=true (no tokenId)", () => {
    const r = deriveOnChainStatus({ isMinted: true, isValid: true });
    expect(r.status).toBe("valid_onchain");
  });

  it("returns valid_not_onchain when tokenId is null and credential is valid", () => {
    const r = deriveOnChainStatus({ tokenId: null, isValid: true });
    expect(r.status).toBe("valid_not_onchain");
    expect(r.label).toBe("Valid, Not On-chain");
  });

  it("returns valid_not_onchain when tokenId=0 and credential exists", () => {
    const r = deriveOnChainStatus({ tokenId: 0, status: "issued" });
    expect(r.status).toBe("valid_not_onchain");
  });

  it("returns valid_not_onchain when isMinted=false and credential exists", () => {
    const r = deriveOnChainStatus({ isMinted: false, isValid: true });
    expect(r.status).toBe("valid_not_onchain");
  });

  it("returns unknown when no token info and no valid credential signal", () => {
    expect(deriveOnChainStatus({}).status).toBe("unknown");
  });

  it("returns unknown when tokenId undefined even if credential exists (no on-chain info)", () => {
    const r = deriveOnChainStatus({ isValid: true });
    expect(r.status).toBe("unknown");
  });

  it("handles status='VALID' for valid_not_onchain determination", () => {
    const r = deriveOnChainStatus({ tokenId: null, status: "VALID" });
    expect(r.status).toBe("valid_not_onchain");
  });
});

// ── 3. deriveIssuerCredibility ───────────────────────────────────────────────

describe("deriveIssuerCredibility", () => {
  it("returns available=false with label 'Not available' when no tier or score", () => {
    const r = deriveIssuerCredibility({});
    expect(r.available).toBe(false);
    expect(r.label).toBe("Not available");
  });

  it("returns available=false when both trustTier and trustScore are null", () => {
    const r = deriveIssuerCredibility({ trustTier: null, trustScore: null });
    expect(r.available).toBe(false);
  });

  it("resolves tier from trustTier field", () => {
    const r = deriveIssuerCredibility({ trustTier: "gold" });
    expect(r.available).toBe(true);
    expect(r.tier).toBe("gold");
    expect(r.label).toBe("Gold Issuer");
  });

  it("resolves tier from nested issuer.trustTier", () => {
    const r = deriveIssuerCredibility({ issuer: { trustTier: "platinum" } });
    expect(r.tier).toBe("platinum");
    expect(r.label).toBe("Platinum Issuer");
  });

  it("resolves score from trustScore field", () => {
    const r = deriveIssuerCredibility({ trustScore: 82 });
    expect(r.available).toBe(true);
    expect(r.score).toBe(82);
  });

  it("resolves score from nested issuer.trustScore", () => {
    const r = deriveIssuerCredibility({ issuer: { trustScore: 65 } });
    expect(r.score).toBe(65);
  });

  it("prefers top-level trustTier over nested issuer.trustTier", () => {
    const r = deriveIssuerCredibility({
      trustTier: "silver",
      issuer: { trustTier: "bronze" },
    });
    expect(r.tier).toBe("silver");
  });

  it("includes score in description when both tier and score are present", () => {
    const r = deriveIssuerCredibility({ trustTier: "gold", trustScore: 80 });
    expect(r.description).toContain("80/100");
  });

  it("handles unverified tier", () => {
    const r = deriveIssuerCredibility({ trustTier: "unverified" });
    expect(r.tier).toBe("unverified");
    expect(r.label).toBe("Pending Verification");
  });
});
