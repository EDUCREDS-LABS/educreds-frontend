import type { DeploymentTier } from "@/lib/deploymentTier";

/**
 * Institution tiers — canonical product names.
 * Internal deployment-tier ids are kept for backend compatibility.
 */
export interface TierInfo {
  id: DeploymentTier;
  level: 1 | 2 | 3;
  name: string;
  short: string;
  summary: string;
  issuance: string;
}

export const INSTITUTION_TIERS: Record<DeploymentTier, TierInfo> = {
  workspace: {
    id: "workspace",
    level: 3,
    name: "Tier 3 · Workspace",
    short: "Workspace",
    summary: "Hosted workspace. Manage records and issue credentials directly in EduCreds.",
    issuance: "Manual and CSV issuance from the console.",
  },
  "cloud-connector": {
    id: "cloud-connector",
    level: 2,
    name: "Tier 2 · Connected",
    short: "Connected",
    summary: "Your student information system pushes graduation events to EduCreds over API.",
    issuance: "Credentials are issued automatically from your connected SIS.",
  },
  "enterprise-connector": {
    id: "enterprise-connector",
    level: 1,
    name: "Tier 1 · Enterprise",
    short: "Enterprise",
    summary: "On-premise connector agent with delegated signing and infrastructure-level controls.",
    issuance: "Credentials are issued by your connector agent under delegated signing.",
  },
};

export function getTierInfo(tier?: string | null): TierInfo {
  return INSTITUTION_TIERS[(tier as DeploymentTier) ?? "workspace"] ?? INSTITUTION_TIERS.workspace;
}

export const isConnectorTier = (tier?: string | null) =>
  tier === "cloud-connector" || tier === "enterprise-connector";
