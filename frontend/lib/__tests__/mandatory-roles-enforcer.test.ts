/**
 * Test Suite: Mandatory Roles Enforcer
 *
 * PURPOSE: Verify that mandatory role enforcement is bulletproof
 * and cannot be bypassed by AI or user input.
 *
 * PHILOSOPHY: "Sam-Proof" Architecture Testing
 * - Test every failure scenario
 * - Ensure system cannot generate non-compliant SOWs
 * - Validate that AI suggestions are properly sanitized
 */

import {
    enforceMandatoryRoles,
    validateMandatoryRoles,
    getMandatoryRoleNames,
    isRoleMandatory,
    getMandatoryRoleDefinition,
    suggestMandatoryRoleAdjustments,
    MANDATORY_ROLES,
    type RoleRate,
    type PricingRow,
} from "../mandatory-roles-enforcer";

describe("Mandatory Roles Enforcer", () => {
    // Mock Rate Card with mandatory and additional roles
    const mockRateCard: RoleRate[] = [
        // Mandatory roles (MUST be present)
        {
            roleName: "Tech - Head Of - Senior Project Management",
            hourlyRate: 365,
        },
        { roleName: "Tech - Delivery - Project Coordination", hourlyRate: 110 },
        {
            roleName: "Account Management - Senior Account Manager",
            hourlyRate: 210,
        },
        // Additional roles
        { roleName: "Senior Developer", hourlyRate: 200 },
        { roleName: "QA Engineer", hourlyRate: 140 },
        { roleName: "UI/UX Designer", hourlyRate: 170 },
    ];

    describe("enforceMandatoryRoles()", () => {
        describe("CRITICAL: AI Returns Empty Roles Array", () => {
            test("Should inject all 3 mandatory roles with default hours in correct order", () => {
                const aiSuggestedRoles: PricingRow[] = [];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // Must have exactly 3 roles (the mandatory ones)
                expect(result).toHaveLength(3);

                // Check first mandatory role (Head Of at TOP)
                expect(result[0].role).toBe(
                    "Tech - Head Of - Senior Project Management",
                );
                expect(result[0].hours).toBe(8); // Default hours
                expect(result[0].rate).toBe(365); // Rate from Rate Card

                // Check second mandatory role (Delivery)
                expect(result[1].role).toBe(
                    "Tech - Delivery - Project Coordination",
                );
                expect(result[1].hours).toBe(6); // Default hours
                expect(result[1].rate).toBe(110); // Rate from Rate Card

                // Check third mandatory role (Account Management at BOTTOM)
                expect(result[2].role).toBe(
                    "Account Management - Senior Account Manager",
                );
                expect(result[2].hours).toBe(8); // Default hours
                expect(result[2].rate).toBe(210); // Rate from Rate Card
            });
        });

        describe("CRITICAL: AI Returns Partial Roles (Missing One Mandatory)", () => {
            test("Should inject missing mandatory roles in correct order", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "Tech - Head Of - Senior Project Management",
                        hours: 10,
                        rate: 999, // Wrong rate (should be overridden)
                        description: "AI provided this",
                    },
                    {
                        id: "ai-2",
                        role: "Senior Developer",
                        hours: 100,
                        rate: 200,
                        description: "Development work",
                    },
                    // MISSING: Tech - Delivery - Project Coordination
                    // MISSING: Account Management - Senior Account Manager
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // Should have 3 mandatory + 1 additional = 4 total
                expect(result).toHaveLength(4);

                // First 3 MUST be mandatory roles
                expect(result[0].role).toBe(
                    "Tech - Head Of - Senior Project Management",
                );
                expect(result[0].hours).toBe(10); // AI's hours used
                expect(result[0].rate).toBe(365); // Rate Card rate (NOT 999)

                expect(result[1].role).toBe(
                    "Tech - Delivery - Project Coordination",
                );
                expect(result[1].hours).toBe(6); // Default (was missing)

                expect(result[2].role).toBe(
                    "Account Management - Senior Account Manager",
                );
                expect(result[2].hours).toBe(8); // Default (was missing)

                // Fourth should be the additional role
                expect(result[3].role).toBe("Senior Developer");
            });
        });

        describe("CRITICAL: AI Uses Abbreviated/Wrong Role Names", () => {
            test("Should normalize and match roles correctly", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "tech head of senior project management", // Lowercase, no hyphens
                        hours: 8,
                        rate: 999,
                        description: "",
                    },
                    {
                        id: "ai-2",
                        role: "Tech-Delivery-Project Coordination", // Different separators
                        hours: 6,
                        rate: 999,
                        description: "",
                    },
                    {
                        id: "ai-3",
                        role: "AccountManagementSeniorAccountManager", // No spaces
                        hours: 8,
                        rate: 999,
                        description: "",
                    },
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // Should recognize all 3 as mandatory roles and normalize them
                expect(result).toHaveLength(3);
                expect(result[0].role).toBe(
                    "Tech - Head Of - Senior Project Management",
                );
                expect(result[1].role).toBe(
                    "Tech - Delivery - Project Coordination",
                );
                expect(result[2].role).toBe(
                    "Account Management - Senior Account Manager",
                );

                // All should have official Rate Card rates
                expect(result[0].rate).toBe(365);
                expect(result[1].rate).toBe(110);
                expect(result[2].rate).toBe(210);
            });
        });

        describe("CRITICAL: AI Suggests Wrong Rates", () => {
            test("Should ALWAYS override with Rate Card rates", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "Tech - Head Of - Senior Project Management",
                        hours: 8,
                        rate: 999999, // Malicious rate
                        description: "",
                    },
                    {
                        id: "ai-2",
                        role: "Tech - Delivery - Project Coordination",
                        hours: 6,
                        rate: 1, // Too low rate
                        description: "",
                    },
                    {
                        id: "ai-3",
                        role: "Account Management - Senior Account Manager",
                        hours: 8,
                        rate: 0, // Zero rate
                        description: "",
                    },
                    {
                        id: "ai-4",
                        role: "Senior Developer",
                        hours: 50,
                        rate: 999, // Wrong rate for additional role
                        description: "",
                    },
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // ALL rates must be from Rate Card
                expect(result[0].rate).toBe(365); // NOT 999999
                expect(result[1].rate).toBe(110); // NOT 1
                expect(result[2].rate).toBe(210); // NOT 0
                expect(result[3].rate).toBe(200); // NOT 999

                // Verify no AI rates survived
                expect(result.some((r) => r.rate === 999999)).toBe(false);
                expect(result.some((r) => r.rate === 999)).toBe(false);
                expect(result.some((r) => r.rate === 1)).toBe(false);
            });
        });

        describe("CRITICAL: Mandatory Roles Ordering", () => {
            test("Should always place mandatory roles at positions 1-3", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "Senior Developer",
                        hours: 100,
                        rate: 200,
                        description: "",
                    },
                    {
                        id: "ai-2",
                        role: "QA Engineer",
                        hours: 20,
                        rate: 140,
                        description: "",
                    },
                    // AI forgot mandatory roles entirely
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // First 3 positions MUST be mandatory roles
                expect(result[0].role).toBe(
                    "Tech - Head Of - Senior Project Management",
                );
                expect(result[1].role).toBe(
                    "Tech - Delivery - Project Coordination",
                );
                expect(result[2].role).toBe(
                    "Account Management - Senior Account Manager",
                );

                // AI's roles should come AFTER
                expect(result[3].role).toBe("Senior Developer");
                expect(result[4].role).toBe("QA Engineer");
            });
        });

        describe("CRITICAL: Invalid Roles Not in Rate Card", () => {
            test("Should reject roles not in Rate Card", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "Tech - Head Of - Senior Project Management",
                        hours: 8,
                        rate: 365,
                        description: "",
                    },
                    {
                        id: "ai-2",
                        role: "Tech - Delivery - Project Coordination",
                        hours: 6,
                        rate: 110,
                        description: "",
                    },
                    {
                        id: "ai-3",
                        role: "Account Management - Senior Account Manager",
                        hours: 8,
                        rate: 210,
                        description: "",
                    },
                    {
                        id: "ai-4",
                        role: "Blockchain Ninja", // NOT IN RATE CARD
                        hours: 50,
                        rate: 300,
                        description: "",
                    },
                    {
                        id: "ai-5",
                        role: "AI Prompt Engineer", // NOT IN RATE CARD
                        hours: 30,
                        rate: 250,
                        description: "",
                    },
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // Should only have mandatory roles (invalid roles rejected)
                expect(result).toHaveLength(3);
                expect(result.map((r) => r.role)).not.toContain(
                    "Blockchain Ninja",
                );
                expect(result.map((r) => r.role)).not.toContain(
                    "AI Prompt Engineer",
                );
            });
        });

        describe("CRITICAL: Hours Validation", () => {
            test("Should clamp hours to acceptable range for mandatory roles", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "Tech - Head Of - Senior Project Management",
                        hours: 100, // Way too high (max: 15)
                        rate: 365,
                        description: "",
                    },
                    {
                        id: "ai-2",
                        role: "Tech - Delivery - Project Coordination",
                        hours: 1, // Too low (min: 3)
                        rate: 110,
                        description: "",
                    },
                    {
                        id: "ai-3",
                        role: "Account Management - Senior Account Manager",
                        hours: 8, // Within range (6-12)
                        rate: 210,
                        description: "",
                    },
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // Hours should be clamped to acceptable range
                expect(result[0].hours).toBe(15); // Clamped from 100 to max 15
                expect(result[1].hours).toBe(3); // Clamped from 1 to min 3
                expect(result[2].hours).toBe(8); // Unchanged (within range)
            });

            test("Should handle negative or zero hours", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    {
                        id: "ai-1",
                        role: "Tech - Head Of - Senior Project Management",
                        hours: -10, // Negative
                        rate: 365,
                        description: "",
                    },
                    {
                        id: "ai-2",
                        role: "Tech - Delivery - Project Coordination",
                        hours: 0, // Zero
                        rate: 110,
                        description: "",
                    },
                    {
                        id: "ai-3",
                        role: "Account Management - Senior Account Manager",
                        hours: NaN, // Invalid
                        rate: 210,
                        description: "",
                    },
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // All should be clamped to minimum hours
                expect(result[0].hours).toBeGreaterThanOrEqual(5); // Min for this role
                expect(result[1].hours).toBeGreaterThanOrEqual(3); // Min for this role
                expect(result[2].hours).toBeGreaterThanOrEqual(6); // Min for this role
            });
        });

        describe("Edge Case: Mandatory Role Missing From Rate Card", () => {
            test("Should throw error if mandatory role not in Rate Card", () => {
                const incompleteRateCard: RoleRate[] = [
                    {
                        roleName: "Tech - Head Of - Senior Project Management",
                        hourlyRate: 365,
                    },
                    // MISSING: Tech - Delivery - Project Coordination
                    // MISSING: Account Management - Senior Account Manager
                ];

                const aiSuggestedRoles: PricingRow[] = [];

                // Should throw when trying to inject Delivery role
                expect(() =>
                    enforceMandatoryRoles(aiSuggestedRoles, incompleteRateCard),
                ).toThrow("missing from Rate Card");
            });
        });

        describe("INTEGRATION: Complex Real-World Scenario", () => {
            test("Should handle complex SOW with all edge cases", () => {
                const aiSuggestedRoles: PricingRow[] = [
                    // Mandatory role with wrong rate and hours
                    {
                        id: "ai-1",
                        role: "tech head of senior project management",
                        hours: 200,
                        rate: 999,
                        description: "Strategic oversight",
                    },
                    // Missing: Tech - Delivery - Project Coordination
                    // Duplicate mandatory role (should be deduplicated)
                    {
                        id: "ai-2",
                        role: "Account Management - Senior Account Manager",
                        hours: 10,
                        rate: 500,
                        description: "Client comms",
                    },
                    // Valid additional roles
                    {
                        id: "ai-3",
                        role: "Senior Developer",
                        hours: 80,
                        rate: 999,
                        description: "Development",
                    },
                    {
                        id: "ai-4",
                        role: "QA Engineer",
                        hours: 20,
                        rate: 999,
                        description: "Testing",
                    },
                    // Invalid role (not in Rate Card)
                    {
                        id: "ai-5",
                        role: "Scrum Master",
                        hours: 40,
                        rate: 180,
                        description: "Agile ceremonies",
                    },
                ];

                const result = enforceMandatoryRoles(
                    aiSuggestedRoles,
                    mockRateCard,
                );

                // Verify mandatory roles
                expect(result[0].role).toBe(
                    "Tech - Head Of - Senior Project Management",
                );
                expect(result[0].hours).toBe(15); // Clamped from 200
                expect(result[0].rate).toBe(365); // From Rate Card

                expect(result[1].role).toBe(
                    "Tech - Delivery - Project Coordination",
                );
                expect(result[1].hours).toBe(6); // Default (was missing)
                expect(result[1].rate).toBe(110); // From Rate Card

                expect(result[2].role).toBe(
                    "Account Management - Senior Account Manager",
                );
                expect(result[2].hours).toBe(10); // AI's hours (within range)
                expect(result[2].rate).toBe(210); // From Rate Card (NOT 500)

                // Verify additional roles (invalid role excluded)
                expect(result).toHaveLength(5); // 3 mandatory + 2 valid additional
                expect(result[3].role).toBe("Senior Developer");
                expect(result[3].rate).toBe(200); // From Rate Card
                expect(result[4].role).toBe("QA Engineer");
                expect(result[4].rate).toBe(140); // From Rate Card

                // Verify invalid role was rejected
                expect(result.map((r) => r.role)).not.toContain("Scrum Master");
            });
        });
    });

    describe("validateMandatoryRoles()", () => {
        test("Should pass validation for compliant table with correct ordering", () => {
            const compliantRows: PricingRow[] = [
                {
                    id: "1",
                    role: "Tech - Head Of - Senior Project Management",
                    hours: 8,
                    rate: 365,
                    description: "",
                },
                {
                    id: "2",
                    role: "Tech - Delivery - Project Coordination",
                    hours: 6,
                    rate: 110,
                    description: "",
                },
                {
                    id: "3",
                    role: "Account Management - Senior Account Manager",
                    hours: 8,
                    rate: 210,
                    description: "",
                },
            ];

            const result = validateMandatoryRoles(compliantRows);

            expect(result.isValid).toBe(true);
            expect(result.missingRoles).toHaveLength(0);
            expect(result.incorrectOrder).toBe(false);
        });

        test("Should fail validation if mandatory role missing", () => {
            const incompliantRows: PricingRow[] = [
                {
                    id: "1",
                    role: "Tech - Head Of - Senior Project Management",
                    hours: 10,
                    rate: 365,
                    description: "",
                },
                {
                    id: "2",
                    role: "Tech - Delivery - Project Coordination",
                    hours: 6,
                    rate: 110,
                    description: "",
                },
                // MISSING: Account Management - Senior Account Manager
            ];

            const result = validateMandatoryRoles(incompliantRows);

            expect(result.isValid).toBe(false);
            expect(result.missingRoles).toContain(
                "Account Management - Senior Account Manager",
            );
        });

        test("Should fail validation for incorrect ordering", () => {
            const wrongOrderRows: PricingRow[] = [
                {
                    id: "1",
                    role: "Account Management - Senior Account Manager",
                    hours: 8,
                    rate: 210,
                    description: "",
                }, // Should be LAST
                {
                    id: "2",
                    role: "Tech - Delivery - Project Coordination",
                    hours: 6,
                    rate: 110,
                    description: "",
                }, // Should be 2nd
                {
                    id: "3",
                    role: "Tech - Head Of - Senior Project Management",
                    hours: 8,
                    rate: 365,
                    description: "",
                }, // Should be FIRST
            ];

            const result = validateMandatoryRoles(wrongOrderRows);

            expect(result.isValid).toBe(false);
            expect(result.incorrectOrder).toBe(true);
        });

        test("Should fail validation for hours outside acceptable range", () => {
            const invalidHoursRows: PricingRow[] = [
                {
                    id: "1",
                    role: "Tech - Head Of - Senior Project Management",
                    hours: 100, // Too high (max: 15)
                    rate: 365,
                    description: "",
                },
                {
                    id: "2",
                    role: "Tech - Delivery - Project Coordination",
                    hours: 6,
                    rate: 110,
                    description: "",
                },
                {
                    id: "3",
                    role: "Account Management - Senior Account Manager",
                    hours: 2, // Too low (min: 6)
                    rate: 210,
                    description: "",
                },
            ];

            const result = validateMandatoryRoles(invalidHoursRows);

            expect(result.isValid).toBe(false);
            expect(result.details.length).toBeGreaterThan(0);
        });
    });

    describe("Helper Functions", () => {
        test("getMandatoryRoleNames() should return all 3 mandatory role names", () => {
            const names = getMandatoryRoleNames();

            expect(names).toHaveLength(3);
            expect(names).toContain(
                "Tech - Head Of - Senior Project Management",
            );
            expect(names).toContain("Tech - Delivery - Project Coordination");
            expect(names).toContain(
                "Account Management - Senior Account Manager",
            );
        });

        test("isRoleMandatory() should correctly identify mandatory roles", () => {
            expect(
                isRoleMandatory("Tech - Head Of - Senior Project Management"),
            ).toBe(true);
            expect(
                isRoleMandatory("Tech - Delivery - Project Coordination"),
            ).toBe(true);
            expect(
                isRoleMandatory("Account Management - Senior Account Manager"),
            ).toBe(true);
            expect(isRoleMandatory("Senior Developer")).toBe(false);
            expect(isRoleMandatory("QA Engineer")).toBe(false);
        });

        test("getMandatoryRoleDefinition() should return correct definition", () => {
            const def = getMandatoryRoleDefinition(
                "Tech - Head Of - Senior Project Management",
            );

            expect(def).not.toBeNull();
            expect(def?.minHours).toBe(5);
            expect(def?.maxHours).toBe(15);
            expect(def?.defaultHours).toBe(8);
        });

        test("suggestMandatoryRoleAdjustments() should suggest fixes", () => {
            const rowsWithIssues: PricingRow[] = [
                {
                    id: "1",
                    role: "Tech - Head Of - Senior Project Management",
                    hours: 2, // Too low
                    rate: 365,
                    description: "",
                },
                // MISSING: Tech - Delivery - Project Coordination
                {
                    id: "2",
                    role: "Account Management - Senior Account Manager",
                    hours: 20, // Too high
                    rate: 210,
                    description: "",
                },
            ];

            const suggestions = suggestMandatoryRoleAdjustments(rowsWithIssues);

            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.some((s) => s.includes("Increase"))).toBe(true);
            expect(suggestions.some((s) => s.includes("Add"))).toBe(true);
            expect(suggestions.some((s) => s.includes("Reduce"))).toBe(true);
        });
    });

    describe("MANDATORY_ROLES Constant", () => {
        test("Should have exactly 3 mandatory roles defined", () => {
            expect(MANDATORY_ROLES).toHaveLength(3);
        });

        test("Each mandatory role should have required properties", () => {
            MANDATORY_ROLES.forEach((role) => {
                expect(role).toHaveProperty("role");
                expect(role).toHaveProperty("minHours");
                expect(role).toHaveProperty("maxHours");
                expect(role).toHaveProperty("defaultHours");
                expect(role).toHaveProperty("description");
                expect(role).toHaveProperty("order");

                expect(role.minHours).toBeGreaterThan(0);
                expect(role.maxHours).toBeGreaterThan(role.minHours);
                expect(role.defaultHours).toBeGreaterThanOrEqual(role.minHours);
                expect(role.defaultHours).toBeLessThanOrEqual(role.maxHours);
            });
        });

        test("Roles should be ordered sequentially", () => {
            expect(MANDATORY_ROLES[0].order).toBe(1);
            expect(MANDATORY_ROLES[1].order).toBe(2);
            expect(MANDATORY_ROLES[2].order).toBe(3);
        });
    });
});
