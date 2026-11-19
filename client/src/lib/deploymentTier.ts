export type DeploymentTier = "workspace" | "cloud-connector" | "enterprise-connector";

export const WORKSPACE_TIER_DESTINATION = "/workspace/analytics";
export const CONNECTOR_TIER_DESTINATION = "/integration/connector";
export const FALLBACK_TIER_DESTINATION = "/institution/dashboard";

export function getInstitutionTierDestination(tier?: string | null): string {
  return '/institution/dashboard';
}

