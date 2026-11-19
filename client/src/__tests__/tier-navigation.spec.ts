/**
 * Tier Navigation Matrix Test — BYOD 3-Tier Architecture (spec §4, §6, §11)
 *
 * Statically verifies the route-level tier isolation declared in App.tsx:
 *   - Every Tier-3-only (Workspace) route is wrapped in
 *     <TierGuard allowedTiers={['workspace']}>
 *   - Every Tier-1/2-only (Connector) route is wrapped in
 *     <TierGuard allowedTiers={['cloud-connector', 'enterprise-connector']}>
 *   - The removed PoIC self-reporting page stays removed:
 *     /compliance/poic-submission must redirect to /compliance/verification
 *
 * This guards against navigation-bleed regressions (BYOD §1.1) without
 * requiring a DOM environment: if someone removes a TierGuard or changes
 * allowedTiers on a restricted route, this suite fails.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_TSX = resolve(HERE, '../App.tsx');

/** Workspace (Tier 3) exclusive routes per BYOD spec §4.1 */
const WORKSPACE_ONLY_ROUTES = [
  '/institution/issue',
  '/institution/manage-specs',
  '/institution/lms-import',
  '/institution/analytics',
  '/institution/batch-operations',
  '/institution/audit-trail',
  '/institution/webhooks',
  '/institution/white-label',
  '/institution/issuance-monitor',
  '/templates',
  '/templates/browse',
  '/templates/create',
  '/templates/smart-ai',
  '/templates/my',
];

/** Connector (Tier 1/2) exclusive routes per BYOD spec §4.1 */
const CONNECTOR_ONLY_ROUTES = [
  '/connect/connector',
  '/connect/api-keys',
  '/connect/data-mapping',
  '/connect/health-dashboard',
  '/connect/delegated-signing',
];

let appSource = '';

/** Extract the full <Route path="..." element={...} /> JSX for a given path. */
function routeElementFor(path: string): string {
  const marker = `path="${path}"`;
  const idx = appSource.indexOf(marker);
  expect(idx, `Route ${path} must be declared in App.tsx`).toBeGreaterThan(-1);
  const end = appSource.indexOf('\n', idx);
  return appSource.slice(idx, end === -1 ? undefined : end);
}

beforeAll(() => {
  appSource = readFileSync(APP_TSX, 'utf8');
});

describe('Tier navigation matrix (BYOD spec §4.1)', () => {
  describe('Tier 3 (Workspace) exclusive routes', () => {
    for (const route of WORKSPACE_ONLY_ROUTES) {
      it(`${route} is guarded with allowedTiers=['workspace']`, () => {
        const element = routeElementFor(route);
        expect(element).toContain('<TierGuard');
        expect(element).toMatch(/allowedTiers=\{\[\s*'workspace'\s*\]\}/);
        // Must NOT allow connector tiers
        expect(element).not.toContain('cloud-connector');
        expect(element).not.toContain('enterprise-connector');
      });
    }
  });

  describe('Tier 1/2 (Connector) exclusive routes', () => {
    for (const route of CONNECTOR_ONLY_ROUTES) {
      it(`${route} is guarded with allowedTiers=['cloud-connector','enterprise-connector']`, () => {
        const element = routeElementFor(route);
        expect(element).toContain('<TierGuard');
        expect(element).toMatch(
          /allowedTiers=\{\[\s*'cloud-connector'\s*,\s*'enterprise-connector'\s*\]\}/,
        );
        // Must NOT include workspace in the allow-list
        expect(element).not.toMatch(/allowedTiers=\{\[[^\]]*'workspace'/);
      });
    }
  });

  describe('Route guards are stacked inside authentication', () => {
    it('every guarded route also requires INSTITUTION auth (ProtectedRoute)', () => {
      for (const route of [...WORKSPACE_ONLY_ROUTES, ...CONNECTOR_ONLY_ROUTES]) {
        const element = routeElementFor(route);
        expect(element, `${route} must be inside ProtectedRoute`).toContain('<ProtectedRoute');
        expect(element).toContain('AuthType.INSTITUTION');
      }
    });
  });
});

describe('PoIC self-reporting removal (BYOD spec §5)', () => {
  it('/compliance/poic-submission redirects to /compliance/verification', () => {
    const element = routeElementFor('/compliance/poic-submission');
    expect(element).toContain('<Navigate');
    expect(element).toContain('to="/compliance/verification"');
  });

  it('legacy /governance/poic-submission redirects into /compliance namespace', () => {
    const element = routeElementFor('/governance/poic-submission');
    expect(element).toContain('<Navigate');
    expect(element).toContain('/compliance/poic-submission');
  });
});

describe('TierGuard component contract', () => {
  it('TierGuard defaults unknown/missing tier to workspace (fail to least privilege)', () => {
    const guardSource = readFileSync(
      resolve(HERE, '../components/TierGuard.tsx'),
      'utf8',
    );
    // The guard must coalesce a missing deploymentTier to 'workspace' so
    // legacy sessions can never unlock connector-only pages.
    expect(guardSource).toMatch(/deploymentTier[^\n]*\?\?\s*["']workspace["']/);
    // And must render children only via an allow-list check
    expect(guardSource).toContain('allowedTiers.includes(currentTier)');
  });
});
