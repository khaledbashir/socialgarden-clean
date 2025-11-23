// Pricing validation utilities for SOWs
// Focus: low-risk, policy-aligned checks that can run server-side before exports

export type RoleRow = {
  role: string;
  hours: number;
  rate: number;
};

export type ScopeBlock = {
  title: string;
  roles: RoleRow[];
};

export type Violation = {
  code:
    | "MANDATORY_ROLE_MISSING"
    | "INVALID_ROW_VALUES"
    | "QA_BASELINE_MISSING";
  message: string;
  details?: Record<string, unknown>;
  severity?: "error" | "warning";
};

export type ValidationResult = {
  ok: boolean;
  violations: Violation[];
};

// Policy constants (kept minimal and in sync with policy.ts where possible)
const MANDATORY_ROLES = [
  "Tech - Head Of - Senior Project Management",
  "Tech - Delivery - Project Coordination",
  "Account Management - Senior Account Manager",
];

// QA baseline: 5% of total execution hours, minimum 4 hours
const QA_BASELINE_PERCENT = 0.05;
const QA_BASELINE_MIN_HOURS = 4;

const normalize = (s: string) => (s || "").trim().toLowerCase();

export function aggregateRoles(scopes: ScopeBlock[]): RoleRow[] {
  const map = new Map<string, RoleRow>();
  for (const s of scopes) {
    for (const r of s.roles || []) {
      const key = normalize(r.role);
      if (!key) continue;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { role: r.role, hours: Number(r.hours) || 0, rate: Number(r.rate) || 0 });
      } else {
        map.set(key, { role: prev.role, hours: (prev.hours || 0) + (Number(r.hours) || 0), rate: prev.rate || Number(r.rate) || 0 });
      }
    }
  }
  return Array.from(map.values());
}

export function validatePricing(scopes: ScopeBlock[]): ValidationResult {
  const violations: Violation[] = [];
  const allRoles = aggregateRoles(scopes);

  // 1) Mandatory roles must exist
  for (const mr of MANDATORY_ROLES) {
    const exists = allRoles.some((r) => normalize(r.role) === normalize(mr));
    if (!exists) {
      violations.push({
        code: "MANDATORY_ROLE_MISSING",
        message: `Mandatory role missing: ${mr}`,
        details: { role: mr },
        severity: "error",
      });
    }
  }

  // 2) Rows must have non-negative hours and positive rate (when hours > 0)
  const badRows: RoleRow[] = [];
  for (const s of scopes) {
    for (const r of s.roles || []) {
      const hours = Number(r.hours) || 0;
      const rate = Number(r.rate) || 0;
      if (hours < 0 || (hours > 0 && rate <= 0)) {
        badRows.push(r);
      }
    }
  }
  if (badRows.length) {
    violations.push({
      code: "INVALID_ROW_VALUES",
      message: `Found ${badRows.length} pricing rows with invalid values (negative hours or non-positive rate with hours > 0).`,
      details: { count: badRows.length },
      severity: "error",
    });
  }

  // 3) QA baseline (soft rule): Recommend QA Engineer presence for >= 5% of execution hours, min 4h
  const totalExecHours = allRoles.reduce((acc, r) => acc + (Number(r.hours) || 0), 0);
  const qa = allRoles.find((r) => normalize(r.role) === normalize("QA Engineer") || normalize(r.role) === normalize("Senior QA Engineer"));
  const qaHours = Number(qa?.hours) || 0;
  const requiredQaHours = Math.max(QA_BASELINE_MIN_HOURS, Math.ceil(totalExecHours * QA_BASELINE_PERCENT));
  if (totalExecHours > 0 && qaHours < requiredQaHours) {
    violations.push({
      code: "QA_BASELINE_MISSING",
      message: `QA baseline not met: ${qaHours}h provided, ${requiredQaHours}h recommended (>=5% of ${totalExecHours}h, min 4h).`,
      details: { qaHours, totalExecHours, requiredQaHours },
      severity: "warning",
    });
  }

  return { ok: violations.filter(v => v.severity !== "warning").length === 0, violations };
}

export function proposeAdjustments(scopes: ScopeBlock[]) {
  // Minimal suggestion engine: insert missing mandatory roles with default hours if absent
  const suggestions: { action: string; payload: any }[] = [];
  const allRoles = aggregateRoles(scopes);
  const has = (name: string) => allRoles.some((r) => normalize(r.role) === normalize(name));

  if (!has("Tech - Head Of - Senior Project Management")) {
    suggestions.push({
      action: "add-role",
      payload: { role: "Tech - Head Of - Senior Project Management", hours: 3, rate: 365, description: "Strategic oversight" },
    });
  }
  if (!has("Tech - Delivery - Project Coordination")) {
    suggestions.push({ action: "add-role", payload: { role: "Tech - Delivery - Project Coordination", hours: 6, rate: 110, description: "Delivery coordination" } });
  }
  if (!has("Account Management - Senior Account Manager")) {
    suggestions.push({ action: "add-role", payload: { role: "Account Management - Senior Account Manager", hours: 8, rate: 210, description: "Client comms & governance" } });
  }

  // QA baseline suggestion if needed
  const totalExecHours = allRoles.reduce((acc, r) => acc + (Number(r.hours) || 0), 0);
  const requiredQaHours = Math.max(QA_BASELINE_MIN_HOURS, Math.ceil(totalExecHours * QA_BASELINE_PERCENT));
  const qaIndex = allRoles.findIndex((r) => normalize(r.role) === normalize("QA Engineer") || normalize(r.role) === normalize("Senior QA Engineer"));
  const qaRoleName = qaIndex >= 0 ? allRoles[qaIndex].role : "QA Engineer";
  const qaHours = qaIndex >= 0 ? (Number(allRoles[qaIndex].hours) || 0) : 0;
  if (totalExecHours > 0 && qaHours < requiredQaHours) {
    suggestions.push({ action: qaIndex >= 0 ? "update-role-hours" : "add-role", payload: { role: qaRoleName, hours: requiredQaHours } });
  }

  return suggestions;
}
