/**
 * Centralized Financial Formatters & Calculators
 *
 * PURPOSE: Single Source of Truth for all financial formatting and calculations
 * to ensure 100% consistency across the entire application.
 *
 * PHILOSOPHY: "Sam-Proof" Architecture
 * - ALL currency displays MUST use these formatters
 * - ALL calculations MUST use these functions
 * - NO direct interpolation of dollar amounts anywhere else in codebase
 *
 * This ensures:
 * - +GST suffix on every price display
 * - Consistent commercial rounding
 * - Consistent GST calculation
 * - No financial display bugs possible
 */

/**
 * Format currency with mandatory +GST suffix
 *
 * @param amount - Dollar amount to format
 * @param options - Formatting options
 * @returns Formatted string like "$1,234.56 +GST"
 *
 * @example
 * formatCurrency(1234.56) → "$1,234.56 +GST"
 * formatCurrency(1234.56, { includeGST: false }) → "$1,234.56"
 * formatCurrency(0) → "$0.00 +GST"
 */
export function formatCurrency(
    amount: number,
    options: {
        includeGST?: boolean;
        decimals?: number;
    } = {}
): string {
    const { includeGST = true, decimals = 2 } = options;

    // Validate input
    const validAmount = Number.isFinite(amount) ? amount : 0;

    // Format with thousands separators and fixed decimals
    const formatted = validAmount.toLocaleString("en-AU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    const baseFormatted = `$${formatted}`;

    // ALWAYS include +GST suffix unless explicitly disabled
    return includeGST ? `${baseFormatted} +GST` : baseFormatted;
}

/**
 * Commercial rounding to nearest $100
 *
 * RULE: Round to nearest $100 for all final totals
 * - $12,345 → $12,300 (round down)
 * - $12,350 → $12,400 (round up at midpoint)
 * - $12,399 → $12,400 (round up)
 * - $99 → $100 (round up small amounts)
 * - $0 → $0 (zero stays zero)
 *
 * @param amount - Raw dollar amount
 * @param roundTo - Rounding increment (default: 100)
 * @returns Rounded amount
 *
 * @example
 * roundCommercial(12345) → 12300
 * roundCommercial(12350) → 12400
 * roundCommercial(12399) → 12400
 * roundCommercial(99) → 100
 */
export function roundCommercial(
    amount: number,
    roundTo: number = 100
): number {
    // Validate inputs
    const validAmount = Number.isFinite(amount) ? amount : 0;
    const validRoundTo = roundTo > 0 ? roundTo : 100;

    // Handle zero and negative amounts
    if (validAmount === 0) return 0;
    if (validAmount < 0) {
        // Round negative amounts away from zero (more conservative)
        return -roundCommercial(Math.abs(validAmount), validRoundTo);
    }

    // Standard banker's rounding to nearest increment
    return Math.round(validAmount / validRoundTo) * validRoundTo;
}

/**
 * Calculate GST (Goods and Services Tax) - Australian 10%
 *
 * @param amount - Pre-GST amount
 * @returns GST amount (10% of input)
 *
 * @example
 * calculateGST(1000) → 100
 * calculateGST(12345.67) → 1234.567
 */
export function calculateGST(amount: number): number {
    const validAmount = Number.isFinite(amount) ? amount : 0;
    return validAmount * 0.1;
}

/**
 * Calculate total including GST
 *
 * @param amount - Pre-GST amount
 * @returns Total including 10% GST
 *
 * @example
 * calculateTotalWithGST(1000) → 1100
 */
export function calculateTotalWithGST(amount: number): number {
    const validAmount = Number.isFinite(amount) ? amount : 0;
    return validAmount + calculateGST(validAmount);
}

/**
 * Calculate discount amount
 *
 * @param subtotal - Amount before discount
 * @param discountPercent - Discount percentage (e.g., 5 for 5%)
 * @returns Discount amount
 *
 * @example
 * calculateDiscount(1000, 5) → 50
 * calculateDiscount(1000, 10) → 100
 */
export function calculateDiscount(
    subtotal: number,
    discountPercent: number
): number {
    const validSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
    const validPercent = Number.isFinite(discountPercent) ? discountPercent : 0;

    return validSubtotal * (validPercent / 100);
}

/**
 * Calculate complete SOW financial breakdown
 *
 * This is the Single Source of Truth for all financial calculations.
 * Use this function to ensure consistency across display, export, and validation.
 *
 * @param rows - Pricing table rows
 * @param discountPercent - Discount percentage (optional)
 * @returns Complete financial breakdown
 *
 * @example
 * const breakdown = calculateFinancialBreakdown(rows, 5);
 * console.log(formatCurrency(breakdown.grandTotal)); // "$12,300 +GST"
 */
export interface FinancialBreakdown {
    subtotal: number; // Sum of all (hours * rate)
    discount: number; // Discount amount
    discountPercent: number; // Discount percentage
    subtotalAfterDiscount: number; // Subtotal minus discount
    gst: number; // 10% GST
    totalBeforeRounding: number; // Exact total before commercial rounding
    grandTotal: number; // Final rounded total
    roundingAdjustment: number; // Difference due to rounding
}

export function calculateFinancialBreakdown(
    rows: Array<{ hours: number; rate: number }>,
    discountPercent: number = 0
): FinancialBreakdown {
    // Step 1: Calculate subtotal (sum of all role costs)
    const subtotal = rows.reduce((sum, row) => {
        const hours = Number(row.hours) || 0;
        const rate = Number(row.rate) || 0;
        return sum + hours * rate;
    }, 0);

    // Step 2: Apply discount
    const discount = calculateDiscount(subtotal, discountPercent);
    const subtotalAfterDiscount = subtotal - discount;

    // Step 3: Calculate GST
    const gst = calculateGST(subtotalAfterDiscount);

    // Step 4: Calculate total before rounding
    const totalBeforeRounding = subtotalAfterDiscount + gst;

    // Step 5: Apply commercial rounding
    const grandTotal = roundCommercial(totalBeforeRounding);

    // Step 6: Calculate rounding adjustment (for transparency)
    const roundingAdjustment = grandTotal - totalBeforeRounding;

    return {
        subtotal,
        discount,
        discountPercent,
        subtotalAfterDiscount,
        gst,
        totalBeforeRounding,
        grandTotal,
        roundingAdjustment,
    };
}

/**
 * Format financial breakdown for display
 *
 * @param breakdown - Financial breakdown from calculateFinancialBreakdown
 * @returns Object with formatted strings ready for display
 */
export interface FormattedFinancialBreakdown {
    subtotal: string;
    discount: string;
    subtotalAfterDiscount: string;
    gst: string;
    grandTotal: string;
    roundingNote?: string;
}

export function formatFinancialBreakdown(
    breakdown: FinancialBreakdown
): FormattedFinancialBreakdown {
    const result: FormattedFinancialBreakdown = {
        subtotal: formatCurrency(breakdown.subtotal, { includeGST: false }),
        discount:
            breakdown.discount > 0
                ? `-${formatCurrency(breakdown.discount, { includeGST: false })}`
                : formatCurrency(0, { includeGST: false }),
        subtotalAfterDiscount: formatCurrency(breakdown.subtotalAfterDiscount, {
            includeGST: false,
        }),
        gst: formatCurrency(breakdown.gst, { includeGST: false }),
        grandTotal: formatCurrency(breakdown.grandTotal),
    };

    // Add rounding note if adjustment was significant
    if (Math.abs(breakdown.roundingAdjustment) >= 1) {
        const direction =
            breakdown.roundingAdjustment > 0 ? "up" : "down";
        result.roundingNote = `(Rounded ${direction} by $${Math.abs(breakdown.roundingAdjustment).toFixed(2)} for commercial presentation)`;
    }

    return result;
}

/**
 * Validate budget compliance
 *
 * @param calculatedTotal - Calculated SOW total
 * @param targetBudget - Client's target budget
 * @param tolerance - Acceptable variance (default 2%)
 * @returns Compliance result
 */
export interface BudgetComplianceResult {
    compliant: boolean;
    variance: number; // Decimal (0.05 = 5%)
    variancePercent: number; // Percentage (5)
    difference: number; // Dollar amount over/under
    message: string;
    severity: "ok" | "warning" | "error";
}

export function validateBudgetCompliance(
    calculatedTotal: number,
    targetBudget: number,
    tolerance: number = 0.02 // 2% default
): BudgetComplianceResult {
    const validTotal = Number.isFinite(calculatedTotal) ? calculatedTotal : 0;
    const validBudget = Number.isFinite(targetBudget) ? targetBudget : 0;

    // Calculate variance
    const difference = validTotal - validBudget;
    const variance = validBudget > 0 ? Math.abs(difference) / validBudget : 0;
    const variancePercent = variance * 100;

    // Determine compliance
    let compliant = false;
    let severity: "ok" | "warning" | "error" = "error";
    let message = "";

    if (validBudget === 0) {
        // No budget specified
        compliant = true;
        severity = "ok";
        message = "No budget constraint specified";
    } else if (variance <= tolerance) {
        // Within tolerance
        compliant = true;
        severity = "ok";
        message = `Within budget tolerance (${variancePercent.toFixed(1)}% variance)`;
    } else if (variance <= tolerance * 2) {
        // Moderately over tolerance
        compliant = false;
        severity = "warning";
        message = `Slightly over budget: ${formatCurrency(validTotal)} vs target ${formatCurrency(validBudget)} (${variancePercent.toFixed(1)}% over tolerance)`;
    } else {
        // Significantly over tolerance
        compliant = false;
        severity = "error";
        message = `Significantly over budget: ${formatCurrency(validTotal)} vs target ${formatCurrency(validBudget)} (${variancePercent.toFixed(1)}% variance, max allowed: ${(tolerance * 100).toFixed(0)}%)`;
    }

    return {
        compliant,
        variance,
        variancePercent,
        difference,
        message,
        severity,
    };
}

/**
 * Format percentage
 *
 * @param value - Decimal or percentage value
 * @param asDecimal - Whether input is decimal (0.05) or percent (5)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(5) → "5%"
 * formatPercent(0.05, true) → "5%"
 * formatPercent(12.5) → "12.5%"
 */
export function formatPercent(value: number, asDecimal: boolean = false): string {
    const validValue = Number.isFinite(value) ? value : 0;
    const percent = asDecimal ? validValue * 100 : validValue;
    return `${percent.toFixed(percent % 1 === 0 ? 0 : 1)}%`;
}

/**
 * Parse currency string to number
 * Handles various input formats
 *
 * @param currencyString - String like "$1,234.56" or "1234.56"
 * @returns Numeric value
 *
 * @example
 * parseCurrency("$1,234.56") → 1234.56
 * parseCurrency("1,234") → 1234
 * parseCurrency("invalid") → 0
 */
export function parseCurrency(currencyString: string): number {
    if (!currencyString) return 0;

    // Remove all non-numeric characters except decimal point and minus
    const cleaned = String(currencyString).replace(/[^0-9.-]/g, "");

    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Calculate hourly rate from total cost and hours
 *
 * @param totalCost - Total cost
 * @param hours - Number of hours
 * @returns Hourly rate
 *
 * @example
 * calculateHourlyRate(1000, 10) → 100
 */
export function calculateHourlyRate(totalCost: number, hours: number): number {
    const validCost = Number.isFinite(totalCost) ? totalCost : 0;
    const validHours = Number.isFinite(hours) && hours > 0 ? hours : 1;

    return validCost / validHours;
}

/**
 * Calculate total cost from hours and rate
 *
 * @param hours - Number of hours
 * @param rate - Hourly rate
 * @returns Total cost
 *
 * @example
 * calculateTotalCost(10, 100) → 1000
 */
export function calculateTotalCost(hours: number, rate: number): number {
    const validHours = Number.isFinite(hours) ? hours : 0;
    const validRate = Number.isFinite(rate) ? rate : 0;

    return validHours * validRate;
}

/**
 * USAGE GUIDELINES
 *
 * 1. ALWAYS use formatCurrency() for displaying dollar amounts
 *    ✅ formatCurrency(1234.56)
 *    ❌ `$${amount.toFixed(2)}`
 *
 * 2. ALWAYS use calculateFinancialBreakdown() for totals
 *    ✅ const breakdown = calculateFinancialBreakdown(rows, discount)
 *    ❌ const total = rows.reduce(...) + gst
 *
 * 3. ALWAYS use roundCommercial() for final totals
 *    ✅ roundCommercial(12345.67)
 *    ❌ Math.round(amount)
 *
 * 4. NEVER bypass these formatters
 *    If you need a format not provided here, ADD IT HERE
 *    Don't create one-off formatters in components
 *
 * This ensures:
 * - 100% GST suffix coverage
 * - Consistent rounding everywhere
 * - No financial calculation bugs
 * - Easy to audit and maintain
 */
