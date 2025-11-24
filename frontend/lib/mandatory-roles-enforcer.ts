/**
 * Mandatory Roles Enforcement Engine
 *
 * PURPOSE: Programmatically guarantee the inclusion, ordering, and validation
 * of all mandatory roles in every SOW, regardless of AI output.
 *
 * PHILOSOPHY: "Sam-Proof" Architecture
 * - The AI suggests roles (creative input)
 * - The APPLICATION enforces mandatory roles (business logic)
 * - It must be IMPOSSIBLE to generate a non-compliant SOW
 *
 * This is the Single Source of Truth for mandatory role requirements.
 */

export interface RoleRate {
    roleName: string;
    hourlyRate: number;
}

export interface PricingRow {
    id: string;
    role: string;
    description: string;
    hours: number;
    rate: number;
}

export interface MandatoryRoleDefinition {
    role: string;
    minHours: number;
    maxHours: number;
    defaultHours: number;
    description: string;
    order: number; // Position in pricing table (1 = first)
}

/**
 * THE THREE MANDATORY ROLES (Non-Negotiable)
 * These MUST appear in every SOW, in this exact order, at the top of the pricing table.
 */
export const MANDATORY_ROLES: MandatoryRoleDefinition[] = [
    {
        role: "Tech - Head Of - Senior Project Management",
        minHours: 5,
        maxHours: 15,
        defaultHours: 8,
        description: "Strategic oversight & governance",
        order: 1,
    },
    {
        role: "Tech - Delivery - Project Coordination",
        minHours: 3,
        maxHours: 10,
        defaultHours: 6,
        description: "Project delivery coordination",
        order: 2,
    },
    {
        role: "Account Management - Senior Account Manager",
        minHours: 6,
        maxHours: 12,
        defaultHours: 8,
        description: "Client communication & account governance",
        order: 3,
    },
];

/**
 * Normalize role names for fuzzy matching
 * Handles variations, abbreviations, and typos
 */
function normalizeRoleName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") // Remove all special chars and spaces
        .trim();
}

/**
 * De-duplicate AI-suggested roles by normalized role name. When duplicates occur
 * we prefer the entry with a non-empty description and the highest hours value.
 *
 * This helps avoid duplicate UI keys when AI-provided rows include the same ID
 * or the same role multiple times. Returns a stable, deterministic set.
 */
function dedupeAiSuggestedRoles(rows: PricingRow[]): PricingRow[] {
    const map = new Map<string, PricingRow>();

    for (const row of rows) {
        const key = normalizeRoleName(row.role || "");

        // If role has no name at all, fallback to id-based key to keep
        // uniqueness logic consistent with other safeguards.
        const dedupeKey = key || row.id || generateRowId();

        const existing = map.get(dedupeKey);

        if (!existing) {
            map.set(dedupeKey, { ...row });
            continue;
        }

        // Prefer the entry with a non-empty description.
        const existingHasDesc = (existing.description || "").trim().length > 0;
        const rowHasDesc = (row.description || "").trim().length > 0;

        let chosen = existing;

        if (rowHasDesc && !existingHasDesc) {
            chosen = row;
        } else if (existingHasDesc && !rowHasDesc) {
            chosen = existing;
        } else {
            // If both have (or both don't) descriptions, pick the one with higher hours.
            const existingHours = Number(existing.hours || 0);
            const rowHours = Number(row.hours || 0);
            chosen = rowHours > existingHours ? row : existing;
        }

        // Preserve an ID if available; otherwise generate one.
        chosen.id = chosen.id || existing.id || row.id || generateRowId();

        map.set(dedupeKey, { ...chosen });
    }

    return Array.from(map.values());
}

/**
 * Check if a role is a management/oversight role that should be at the bottom
 * Includes: Account Management, Project Management (oversight), Directors, etc.
 */
