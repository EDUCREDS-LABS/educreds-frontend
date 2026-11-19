import { test, expect, Page } from '@playwright/test';

type DeploymentTier = 'workspace' | 'cloud-connector' | 'enterprise-connector';

type TierCase = {
  name: string;
  tier: DeploymentTier;
  forbiddenRoute: string;
  expectedCurrentTier: string;
  expectedRequiredText: string;
};

const CASES: TierCase[] = [
  {
    name: 'workspace users are blocked from connector infrastructure',
    tier: 'workspace',
    forbiddenRoute: '/connect/api-keys',
    expectedCurrentTier: 'EduCreds Workspace (Tier 3)',
    expectedRequiredText: 'Cloud Connector (Tier 2)',
  },
  {
    name: 'cloud connector users are blocked from manual issuance',
    tier: 'cloud-connector',
    forbiddenRoute: '/institution/issue',
    expectedCurrentTier: 'Cloud Connector (Tier 2)',
    expectedRequiredText: 'EduCreds Workspace (Tier 3)',
  },
  {
    name: 'cloud connector users are blocked from templates',
    tier: 'cloud-connector',
    forbiddenRoute: '/templates/create',
    expectedCurrentTier: 'Cloud Connector (Tier 2)',
    expectedRequiredText: 'EduCreds Workspace (Tier 3)',
  },
  {
    name: 'enterprise connector users are blocked from workspace batch ops',
    tier: 'enterprise-connector',
    forbiddenRoute: '/institution/batch-operations',
    expectedCurrentTier: 'Enterprise Connector (Tier 1)',
    expectedRequiredText: 'EduCreds Workspace (Tier 3)',
  },
];

function buildInstitutionUser(tier: DeploymentTier) {
  return {
    id: `${tier}-test-user`,
    email: `${tier}@qa.educreds.test`,
    name: `${tier} Test Institution`,
    type: 'institution',
    walletAddress: '0x1111111111111111111111111111111111111111',
    isVerified: true,
    deploymentTier: tier,
  };
}

async function seedInstitutionAuth(page: Page, tier: DeploymentTier) {
  const user = buildInstitutionUser(tier);

  await page.addInitScript((seedUser) => {
    window.sessionStorage.setItem('auth_type', 'institution');
    window.sessionStorage.setItem('institution_token', 'playwright-institution-token');
    window.sessionStorage.setItem('authToken', 'playwright-institution-token');
    window.sessionStorage.setItem('institution_user', JSON.stringify(seedUser));
  }, user);
}

test.describe('TierGuard route enforcement', () => {
  for (const testCase of CASES) {
    test(testCase.name, async ({ page }) => {
      await seedInstitutionAuth(page, testCase.tier);
      await page.goto(testCase.forbiddenRoute);

      await expect(page).toHaveURL(new RegExp(`${testCase.forbiddenRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      await expect(page.getByRole('heading', { name: 'Access Restricted' })).toBeVisible();
      await expect(page.getByText(testCase.expectedCurrentTier)).toBeVisible();
      await expect(page.getByText(testCase.expectedRequiredText)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back to Dashboard' })).toBeVisible();
    });
  }
});
