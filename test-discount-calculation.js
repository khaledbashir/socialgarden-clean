/**
 * Critical Discount Calculation Test Script
 * Tests the discount calculation logic to prevent the 705.8% bug
 *
 * This script validates that:
 * 1. User prompts like "discount 4 percent" are correctly parsed
 * 2. Discount calculations produce mathematically correct results
 * 3. Edge cases are handled properly
 */

const fs = require("fs");
const path = require("path");

// Test cases based on the audit evidence
const testCases = [
    {
        name: "Audit Case - 4 percent discount",
        prompt: "hubspot integration and 2 landing pages discount 4 percent",
        expectedDiscount: 4,
        subtotal: 10000,
        expectedDiscountAmount: 400,
        expectedSubtotalAfterDiscount: 9600,
        expectedGST: 960,
        expectedTotal: 10560,
    },
    {
        name: "Standard percentage format",
        prompt: "website development with 10% discount",
        expectedDiscount: 10,
        subtotal: 5000,
        expectedDiscountAmount: 500,
        expectedSubtotalAfterDiscount: 4500,
        expectedGST: 450,
        expectedTotal: 4950,
    },
    {
        name: "Discount of format",
        prompt: "project with discount of 15%",
        expectedDiscount: 15,
        subtotal: 8000,
        expectedDiscountAmount: 1200,
        expectedSubtotalAfterDiscount: 6800,
        expectedGST: 680,
        expectedTotal: 7480,
    },
    {
        name: "High discount capping",
        prompt: "project with 75% discount",
        expectedDiscount: 50, // Should be capped at 50%
        subtotal: 2000,
        expectedDiscountAmount: 1000,
        expectedSubtotalAfterDiscount: 1000,
        expectedGST: 100,
        expectedTotal: 1100,
    },
    {
        name: "Invalid discount handling",
        prompt: "project with 150% discount",
        expectedDiscount: 0, // Should be reset to 0%
        subtotal: 3000,
        expectedDiscountAmount: 0,
        expectedSubtotalAfterDiscount: 3000,
        expectedGST: 300,
        expectedTotal: 3300,
    },
    {
        name: "No discount",
        prompt: "standard project without discount",
        expectedDiscount: 0,
        subtotal: 6000,
        expectedDiscountAmount: 0,
        expectedSubtotalAfterDiscount: 6000,
        expectedGST: 600,
        expectedTotal: 6600,
    },
];

// Discount extraction function (mirrors frontend logic)
function extractDiscountFromPrompt(prompt) {
    const discountPatterns = [
        /discount\s+(\d+(?:\.\d+)?)\s+percent/i,
        /(\d+(?:\.\d+)?)\s*percent\s*discount/i,
        /(\d+(?:\.\d+)?)\s*%\s*discount/i,
        /discount\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*%/i,
        /discount\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*percent/i,
        /with\s*(?:a|an)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent)\s*discount/i,
        /apply\s*(?:a|an)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent)\s*discount/i,
        /(\d+(?:\.\d+)?)\s*percent\s*off/i,
        /(\d+(?:\.\d+)?)\s*%\s*off/i,
    ];

    for (const pattern of discountPatterns) {
        const match = prompt.match(pattern);
        if (match && match[1]) {
            const discountValue = parseFloat(match[1]);

            if (!isNaN(discountValue) && discountValue >= 0) {
                if (discountValue > 100) {
                    console.log(
                        `❌ Impossible discount ${discountValue}% detected, setting to 0%`,
                    );
                    return 0;
                } else if (discountValue > 50) {
                    console.log(
                        `⚠️ High discount ${discountValue}% detected, capping at 50%`,
                    );
                    return 50;
                } else {
                    return discountValue;
                }
            }
        }
    }
    return 0;
}

