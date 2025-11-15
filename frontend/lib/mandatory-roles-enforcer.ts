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
        order: 1
    },
    {
        role: "Tech - Delivery - Project Coordination",
        minHours: 3,
        maxHours: 10,
        defaultHours: 6,
        description: "Project delivery coordination",
        order: 2
    },
    {
        role: "Account Management - Senior Account Manager",
        minHours: 6,
        maxHours: 12,
        defaultHours: 8,
        description: "Client communication & account governance",
        order: 3
    }
];

/**
 * Normalize role names for fuzzy matching
 * Handles variations, abbreviations, and typos
 */
function normalizeRoleName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove all special chars and spaces
        .trim();
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

/**
 * CORE ENFORCEMENT FUNCTION
 *
 * Takes AI-suggested roles and returns a compliant pricing table with:
 * 1. All 3 mandatory roles at the top (positions 1-3)
 * 2. Canonical role names from Rate Card
 * 3. Official rates from Rate Card (never trust AI rates)
 * 4. Hours from AI if provided, otherwise defaults
 * 5. Other AI-suggested roles following mandatory ones
 *
 * @param aiSuggestedRoles - Raw roles from AI (can be empty, partial, or wrong)
 * @param rateCard - Official Rate Card from database (Single Source of Truth)
 * @returns Compliant pricing table with mandatory roles guaranteed
 */
