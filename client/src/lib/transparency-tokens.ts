/**
 * Design Tokens and Utilities for DAO Governance Transparency
 * Centralized definitions for colors, spacing, and styling constants
 */

// ============ SEVERITY COLOR MAPPING ============

export const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-900',
    icon: 'text-red-600',
    badge: 'bg-red-200 text-red-900',
    dot: 'bg-red-600',
    hex: '#d32f2f', // For CSS-in-JS or conic-gradient
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    icon: 'text-orange-600',
    badge: 'bg-orange-200 text-orange-900',
    dot: 'bg-orange-600',
    hex: '#f57c00',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    icon: 'text-amber-600',
    badge: 'bg-amber-200 text-amber-900',
    dot: 'bg-amber-600',
    hex: '#fbc02d',
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
    icon: 'text-green-600',
    badge: 'bg-green-200 text-green-900',
    dot: 'bg-green-600',
    hex: '#388e3c',
  },
} as const;

// ============ RISK LEVEL COLOR MAPPING ============

export const RISK_LEVEL_COLORS = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-l-4 border-red-600',
    text: 'text-red-900',
    badge: 'bg-red-600 text-white',
    hex: '#d32f2f',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-l-4 border-orange-600',
    text: 'text-orange-900',
    badge: 'bg-orange-600 text-white',
    hex: '#f57c00',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-l-4 border-amber-600',
    text: 'text-amber-900',
    badge: 'bg-amber-600 text-white',
    hex: '#fbc02d',
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-600',
    text: 'text-green-900',
    badge: 'bg-green-600 text-white',
    hex: '#388e3c',
  },
} as const;

// ============ STATUS COLOR MAPPING ============

export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-600',
    text: 'text-green-900',
    hex: '#4caf50',
  },
  failed: {
    bg: 'bg-red-50',
    border: 'border-l-4 border-red-600',
    text: 'text-red-900',
    hex: '#f44336',
  },
  pending: {
    bg: 'bg-blue-50',
    border: 'border-l-4 border-blue-600',
    text: 'text-blue-900',
    hex: '#1976d2',
  },
} as const;

// ============ SCORE RANGE COLORS ============

export const SCORE_RANGE_COLORS = {
  excellent: { bg: 'bg-green-600', hex: '#4caf50', label: 'Excellent' },
  good: { bg: 'bg-emerald-500', hex: '#43a047', label: 'Good' },
  warning: { bg: 'bg-amber-500', hex: '#fbc02d', label: 'Warning' },
  critical: { bg: 'bg-red-600', hex: '#d32f2f', label: 'Critical' },
} as const;

// ============ SPACING ============

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
} as const;

// ============ BORDER RADIUS ============

export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const;

// ============ TYPOGRAPHY ============

export const TYPOGRAPHY = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
  h5: 'text-base font-semibold',
  body: 'text-sm',
  caption: 'text-xs',
  label: 'text-xs font-semibold',
} as const;

// ============ UTILITY FUNCTIONS ============

/**
 * Get color configuration based on severity level
 */
export function getSeverityColors(
  severity: 'critical' | 'high' | 'medium' | 'low'
) {
  return SEVERITY_COLORS[severity];
}

/**
 * Get color configuration based on risk level
 */
export function getRiskLevelColors(
  level: 'critical' | 'high' | 'medium' | 'low'
) {
  return RISK_LEVEL_COLORS[level];
}

/**
 * Get color configuration based on status
 */
export function getStatusColors(status: 'success' | 'failed' | 'pending') {
  return STATUS_COLORS[status];
}

/**
 * Determine score range color based on numeric value
 */
export function getScoreRangeColor(
  score: number
): (typeof SCORE_RANGE_COLORS)[keyof typeof SCORE_RANGE_COLORS] {
  if (score >= 80) return SCORE_RANGE_COLORS.excellent;
  if (score >= 60) return SCORE_RANGE_COLORS.good;
  if (score >= 40) return SCORE_RANGE_COLORS.warning;
  return SCORE_RANGE_COLORS.critical;
}

/**
 * Format a severity level string for display
 */
export function formatSeverity(
  severity: string
): 'critical' | 'high' | 'medium' | 'low' {
  const normalized = severity.toLowerCase();
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
}

/**
 * Format a risk level string for display
 */
export function formatRiskLevel(
  level: string
): 'critical' | 'high' | 'medium' | 'low' {
  const normalized = level.toLowerCase();
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
}

/**
 * Format a date for display in the UI
 */
export function formatTransparencyDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