function isManagementOversightRole(roleName: string): boolean {
    const lowerRole = roleName.toLowerCase();
    // Remove parentheses and extra whitespace for better matching
    const normalizedRole = lowerRole
        .replace(/[()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Check for explicit management/oversight indicators
    const oversightKeywords = [
        "account management",
        "account director",
        "account manager",
        "account coordinator",
        "project management",
        "program management",
        "client director",
        "client manager",
        "relationship manager",
        "engagement manager",
        "portfolio manager",
        "account exec",
        "account executive",
    ];

    // Check if role contains any oversight keywords
    for (const keyword of oversightKeywords) {
        if (normalizedRole.includes(keyword)) {
            return true;
        }
    }

    // Special case: "Director" or "Manager" in non-technical context
    // (but exclude "Tech - Head Of" which should be at top)
    if (normalizedRole.includes("head of")) {
        return false; // Head Of roles go at the TOP
    }

    // 🎯 CRITICAL FIX: Catch "Project Management - (Account Director)" and similar patterns
    // Pattern: "project management" followed by any text with "director" or "manager"
    if (normalizedRole.includes("project management")) {
        // If it contains director/manager/coordinator anywhere in the string, it's oversight
        if (
            normalizedRole.includes("director") ||
            normalizedRole.includes("manager") ||
            normalizedRole.includes("coordinator")
        ) {
            return true;
        }
    }

    // Check for director/manager roles (but be careful with technical roles)
    if (
        (normalizedRole.includes("director") ||
            normalizedRole.includes("manager")) &&
        !normalizedRole.includes("tech") &&
        !normalizedRole.includes("technical") &&
        !normalizedRole.includes("developer") &&
        !normalizedRole.includes("engineer") &&
        !normalizedRole.includes("delivery")
    ) {
        return true;
    }

    return false;
}

/**
 * Check if a role name matches a mandatory role (fuzzy matching)
 */
function isMandatoryRole(roleName: string): MandatoryRoleDefinition | null {
    const normalized = normalizeRoleName(roleName);

    for (const mandatory of MANDATORY_ROLES) {
        const mandatoryNormalized = normalizeRoleName(mandatory.role);
        if (normalized === mandatoryNormalized) {
            return mandatory;
        }
    }

    return null;
}

/**
 * Generate unique ID for pricing rows
 */
function generateRowId(): string {
    return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Exported helper: Ensure all row IDs in the provided array are unique.
//
// This function is intentionally exported so other modules (or tests) can use
// it when they accept or manipulate arrays of PricingRow data. It mirrors the
// internal duplication protection used in the enforcer while being available
// publicly for external usage.
export function ensureUniqueRowIds(rows: PricingRow[]): PricingRow[] {
    const seen = new Set<string>();
    return rows.map((r) => {
        let id = (r && (r as any).id) || generateRowId();
        if (!id || id.trim() === "") {
            id = generateRowId();
        }
        if (seen.has(id)) {
            const newId = generateRowId();
            console.warn(
                `⚠️ [Mandatory Enforcer] Duplicate row ID detected ("${id}"), generating new id: ${newId}`,
            );
            id = newId;
        }
        seen.add(id);
        return { ...r, id };
    });
}

/**
 * CORE ENFORCEMENT FUNCTION
 *
 * Takes AI-suggested roles and returns a compliant pricing table with:
 * 1. "Tech - Head Of" role at the TOP
 * 2. "Tech - Delivery" role after Head Of
 * 3. All other AI-suggested roles in the MIDDLE
 * 4. "Account Management" role at the BOTTOM (just before totals)
 * 5. Canonical role names from Rate Card
 * 6. Official rates from Rate Card (never trust AI rates)
 * 7. Hours from AI if provided, otherwise defaults
 *
 * @param aiSuggestedRoles - Raw roles from AI (can be empty, partial, or wrong)
 * @param rateCard - Official Rate Card from database (Single Source of Truth)
 * @returns Compliant pricing table with mandatory roles guaranteed
 */
export function enforceMandatoryRoles(
    aiSuggestedRoles: PricingRow[],
    rateCard: RoleRate[],
): PricingRow[] {
    const topRoles: PricingRow[] = [];
    const middleRoles: PricingRow[] = [];
    const bottomRoles: PricingRow[] = [];
    const processedRoles = new Set<string>(); // Track to avoid duplicates

    // 🔒 CRITICAL FIX: Ensure all row IDs are unique. AI-suggested IDs may be duplicated.
    // We maintain a Set of used IDs and an ensureUniqueId helper that produces a
    // new unique ID if the candidate is already taken (or empty).
    const usedIds = new Set<string>();
    const ensureUniqueId = (candidate?: string): string => {
        let id = candidate?.toString() || generateRowId();
        if (!id || id.trim() === "") {
            id = generateRowId();
        }
        while (usedIds.has(id)) {
            // Extremely unlikely but defensive: re-generate
            id = generateRowId();
        }
        usedIds.add(id);
        return id;
    };

    console.log("🔒 [Mandatory Roles Enforcer] Starting enforcement...");
    console.log(`📥 [Enforcer] AI suggested ${aiSuggestedRoles.length} roles`);
    console.log(`📋 [Enforcer] Rate Card has ${rateCard.length} roles`);

    // Helper function to create a mandatory role row
    const createMandatoryRow = (
        mandatory: MandatoryRoleDefinition,
    ): PricingRow => {
        const rateCardEntry = rateCard.find(
            (r) =>
                normalizeRoleName(r.roleName) ===
                normalizeRoleName(mandatory.role),
        );

        if (!rateCardEntry) {
            console.error(
                `❌ [Enforcer] CRITICAL: Mandatory role "${mandatory.role}" not found in Rate Card`,
            );
            throw new Error(
                `Mandatory role "${mandatory.role}" missing from Rate Card. ` +
                `Cannot generate compliant SOW without it.`,
            );
        }

        // Check if AI already provided this role (use AI's hours if so)
        const aiProvided = aiSuggestedRoles.find(
            (r) =>
                normalizeRoleName(r.role) === normalizeRoleName(mandatory.role),
        );

        const hours = aiProvided?.hours || mandatory.defaultHours;

        // Validate hours are within acceptable range
        const validatedHours = Math.max(
            mandatory.minHours,
            Math.min(mandatory.maxHours, hours),
        );

        if (validatedHours !== hours) {
            console.warn(
                `⚠️ [Enforcer] Adjusted hours for ${mandatory.role}: ` +
                `${hours} → ${validatedHours} (min: ${mandatory.minHours}, max: ${mandatory.maxHours})`,
            );
        }

        processedRoles.add(normalizeRoleName(mandatory.role));
        const mandatoryRowId = ensureUniqueId(aiProvided?.id);

        console.log(
            `✅ [Enforcer] Mandatory role #${mandatory.order}: ${mandatory.role} ` +
            `(${validatedHours}h @ $${rateCardEntry.hourlyRate}/h)`,
        );

        return {
            id: mandatoryRowId,
            role: rateCardEntry.roleName, // ALWAYS use canonical name from Rate Card
            description: aiProvided?.description || mandatory.description,
            hours: validatedHours,
            rate: rateCardEntry.hourlyRate, // ALWAYS use official rate from Rate Card
        };
    };

    // STEP 1: INJECT "Tech - Head Of" at the TOP
    const headOfRole = MANDATORY_ROLES.find((m) => m.role.includes("Head Of"));
    if (headOfRole) {
        topRoles.push(createMandatoryRow(headOfRole));
    }

    // STEP 2: INJECT "Tech - Delivery" after Head Of
    const deliveryRole = MANDATORY_ROLES.find((m) =>
        m.role.includes("Delivery"),
    );
    if (deliveryRole) {
        topRoles.push(createMandatoryRow(deliveryRole));
    }

    // STEP 3: ADD OTHER AI-SUGGESTED ROLES (DE-DUPLICATED)
    // Deduplicate AI-suggested roles before processing. If duplicates are found,
    // prefer the entry with higher hours or a non-empty description to minimize collisions.
    const aiRoles = dedupeAiSuggestedRoles(aiSuggestedRoles);

    // Route them to either middle (technical) or bottom (management/oversight)
    let technicalRolesAdded = 0;
    let oversightRolesAdded = 0;

    for (const aiRole of aiRoles) {
        const normalizedAiRole = normalizeRoleName(aiRole.role);

        // Validate hours upfront (needed for both branches)
        const validatedHours = Math.max(0, Number(aiRole.hours) || 0);

        // Skip if this is a mandatory role (already processed OR will be processed)
        if (processedRoles.has(normalizedAiRole) || isMandatoryRole(aiRole.role)) {
            console.log(
                `⏭️ [Enforcer] Skipping mandatory role in general loop: ${aiRole.role}`,
            );
            continue;
        }

        // Validate role exists in Rate Card
        const rateCardEntry = rateCard.find(
            (r) => normalizeRoleName(r.roleName) === normalizedAiRole,
        );

        if (!rateCardEntry) {
            console.warn(
                `⚠️ [Enforcer] Role "${aiRole.role}" not found in Rate Card. ` +
                `This role will be PRESERVED with a default rate to prevent data loss.`,
            );

            // CRITICAL FIX: Preserve role instead of skipping to prevent missing rows
            const additionalRow: PricingRow = {
                id: ensureUniqueId(aiRole.id),
                role: aiRole.role, // Keep original role name
                description: String(aiRole.description || "").trim(),
                hours: validatedHours,
                rate: 120, // Default rate for unknown roles (Producer rate)
            };

            // Add to middle roles by default
            middleRoles.push(additionalRow);
            technicalRolesAdded++;
            processedRoles.add(normalizedAiRole);
            continue;
        }

        const additionalRow: PricingRow = {
            id: ensureUniqueId(aiRole.id),
            role: rateCardEntry.roleName, // ALWAYS use canonical name
            description: String(aiRole.description || "").trim(),
            hours: validatedHours,
            rate: rateCardEntry.hourlyRate, // ALWAYS use official rate (NEVER trust AI rate)
        };

        // CRITICAL: Detect if this is a management/oversight role
        if (isManagementOversightRole(rateCardEntry.roleName)) {
            // Management/oversight roles go to the BOTTOM
            bottomRoles.push(additionalRow);
            oversightRolesAdded++;
            console.log(
                `📊 [Enforcer] Management/Oversight role (bottom): ${rateCardEntry.roleName} ` +
                `(${validatedHours}h @ $${rateCardEntry.hourlyRate}/h)`,
            );
        } else {
            // Technical/delivery roles go in the MIDDLE
            middleRoles.push(additionalRow);
            technicalRolesAdded++;
            console.log(
                `➕ [Enforcer] Technical role (middle): ${rateCardEntry.roleName} ` +
                `(${validatedHours}h @ $${rateCardEntry.hourlyRate}/h)`,
            );
        }

        processedRoles.add(normalizedAiRole);
    }

    // STEP 4: INJECT "Account Management" at the BOTTOM
    const accountMgmtRole = MANDATORY_ROLES.find((m) =>
        m.role.includes("Account Management"),
    );
    if (accountMgmtRole) {
        bottomRoles.push(createMandatoryRow(accountMgmtRole));
    }

    // STEP 5: COMBINE ALL SECTIONS IN ORDER
    const result = ensureUniqueRowIds([
        ...topRoles,
        ...middleRoles,
        ...bottomRoles,
    ]);

    console.log(
        `🎯 [Enforcer] Enforcement complete: ` +
        `${topRoles.length} top (leadership) + ${middleRoles.length} middle (technical) + ${bottomRoles.length} bottom (management/oversight) = ${result.length} total`,
    );

    return result;
}

/**
 * Validate that a pricing table contains all mandatory roles
 * Used as a pre-export safety check
 *
 * @param rows - Pricing table rows to validate
 * @returns Validation result with details
 */
export interface MandatoryRoleValidationResult {
    isValid: boolean;
    missingRoles: string[];
    incorrectOrder: boolean;
    details: string[];
}

export function validateMandatoryRoles(
    rows: PricingRow[],
): MandatoryRoleValidationResult {
    const result: MandatoryRoleValidationResult = {
        isValid: true,
        missingRoles: [],
        incorrectOrder: false,
        details: [],
    };

    // Check 1: All mandatory roles present
    for (const mandatory of MANDATORY_ROLES) {
        const found = rows.find(
            (r) =>
                normalizeRoleName(r.role) === normalizeRoleName(mandatory.role),
        );

        if (!found) {
            result.isValid = false;
            result.missingRoles.push(mandatory.role);
            result.details.push(`❌ Missing mandatory role: ${mandatory.role}`);
        }
    }

    // Check 2: Mandatory roles in correct positions (Head Of first, Account Management last)
    if (result.missingRoles.length === 0 && rows.length >= 3) {
        const headOfRole = MANDATORY_ROLES.find((m) =>
            m.role.includes("Head Of"),
        );
        const deliveryRole = MANDATORY_ROLES.find((m) =>
            m.role.includes("Delivery"),
        );
        const accountMgmtRole = MANDATORY_ROLES.find((m) =>
            m.role.includes("Account Management"),
        );

        // Check Head Of is first
        if (
            headOfRole &&
            normalizeRoleName(rows[0]?.role) !==
            normalizeRoleName(headOfRole.role)
        ) {
            result.isValid = false;
            result.incorrectOrder = true;
            result.details.push(
                `⚠️ Incorrect order: Position 1 should be "${headOfRole.role}", ` +
                `but found "${rows[0]?.role}"`,
            );
        }

        // Check Delivery is second
        if (
            deliveryRole &&
            normalizeRoleName(rows[1]?.role) !==
            normalizeRoleName(deliveryRole.role)
        ) {
            result.isValid = false;
            result.incorrectOrder = true;
            result.details.push(
                `⚠️ Incorrect order: Position 2 should be "${deliveryRole.role}", ` +
                `but found "${rows[1]?.role}"`,
            );
        }

        // Check Account Management is last
        if (accountMgmtRole) {
            const lastRow = rows[rows.length - 1];
            if (
                normalizeRoleName(lastRow?.role) !==
                normalizeRoleName(accountMgmtRole.role)
            ) {
                result.isValid = false;
                result.incorrectOrder = true;
                result.details.push(
                    `⚠️ Incorrect order: Last position should be "${accountMgmtRole.role}", ` +
                    `but found "${lastRow?.role}"`,
                );
            }
        }
    }

    // Check 3: Hours within acceptable range
    for (const mandatory of MANDATORY_ROLES) {
        const row = rows.find(
            (r) =>
                normalizeRoleName(r.role) === normalizeRoleName(mandatory.role),
        );

        if (row) {
            if (
                row.hours < mandatory.minHours ||
                row.hours > mandatory.maxHours
            ) {
                result.isValid = false;
                result.details.push(
                    `⚠️ ${row.role}: Hours ${row.hours} outside acceptable range ` +
                    `(${mandatory.minHours}-${mandatory.maxHours})`,
                );
            }
        }
    }

    if (result.isValid) {
        result.details.push(
            "✅ All mandatory roles present and correctly ordered (Head Of → Other Roles → Account Management)",
        );
    }

    return result;
}

/**
 * Get list of mandatory role names (for UI dropdowns, prompts, etc.)
 */
export function getMandatoryRoleNames(): string[] {
    return MANDATORY_ROLES.map((m) => m.role);
}

/**
 * Check if a given role name is a mandatory role
 */
export function isRoleMandatory(roleName: string): boolean {
    return isMandatoryRole(roleName) !== null;
}

/**
 * Get mandatory role definition by name
 */
export function getMandatoryRoleDefinition(
    roleName: string,
): MandatoryRoleDefinition | null {
    return isMandatoryRole(roleName);
}

/**
 * Suggest adjustments to bring hours within acceptable range for mandatory roles
 */
export function suggestMandatoryRoleAdjustments(rows: PricingRow[]): string[] {
    const suggestions: string[] = [];

    for (const mandatory of MANDATORY_ROLES) {
        const row = rows.find(
            (r) =>
                normalizeRoleName(r.role) === normalizeRoleName(mandatory.role),
        );

        if (!row) {
            suggestions.push(
                `Add ${mandatory.role} with ${mandatory.defaultHours} hours (${mandatory.description})`,
            );
        } else if (row.hours < mandatory.minHours) {
            suggestions.push(
                `Increase ${row.role} from ${row.hours}h to at least ${mandatory.minHours}h`,
            );
        } else if (row.hours > mandatory.maxHours) {
            suggestions.push(
                `Reduce ${row.role} from ${row.hours}h to at most ${mandatory.maxHours}h`,
            );
        }
    }

    return suggestions;
}
