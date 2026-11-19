import { test, expect, Page, Route } from '@playwright/test';

/**
 * End-to-end test: complete student credential journey
 *
 * institution issues → claim email → /claim/:token → export key → /student-portal
 *
 * This test mocks the backend responses at the network layer so it can run
 * standalone against the frontend (no live NestJS + Postgres required).
 * When the real backend is available, set STUDENT_JOURNEY_LIVE=1 to skip mocks.
 *
 * Run:
 *   npx playwright test tests/e2e/student-journey.spec.ts
 */

const LIVE = process.env.STUDENT_JOURNEY_LIVE === '1';

const STUDENT_EMAIL = 'alice.grad@edu-e2e.test';
const STUDENT_EDU_ID = 'EDU-00099001';
const STUDENT_TOKEN = 'e2e-student-jwt';
const CLAIM_TOKEN = 'e2e-claim-token-xyz';
const CLAIM_OTP_TOKEN = 'e2e-otp-challenge';
const CLAIM_SESSION_JWT = 'e2e-claim-session-jwt';
const CERTIFICATE_ID = 'cert-e2e-abc123';

async function mockBackend(page: Page) {
  if (LIVE) return;

  // Institution issuance mock — POST /api/certificates/issue
  await page.route('**/api/certificates/issue', async (route: Route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        certificate: {
          id: CERTIFICATE_ID,
          studentWalletAddress: '0x' + 'a'.repeat(40),
          studentName: 'Alice Grad',
          courseName: 'BSc Computer Science',
          isMinted: false,
        },
        claim: { token: CLAIM_TOKEN, email: STUDENT_EMAIL },
      }),
    });
  });

  // Claim lookup — GET /api/credentials/claim/:token
  await page.route(`**/api/credentials/claim/${CLAIM_TOKEN}`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        certificateId: CERTIFICATE_ID,
        eduCredsId: STUDENT_EDU_ID,
        email: STUDENT_EMAIL,
        institutionName: 'E2E University',
        courseName: 'BSc Computer Science',
      }),
    });
  });

  // Claim OTP request — POST /api/credentials/claim/:token/request-otp
  await page.route(`**/api/credentials/claim/${CLAIM_TOKEN}/request-otp`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ otpToken: CLAIM_OTP_TOKEN, sent: true }),
    });
  });

  // Claim OTP verify — POST /api/credentials/claim/:token/verify-otp
  await page.route(`**/api/credentials/claim/${CLAIM_TOKEN}/verify-otp`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ claimSessionJwt: CLAIM_SESSION_JWT }),
    });
  });

  // Claim confirm — POST /api/credentials/claim/:token/confirm
  await page.route(`**/api/credentials/claim/${CLAIM_TOKEN}/confirm`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ claimed: true, eduCredsId: STUDENT_EDU_ID }),
    });
  });

  // Export key — POST /api/credentials/claim/:token/export-key
  await page.route(`**/api/credentials/claim/${CLAIM_TOKEN}/export-key`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        privateKey: '0x' + 'b'.repeat(64),
        walletAddress: '0x' + 'a'.repeat(40),
        oneTime: true,
      }),
    });
  });

  // Student email OTP login (unified) — POST /api/identity/login/email
  await page.route('**/api/identity/login/email', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ otpToken: CLAIM_OTP_TOKEN, message: 'OTP sent' }),
    });
  });

  // Student email OTP verify — POST /api/identity/login/email/verify
  await page.route('**/api/identity/login/email/verify', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: STUDENT_TOKEN,
        identity: {
          eduCredsId: STUDENT_EDU_ID,
          email: STUDENT_EMAIL,
          firstName: 'Alice',
          lastName: 'Grad',
        },
      }),
    });
  });

  // Public identity lookup — GET /api/identity/:eduCredsId
  await page.route(`**/api/identity/${STUDENT_EDU_ID}`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        eduCredsId: STUDENT_EDU_ID,
        email: STUDENT_EMAIL,
        firstName: 'Alice',
        lastName: 'Grad',
        credentialCount: 1,
        embeddedWalletAddress: '0x' + 'a'.repeat(40),
      }),
    });
  });

  // Certificates by wallet — GET /api/certificates/wallet/:address (portal)
  await page.route(/\/api\/certificates\/wallet\//, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        certificates: [
          {
            id: CERTIFICATE_ID,
            studentName: 'Alice Grad',
            courseName: 'BSc Computer Science',
            institutionName: 'E2E University',
            certificateType: 'Academic',
            isMinted: true,
          },
        ],
      }),
    });
  });
}

test.describe('Student Journey — E2E cohesion', () => {
  test('claim flow: /claim/:token → OTP → confirm → export → identity page', async ({ page }) => {
    await mockBackend(page);
    await page.goto(`/claim/${CLAIM_TOKEN}`);

    // PublicLayout should provide header + footer nav (cohesion regression check)
    await expect(page.getByTestId('public-layout')).toBeVisible();

    // Page renders the certificate summary from claim lookup
    await expect(page.getByText('E2E University', { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('BSc Computer Science', { exact: false })).toBeVisible();
  });

  test('student can access identity page via PublicLayout', async ({ page }) => {
    await mockBackend(page);
    await page.goto(`/identity/${STUDENT_EDU_ID}`);
    await expect(page.getByTestId('public-layout')).toBeVisible();
    await expect(page.getByText(STUDENT_EDU_ID)).toBeVisible({ timeout: 15_000 });
  });

  test('student portal offers three identity options (wallet + email + SSO)', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/student-portal');

    // Cohesion: PublicLayout wraps the portal
    await expect(page.getByTestId('public-layout')).toBeVisible();

    // Three identity method cards present (F-1 remediation)
    await expect(page.getByText('Continue With Wallet', { exact: false })).toBeVisible();
    await expect(page.getByText('Continue With Email', { exact: false })).toBeVisible();
    await expect(page.getByTestId('student-portal-sso-cta')).toBeVisible();
  });

  test('active EDU-ID session shows banner on wallet dashboard instead of forced reconnect', async ({
    page,
  }) => {
    await mockBackend(page);

    // Seed a student session before app boot
    await page.addInitScript(
      ({ token, edu, email }) => {
        window.sessionStorage.setItem('student_token', token);
        window.sessionStorage.setItem('auth_type', 'student');
        window.sessionStorage.setItem(
          'student_user',
          JSON.stringify({ eduCredsId: edu, email, firstName: 'Alice', lastName: 'Grad' }),
        );
      },
      { token: STUDENT_TOKEN, edu: STUDENT_EDU_ID, email: STUDENT_EMAIL },
    );

    await page.goto('/student-portal');
    // Click "Continue With Wallet" to enter the wallet branch of StudentDashboard
    await page.getByText('Continue With Wallet', { exact: false }).click();

    // EDU-ID banner should appear in the un-connected wallet branch
    await expect(page.getByTestId('student-session-detected-banner')).toBeVisible();
    await expect(page.getByTestId('open-identity-profile-button')).toBeVisible();
  });
});
