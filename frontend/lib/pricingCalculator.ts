import { ROLES, RATE_CARD_MAP } from './rateCard';

export type PricingRow = {
  role: string;
  description?: string;
  hours: number;
  rate: number;
};

const norm = (s: string) => (s || '')
  .toLowerCase()
  .replace(/\s*-\s*/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

// Levenshtein distance implementation for fuzzy string matching
const levenshteinDistance = (a: string = '', b: string = ''): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return matrix[b.length][a.length];
};

const findCanon = (name: string) => {
  if (!name || typeof name !== 'string') return null;

  let bestMatch: string | null = null;
  let minDistance = Infinity;
  
  // A threshold of 3 is a good balance for catching typos
  // without causing false positives for short strings.
  const SIMILARITY_THRESHOLD = 3;

  for (const canonRole of ROLES) {
    const distance = levenshteinDistance(name.toLowerCase(), canonRole.name.toLowerCase());

    // Perfect match is always the best
    if (distance === 0) {
        return canonRole;
    }

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = canonRole.name;
    }
  }

  // If the closest match is within our acceptable threshold, return it.
  if (bestMatch && minDistance <= SIMILARITY_THRESHOLD) {
    return ROLES.find(r => r.name === bestMatch);
  }

  return null;
};

const PM_HEAD_OF = 'Tech - Head Of- Senior Project Management'; // exact from rate card
const PM_DELIVERY = 'Tech - Delivery - Project Management';
const ROLE_ACCOUNT_MANAGER = 'Account Management - (Account Manager)';

export type CalcOptions = {
  // If true, include Project Coordination with a minimal fixed allocation when present in role names
  includeProjectCoordination?: boolean;
  // Minimum fixed AM hours
  accountManagementHours?: number;
  // Fixed PM hours for each PM tier
  pmHoursHeadOf?: number;
  pmHoursDelivery?: number;
  // Round hours to this decimal place (e.g., 0.5)
  hourGranularity?: number;
};

const DEFAULTS: Required<CalcOptions> = {
  includeProjectCoordination: true,
  accountManagementHours: 8,
  pmHoursHeadOf: 5,
  pmHoursDelivery: 5,
  hourGranularity: 0.5,
};

/**
 * Deterministically allocate hours to roles to meet a target budget (ex GST).
 * - Enforces single PM based on threshold: > 15000 => Head Of, else Delivery PM.
 * - Ensures Account Management present with minimum hours first.
 * - Subtracts PM + AM costs; distributes remaining budget evenly by budget share
 *   across other suggested roles (hours = share / rate).
 * - Returns rows ready for the editablePricingTable node.
 *
 * Assumptions:
 * - totalBudgetExGst is exclusive of GST.
 * - Role names provided should match the rate card exactly; we'll snap to canonical names if similar.
 */
