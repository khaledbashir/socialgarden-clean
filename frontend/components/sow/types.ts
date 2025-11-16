/**
 * Type definitions for SOW (Statement of Work) PDF Export
 * These types define the structure of data needed for generating SOW PDFs
 */

/**
 * Individual line item within a scope
 */
export interface SOWItem {
    /** Description of the work item/task */
    description: string;

    /** Role or job title performing this item */
    role: string;

    /** Estimated hours for this item */
    hours: number;

    /** Total cost for this item (including any applicable taxes) */
    cost: number;
}

/**
 * A single scope/phase of the project
 */
export interface SOWScope {
    /** Unique identifier for the scope */
    id: number;

    /** Title/name of the scope */
    title: string;

    /** Detailed description of what this scope covers */
    description: string;

    /** List of work items in this scope */
    items: SOWItem[];

    /** List of deliverables for this scope */
    deliverables: string[];

    /** List of assumptions for this scope */
    assumptions: string[];
}

/**
 * Company information for the SOW
 */
export interface SOWCompany {
    /** Company name */
    name: string;

    /** Optional URL or path to company logo */
    logoUrl?: string;
}

/**
 * Complete SOW data structure
 */
export interface SOWData {
    /** Company providing the services */
    company: SOWCompany;

    /** Name of the client receiving the services */
    clientName: string;

    /** Main title of the project */
    projectTitle: string;

    /** Subtitle or category (e.g., "ADVISORY & CONSULTATION | SERVICES") */
    projectSubtitle: string;

    /** High-level overview of the project */
    projectOverview: string;

    /** Budget-related notes and payment terms */
    budgetNotes: string;

    /** List of project scopes */
    scopes: SOWScope[];

    /** Currency code (e.g., "USD", "EUR", "GBP") */
    currency: string;

    /** Whether GST/VAT is applicable */
    gstApplicable: boolean;

    /** Date the SOW was generated */
    generatedDate: string;

    /** Optional discount percentage (e.g., 3 for 3% discount) */
    discount?: number;
}

/**
 * Props for the SOW PDF Export component
 */
export interface SOWPdfExportProps {
    /** Complete SOW data */
    sowData: SOWData;
}

/**
 * Props for the SOW PDF Export Wrapper component
 */
export interface SOWPdfExportWrapperProps {
    /** Complete SOW data */
    sowData: SOWData;

    /** Optional custom filename for the PDF download */
    fileName?: string;

    /** Variant style: 'default' for demo/standalone, 'portal' for SOW portal page, 'editor' for main editor */
    variant?: "default" | "portal" | "editor";
}

/**
 * Helper type for calculating totals
 */
export interface ScopeSummary {
    /** Scope ID */
    scopeId: number;

    /** Scope title */
    scopeTitle: string;

    /** Total hours for this scope */
    totalHours: number;

    /** Total cost for this scope */
    totalCost: number;
}

/**
 * Helper type for project totals
 */
export interface ProjectTotals {
    /** Total hours across all scopes */
    totalHours: number;

    /** Total cost across all scopes */
    totalCost: number;

    /** Number of scopes */
    scopeCount: number;

    /** Summary of each scope */
    scopeSummaries: ScopeSummary[];
}

/**
 * Currency configuration
 */
export interface CurrencyConfig {
    /** Currency code */
    code: string;

    /** Currency symbol */
    symbol: string;

    /** Decimal places to show */
    decimals: number;
}

/**
 * Common currency configurations
 */
export const CURRENCIES: Record<string, CurrencyConfig> = {
    USD: { code: "USD", symbol: "$", decimals: 0 },
    EUR: { code: "EUR", symbol: "€", decimals: 0 },
    GBP: { code: "GBP", symbol: "£", decimals: 0 },
    AUD: { code: "AUD", symbol: "A$", decimals: 0 },
    CAD: { code: "CAD", symbol: "C$", decimals: 0 },
};