export function enforceMandatoryRoles(
    aiSuggestedRoles: PricingRow[],
    rateCard: RoleRate[]
): PricingRow[] {
    const result: PricingRow[] = [];
    const processedRoles = new Set<string>(); // Track to avoid duplicates

    console.log('🔒 [Mandatory Roles Enforcer] Starting enforcement...');
    console.log(`📥 [Enforcer] AI suggested ${aiSuggestedRoles.length} roles`);
    console.log(`📋 [Enforcer] Rate Card has ${rateCard.length} roles`);

    // STEP 1: INJECT ALL 3 MANDATORY ROLES AT THE TOP
    // This happens REGARDLESS of what AI provided
    for (const mandatory of MANDATORY_ROLES) {
        const rateCardEntry = rateCard.find(
            r => normalizeRoleName(r.roleName) === normalizeRoleName(mandatory.role)
        );

        if (!rateCardEntry) {
            console.error(`❌ [Enforcer] CRITICAL: Mandatory role "${mandatory.role}" not found in Rate Card`);
            throw new Error(
                `Mandatory role "${mandatory.role}" missing from Rate Card. ` +
                `Cannot generate compliant SOW without it.`
            );
        }

        // Check if AI already provided this role (use AI's hours if so)
        const aiProvided = aiSuggestedRoles.find(
            r => normalizeRoleName(r.role) === normalizeRoleName(mandatory.role)
        );

        const hours = aiProvided?.hours || mandatory.defaultHours;

        // Validate hours are within acceptable range
        const validatedHours = Math.max(
            mandatory.minHours,
            Math.min(mandatory.maxHours, hours)
        );

        if (validatedHours !== hours) {
            console.warn(
                `⚠️ [Enforcer] Adjusted hours for ${mandatory.role}: ` +
                `${hours} → ${validatedHours} (min: ${mandatory.minHours}, max: ${mandatory.maxHours})`
            );
        }

        const mandatoryRow: PricingRow = {
            id: generateRowId(),
            role: rateCardEntry.roleName, // ALWAYS use canonical name from Rate Card
            description: aiProvided?.description || mandatory.description,
            hours: validatedHours,
            rate: rateCardEntry.hourlyRate // ALWAYS use official rate from Rate Card
        };

        result.push(mandatoryRow);
        processedRoles.add(normalizeRoleName(mandatory.role));

        console.log(
            `✅ [Enforcer] Mandatory role #${mandatory.order}: ${mandatory.role} ` +
            `(${validatedHours}h @ $${rateCardEntry.hourlyRate}/h)`
        );
    }

    // STEP 2: ADD OTHER AI-SUGGESTED ROLES (excluding duplicates of mandatory roles)
    let additionalRolesAdded = 0;

    for (const aiRole of aiSuggestedRoles) {
        const normalizedAiRole = normalizeRoleName(aiRole.role);

        // Skip if this is a mandatory role (already processed)
        if (processedRoles.has(normalizedAiRole)) {
            console.log(`⏭️ [Enforcer] Skipping duplicate: ${aiRole.role} (already in mandatory section)`);
            continue;
        }

        // Validate role exists in Rate Card
        const rateCardEntry = rateCard.find(
            r => normalizeRoleName(r.roleName) === normalizedAiRole
        );

        if (!rateCardEntry) {
            console.warn(
                `⚠️ [Enforcer] Role "${aiRole.role}" not found in Rate Card. ` +
                `This role will be REJECTED. Please select roles from official Rate Card.`
            );
            continue; // Skip invalid roles
        }

        // Validate hours and rate
        const validatedHours = Math.max(0, Number(aiRole.hours) || 0);

        const additionalRow: PricingRow = {
            id: aiRole.id || generateRowId(),
            role: rateCardEntry.roleName, // ALWAYS use canonical name
            description: String(aiRole.description || "").trim(),
            hours: validatedHours,
            rate: rateCardEntry.hourlyRate // ALWAYS use official rate (NEVER trust AI rate)
        };

        result.push(additionalRow);
        processedRoles.add(normalizedAiRole);
        additionalRolesAdded++;

        console.log(
            `➕ [Enforcer] Additional role: ${rateCardEntry.roleName} ` +
            `(${validatedHours}h @ $${rateCardEntry.hourlyRate}/h)`
        );
    }

    console.log(
        `🎯 [Enforcer] Enforcement complete: ` +
        `3 mandatory roles + ${additionalRolesAdded} additional roles = ${result.length} total`
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

export function validateMandatoryRoles(rows: PricingRow[]): MandatoryRoleValidationResult {
    const result: MandatoryRoleValidationResult = {
        isValid: true,
        missingRoles: [],
        incorrectOrder: false,
        details: []
    };

    // Check 1: All mandatory roles present
    for (const mandatory of MANDATORY_ROLES) {
        const found = rows.find(
            r => normalizeRoleName(r.role) === normalizeRoleName(mandatory.role)
        );

        if (!found) {
            result.isValid = false;
            result.missingRoles.push(mandatory.role);
            result.details.push(`❌ Missing mandatory role: ${mandatory.role}`);
        }
    }

    // Check 2: Mandatory roles appear first (in correct order)
    if (result.missingRoles.length === 0 && rows.length >= 3) {
        for (let i = 0; i < MANDATORY_ROLES.length; i++) {
            const expectedRole = MANDATORY_ROLES[i].role;
            const actualRole = rows[i]?.role;

            if (normalizeRoleName(actualRole) !== normalizeRoleName(expectedRole)) {
                result.isValid = false;
                result.incorrectOrder = true;
                result.details.push(
                    `⚠️ Incorrect order: Position ${i + 1} should be "${expectedRole}", ` +
                    `but found "${actualRole}"`
                );
            }
        }
    }

    // Check 3: Hours within acceptable range
    for (const mandatory of MANDATORY_ROLES) {
        const row = rows.find(
            r => normalizeRoleName(r.role) === normalizeRoleName(mandatory.role)
        );

        if (row) {
            if (row.hours < mandatory.minHours || row.hours > mandatory.maxHours) {
                result.isValid = false;
                result.details.push(
                    `⚠️ ${row.role}: Hours ${row.hours} outside acceptable range ` +
                    `(${mandatory.minHours}-${mandatory.maxHours})`
                );
            }
        }
    }

    if (result.isValid) {
        result.details.push('✅ All mandatory roles present and correctly ordered');
    }

    return result;
}

/**
 * Get list of mandatory role names (for UI dropdowns, prompts, etc.)
 */
export function getMandatoryRoleNames(): string[] {
    return MANDATORY_ROLES.map(m => m.role);
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
export function getMandatoryRoleDefinition(roleName: string): MandatoryRoleDefinition | null {
    return isMandatoryRole(roleName);
}

/**
 * Suggest adjustments to bring hours within acceptable range for mandatory roles
 */
export function suggestMandatoryRoleAdjustments(rows: PricingRow[]): string[] {
    const suggestions: string[] = [];

    for (const mandatory of MANDATORY_ROLES) {
        const row = rows.find(
            r => normalizeRoleName(r.role) === normalizeRoleName(mandatory.role)
        );

        if (!row) {
            suggestions.push(
                `Add ${mandatory.role} with ${mandatory.defaultHours} hours (${mandatory.description})`
            );
        } else if (row.hours < mandatory.minHours) {
            suggestions.push(
                `Increase ${row.role} from ${row.hours}h to at least ${mandatory.minHours}h`
            );
        } else if (row.hours > mandatory.maxHours) {
            suggestions.push(
                `Reduce ${row.role} from ${row.hours}h to at most ${mandatory.maxHours}h`
            );
        }
    }

    return suggestions;
}
