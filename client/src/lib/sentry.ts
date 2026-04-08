import * as Sentry from "@sentry/react";

export function testSentryLog(): void {
  Sentry.logger.info('Frontend test log triggered', { action: 'frontend_test_log' });
}

export function captureTestError(): void {
  try {
    throw new Error('Test error from frontend');
  } catch (error) {
    Sentry.captureException(error);
  }
}

export function captureTestMessage(): void {
  Sentry.captureMessage('Test message from frontend', 'info');
}