export function calculatePricingTable(
  suggestedRoleNames: string[],
  totalBudgetExGst: number,
  opts: CalcOptions = {}
): PricingRow[] {
  const cfg = { ...DEFAULTS, ...opts };
  const budget = Math.max(0, Number(totalBudgetExGst) || 0);

  // Deduplicate and canonicalize incoming role names
  const uniqueNames = Array.from(new Set(
    (suggestedRoleNames || [])
      .map(r => String(r || '').trim())
      .filter(Boolean)
  ));

  const canonicalNames = uniqueNames.map(name => findCanon(name)?.name || name);

  // Decide PM role based on threshold
  const pmRoleName = budget > 15000 ? PM_HEAD_OF : PM_DELIVERY;
  const pmCanon = findCanon(pmRoleName)?.name || pmRoleName;
  const pmRate = RATE_CARD_MAP[pmCanon] || 0;
  const pmHours = budget > 15000 ? cfg.pmHoursHeadOf : cfg.pmHoursDelivery;

  // Always include AM
  const amCanon = findCanon(ROLE_ACCOUNT_MANAGER)?.name || ROLE_ACCOUNT_MANAGER;
  const amRate = RATE_CARD_MAP[amCanon] || 0;
  const amHours = cfg.accountManagementHours;

  // Base mandatory rows
  const rows: PricingRow[] = [
    { role: pmCanon, description: budget > 15000 ? 'Strategic oversight' : 'Project delivery management', hours: pmHours, rate: pmRate },
    { role: amCanon, description: 'Client comms & governance', hours: amHours, rate: amRate },
  ];

  // Remove governance roles from the pool (PM and AM only)
  const filtered = canonicalNames.filter(name => {
    const n = norm(name);
    if (n.includes('head-of') || n.includes('head of')) return false;
    if (n.includes('project-management')) return false; // PM
    if (n.includes('account management')) return false; // AM
    return true;
  });

  // Exclude AM if already handled
  const rolePool = filtered.filter(name => norm(name) !== norm(amCanon));

  // Compute remaining budget after mandatory governance
  const baseCost = pmHours * pmRate + amHours * amRate;
  const remaining = Math.max(0, budget - baseCost);

  // Fallback: if no roles to distribute to, pick a sensible default basket
  let pool = rolePool;
  if (pool.length === 0) {
    const defaults = [
      'Tech - Producer - Development',
      'Tech - Specialist - Workflows',
      'Tech - Integrations',
    ];
    pool = defaults.filter(n => !!RATE_CARD_MAP[findCanon(n)?.name || n]);
  }
  if (remaining <= 0 || pool.length === 0) {
    return rows; // Nothing to distribute
  }

  // Evenly distribute budget across remaining roles
  const perRoleBudget = remaining / pool.length;

  for (const name of pool) {
    const canon = findCanon(name)?.name || name;
    const rate = RATE_CARD_MAP[canon] || 0;
    if (rate <= 0) continue; // skip invalid

    // Hours = budget share / rate, rounded to granularity
    let hours = perRoleBudget / rate;
    const g = cfg.hourGranularity;
    hours = Math.max(0, Math.round(hours / g) * g);

    rows.push({ role: canon, description: '', hours, rate });
  }

  // Tighten to budget target: adjust non-governance hours to stay within budget and approach target
  const isGov = (r: PricingRow) => {
    const n = norm(r.role);
    return n.includes('head-of') || n.includes('head of') || n.includes('project-management') || n.includes('account management');
  };
  const g = cfg.hourGranularity;
  const totalCost = (list: PricingRow[]) => list.reduce((s, r) => s + (r.hours * r.rate), 0);

  // Current costs
  let current = totalCost(rows);
  const trimToBudget = () => {
    const nonGov = rows.filter(r => !isGov(r));
    if (nonGov.length === 0) return;
    const sorted = nonGov.sort((a, b) => b.rate - a.rate);
    let idx = 0;
    let safety = 0;
    while (current > budget && safety < 10000) {
      const r = sorted[idx % sorted.length];
      if (r.hours > 0) {
        r.hours = Math.max(0, r.hours - g);
        current = totalCost(rows);
      }
      idx++;
      safety++;
    }
  };

  // If we are already over budget due to initial rounding, trim first
  if (current > budget) {
    trimToBudget();
  } else if (current < budget) {
    // Scale up non-governance to hit target
    const nonGov = rows.filter(r => !isGov(r));
    const nonGovCost = totalCost(nonGov);
    const targetNonGov = Math.max(0, budget - (pmHours * pmRate + amHours * amRate));

    if (nonGov.length > 0 && nonGovCost > 0 && targetNonGov > 0) {
      const scale = targetNonGov / nonGovCost;
      for (const r of nonGov) {
        r.hours = Math.max(0, Math.round((r.hours * scale) / g) * g);
      }
      current = totalCost(rows);
      if (current > budget) {
        trimToBudget();
      } else {
        // Top-up toward budget within tolerance without exceeding
        const tolerance = 0.03; // 3%
        const minAcceptable = budget * (1 - tolerance);
        const sorted = nonGov.sort((a, b) => b.rate - a.rate);
        let idx = 0;
        let safety = 0;
        while (current < minAcceptable && safety < 10000) {
          const r = sorted[idx % sorted.length];
          r.hours = r.hours + g;
          const next = totalCost(rows);
          if (next <= budget) {
            current = next;
          } else {
            // revert if it would exceed budget
            r.hours = Math.max(0, r.hours - g);
          }
          idx++;
          safety++;
        }
      }
    }
  }

  return rows;
}
