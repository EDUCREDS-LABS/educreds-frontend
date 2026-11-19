import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";
import * as Sentry from "@sentry/react";

type VitalMetric = {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
};

function report(metric: VitalMetric): void {
  const valueMs = Math.round(metric.value);

  if (import.meta.env.DEV) {
    console.debug("[web-vitals]", metric.name, valueMs, metric.rating);
  }

  // Attach to the active span so vitals correlate with the current navigation.
  const span = Sentry.getActiveSpan();
  if (span) {
    span.setAttribute(`webVitals.${metric.name}.value`, valueMs);
    span.setAttribute(`webVitals.${metric.name}.rating`, metric.rating ?? "unknown");
  }

  Sentry.setMeasurement(metric.name, valueMs, "ms");
  Sentry.addBreadcrumb({
    category: "web-vitals",
    message: `${metric.name}: ${valueMs}ms`,
    level: "info",
    data: { rating: metric.rating, delta: metric.delta },
  });
}

export function reportWebVitals(): void {
  onCLS(report);
  onINP(report);
  onLCP(report);
  onFCP(report);
  onTTFB(report);
}