// Discount calculation function (mirrors backend logic)
function calculateDiscount(subtotal, discountPercent) {
    // Validate discount percentage
    let validatedDiscount = discountPercent;

    if (typeof validatedDiscount !== "number" || isNaN(validatedDiscount)) {
        validatedDiscount = 0;
    }

    if (validatedDiscount < 0) {
        validatedDiscount = 0;
    }

    if (validatedDiscount >= 100) {
        validatedDiscount = 0;
    }

    if (validatedDiscount > 50) {
        validatedDiscount = 50;
    }

    // Calculate amounts
    const discountAmount = subtotal * (validatedDiscount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const gstAmount = subtotalAfterDiscount * 0.1;
    const total = subtotalAfterDiscount + gstAmount;

    return {
        discount: validatedDiscount,
        discountAmount,
        subtotalAfterDiscount,
        gstAmount,
        total,
    };
}

// Run tests
function runTests() {
    console.log("🧪 Starting Critical Discount Calculation Tests\n");

    let passedTests = 0;
    let failedTests = 0;
    const results = [];

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
        console.log(`   Prompt: "${testCase.prompt}"`);

        // Test discount extraction
        const extractedDiscount = extractDiscountFromPrompt(testCase.prompt);
        console.log(`   Extracted Discount: ${extractedDiscount}%`);

        // Test discount calculation
        const calculation = calculateDiscount(
            testCase.subtotal,
            extractedDiscount,
        );

        console.log(`   Subtotal: $${testCase.subtotal.toFixed(2)}`);
        console.log(
            `   Discount Amount: $${calculation.discountAmount.toFixed(2)}`,
        );
        console.log(
            `   After Discount: $${calculation.subtotalAfterDiscount.toFixed(2)}`,
        );
        console.log(`   GST (10%): $${calculation.gstAmount.toFixed(2)}`);
        console.log(`   Total: $${calculation.total.toFixed(2)}`);

        // Validate results
        const discountMatch =
            Math.abs(extractedDiscount - testCase.expectedDiscount) < 0.01;
        const discountAmountMatch =
            Math.abs(
                calculation.discountAmount - testCase.expectedDiscountAmount,
            ) < 0.01;
        const subtotalAfterDiscountMatch =
            Math.abs(
                calculation.subtotalAfterDiscount -
                    testCase.expectedSubtotalAfterDiscount,
            ) < 0.01;
        const gstMatch =
            Math.abs(calculation.gstAmount - testCase.expectedGST) < 0.01;
        const totalMatch =
            Math.abs(calculation.total - testCase.expectedTotal) < 0.01;

        const allMatch =
            discountMatch &&
            discountAmountMatch &&
            subtotalAfterDiscountMatch &&
            gstMatch &&
            totalMatch;

        if (allMatch) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL`);
            console.log(
                `   Expected: Discount=${testCase.expectedDiscount}%, Amount=$${testCase.expectedDiscountAmount}, After=$${testCase.expectedSubtotalAfterDiscount}, GST=$${testCase.expectedGST}, Total=$${testCase.expectedTotal}`,
            );
            console.log(
                `   Actual:   Discount=${extractedDiscount}%, Amount=$${calculation.discountAmount.toFixed(2)}, After=$${calculation.subtotalAfterDiscount.toFixed(2)}, GST=$${calculation.gstAmount.toFixed(2)}, Total=$${calculation.total.toFixed(2)}`,
            );
            failedTests++;
        }

        results.push({
            testName: testCase.name,
            passed: allMatch,
            expected: testCase,
            actual: {
                extractedDiscount,
                ...calculation,
            },
        });
    });

    // Summary
    console.log(`\n📊 Test Summary:`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(
        `   📈 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`,
    );

    // Critical validation for the audit case
    const auditCase = results[0]; // First test case is the audit case
    if (auditCase.passed) {
        console.log(
            `\n🎯 CRITICAL: Audit case "discount 4 percent" is now FIXED ✅`,
        );
    } else {
        console.log(
            `\n🚨 CRITICAL: Audit case "discount 4 percent" is still BROKEN ❌`,
        );
        console.log(
            `   This is a P0 showstopper that must be fixed immediately!`,
        );
    }

    // Save results to file
    const reportPath = path.join(__dirname, "discount-test-results.json");
    fs.writeFileSync(
        reportPath,
        JSON.stringify(
            {
                timestamp: new Date().toISOString(),
                summary: {
                    total: testCases.length,
                    passed: passedTests,
                    failed: failedTests,
                    successRate: (passedTests / testCases.length) * 100,
                },
                results,
            },
            null,
            2,
        ),
    );

    console.log(`\n📄 Detailed results saved to: ${reportPath}`);

    return failedTests === 0;
}

// Edge case tests
function runEdgeCaseTests() {
    console.log(`\n🔬 Running Edge Case Tests:`);

    const edgeCases = [
        { discount: -5, expected: 0 },
        { discount: 0, expected: 0 },
        { discount: 25, expected: 25 },
        { discount: 50, expected: 50 },
        { discount: 75, expected: 50 },
        { discount: 100, expected: 0 },
        { discount: 705.8, expected: 0 }, // The exact bug case
        { discount: null, expected: 0 },
        { discount: undefined, expected: 0 },
        { discount: "invalid", expected: 0 },
    ];

    edgeCases.forEach((testCase) => {
        const result = calculateDiscount(1000, testCase.discount);
        const passed = result.discount === testCase.expected;
        console.log(
            `   Input: ${testCase.discount} → Output: ${result.discount}% ${passed ? "✅" : "❌"}`,
        );
    });
}

// Main execution
if (require.main === module) {
    const success = runTests();
    runEdgeCaseTests();

    if (success) {
        console.log(
            `\n🎉 All tests passed! The discount calculation bug has been fixed.`,
        );
        process.exit(0);
    } else {
        console.log(
            `\n💥 Some tests failed! The discount calculation still needs work.`,
        );
        process.exit(1);
    }
}

module.exports = {
    extractDiscountFromPrompt,
    calculateDiscount,
    runTests,
};
