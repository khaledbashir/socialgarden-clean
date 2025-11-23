// Centralized commercial policy for SOW pricing (deterministic, testable)
// October 24, 2025

export type ProjectSizeTier = 'small' | 'medium' | 'large';

export const CURRENCY = 'AUD';
export const SHOW_GST_SUFFIX = true; // Append "+GST" on item summaries

// Final total rounding policy (apply on Grand Total)
export const ROUNDING_NEAREST = 100; // nearest $100 (configurable to 50/100)

// Budget variance tolerance (beyond this triggers Adjustment Proposal flow)
export const BUDGET_VARIANCE_TOLERANCE = 0.02; // ±2%

// Seniority cap for execution-heavy hours (excludes mandatory layers)
export const SENIOR_EXECUTION_CAP = 0.30; // ≤30%

// QA / Reviews / Meetings baselines
export const QA_BASELINE_PERCENT = 0.05; // 5% of build hours
export const QA_MIN_HOURS = 4; // never below 4h
export const INTERNAL_REVIEW_HOURS_PER_PHASE = 1; // 1h per major phase
export const CLIENT_MEETING_HOURS_PER_WEEK = 1; // 1h/week

// Mandatory management and coordination layers with tiered minima
export interface MandatoryMinima {
  headOf: number; // Tech - Head Of - Senior Project Management
  projectCoordination: number; // Project Coordination
  accountManagement: number; // Account Management
}

export const EXECUTION_HOURS_TIERS: Array<{ max: number; tier: ProjectSizeTier; minima: MandatoryMinima }> = [
  {
    max: 80,
    tier: 'small',
    minima: { headOf: 2, projectCoordination: 6, accountManagement: 8 },
  },
  {
    max: 200,
    tier: 'medium',
    minima: { headOf: 3, projectCoordination: 10, accountManagement: 10 },
  },
  {
    max: Number.POSITIVE_INFINITY,
    tier: 'large',
    minima: { headOf: 4, projectCoordination: 14, accountManagement: 12 },
  },
];

export function getTierForExecutionHours(hours: number): { tier: ProjectSizeTier; minima: MandatoryMinima } {
  const rule = EXECUTION_HOURS_TIERS.find(r => hours <= r.max) || EXECUTION_HOURS_TIERS[EXECUTION_HOURS_TIERS.length - 1];
  return { tier: rule.tier, minima: rule.minima };
}

// Placeholder client names to sanitize if a real client name is not set
export const PLACEHOLDER_SANITIZATION_ENABLED = true;
export const PLACEHOLDER_BRANDS = [
  'acme', 'contoso', 'foocorp', 'example corp', 'exampleco', 'lorem ipsum', 'client x', 'client y'
];

export function isPlaceholderBrand(name: string): boolean {
  const n = (name || '').trim().toLowerCase();
  return PLACEHOLDER_BRANDS.some(p => n.includes(p));
}

// Utility to round currency
export function roundCurrency(value: number, nearest = ROUNDING_NEAREST): number {
  if (!nearest || nearest <= 1) return Math.round(value);
  return Math.round(value / nearest) * nearest;
}

// Utility to compute budget variance (absolute fraction)
export function computeVarianceFraction(total: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.abs(total - target) / target;
}
