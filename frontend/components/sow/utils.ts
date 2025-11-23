/**
 * Utility functions for SOW PDF generation
 */

import { SOWItem, SOWScope, SOWData, ScopeSummary, ProjectTotals, CURRENCIES } from './types';

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (USD, EUR, etc.)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  options: { includeGST?: boolean } = { includeGST: true }
): string => {
  const currencyConfig = CURRENCIES[currency.toUpperCase()] || CURRENCIES.USD;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currencyConfig.decimals,
    maximumFractionDigits: currencyConfig.decimals,
  });
  const base = `${currencyConfig.symbol}${formatted}`;
  return options.includeGST ? `${base} +GST` : base;
};

/**
 * Calculate the total cost for a scope
 * @param items - Array of SOW items
 * @returns Total cost
 */
export const calculateScopeTotal = (items: SOWItem[]): number => {
  return items.reduce((sum, item) => sum + item.cost, 0);
};

/**
 * Calculate the total hours for a scope
 * @param items - Array of SOW items
 * @returns Total hours
 */
export const calculateScopeHours = (items: SOWItem[]): number => {
  return items.reduce((sum, item) => sum + item.hours, 0);
};

/**
 * Calculate the grand total cost across all scopes
 * @param scopes - Array of SOW scopes
 * @returns Grand total cost
 */
export const calculateGrandTotal = (scopes: SOWScope[]): number => {
  return scopes.reduce((sum, scope) => sum + calculateScopeTotal(scope.items), 0);
};

/**
 * Calculate the total hours across all scopes
 * @param scopes - Array of SOW scopes
 * @returns Total hours
 */
export const calculateTotalHours = (scopes: SOWScope[]): number => {
  return scopes.reduce((sum, scope) => sum + calculateScopeHours(scope.items), 0);
};

/**
 * Generate a summary for a single scope
 * @param scope - The scope to summarize
 * @returns Scope summary
 */
export const generateScopeSummary = (scope: SOWScope): ScopeSummary => {
  return {
    scopeId: scope.id,
    scopeTitle: scope.title,
    totalHours: calculateScopeHours(scope.items),
    totalCost: calculateScopeTotal(scope.items),
  };
};

/**
 * Generate project totals and summaries
 * @param scopes - Array of SOW scopes
 * @returns Project totals
 */
export const generateProjectTotals = (scopes: SOWScope[]): ProjectTotals => {
  return {
    totalHours: calculateTotalHours(scopes),
    totalCost: calculateGrandTotal(scopes),
    scopeCount: scopes.length,
    scopeSummaries: scopes.map(generateScopeSummary),
  };
};

/**
 * Validate SOW data structure
 * @param sowData - The SOW data to validate
 * @returns True if valid, throws error if invalid
 */
export const validateSOWData = (sowData: SOWData): boolean => {
  if (!sowData.company?.name) {
    throw new Error('Company name is required');
  }
  
  if (!sowData.clientName) {
    throw new Error('Client name is required');
  }
  
  if (!sowData.projectTitle) {
    throw new Error('Project title is required');
  }
  
  if (!sowData.scopes || sowData.scopes.length === 0) {
    throw new Error('At least one scope is required');
  }
  
  // Validate each scope
  sowData.scopes.forEach((scope, index) => {
    if (!scope.title) {
      throw new Error(`Scope ${index + 1} is missing a title`);
    }
    
    if (!scope.items || scope.items.length === 0) {
      throw new Error(`Scope ${index + 1} has no items`);
    }
    
    // Validate each item
    scope.items.forEach((item, itemIndex) => {
      if (!item.description) {
        throw new Error(`Scope ${index + 1}, Item ${itemIndex + 1} is missing a description`);
      }
      
      if (item.hours < 0) {
        throw new Error(`Scope ${index + 1}, Item ${itemIndex + 1} has negative hours`);
      }
      
      if (item.cost < 0) {
        throw new Error(`Scope ${index + 1}, Item ${itemIndex + 1} has negative cost`);
      }
    });
  });
  
  return true;
};

/**
 * Format a date string
 * @param date - Date to format (string or Date object)
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Generate a filename for the SOW PDF
 * @param clientName - Name of the client
 * @param projectTitle - Title of the project
 * @param date - Optional date (defaults to today)
 * @returns Generated filename
 */
export const generateSOWFilename = (
  clientName: string,
  projectTitle: string,
  date?: Date
): string => {
  const cleanClient = clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const cleanProject = projectTitle
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .substring(0, 50); // Limit length
  const dateStr = (date || new Date()).toISOString().split('T')[0];
  
  return `SOW-${cleanClient}-${cleanProject}-${dateStr}.pdf`;
};

/**
 * Calculate average hourly rate for a scope
 * @param scope - The scope to calculate for
 * @returns Average hourly rate
 */
export const calculateAverageRate = (scope: SOWScope): number => {
  const totalHours = calculateScopeHours(scope.items);
  const totalCost = calculateScopeTotal(scope.items);
  
  if (totalHours === 0) return 0;
  return totalCost / totalHours;
};

/**
 * Group items by role
 * @param items - Array of SOW items
 * @returns Map of role to items
 */
export const groupItemsByRole = (items: SOWItem[]): Map<string, SOWItem[]> => {
  const grouped = new Map<string, SOWItem[]>();
  
  items.forEach(item => {
    if (!grouped.has(item.role)) {
      grouped.set(item.role, []);
    }
    grouped.get(item.role)!.push(item);
  });
  
  return grouped;
};

/**
 * Calculate total cost by role
 * @param items - Array of SOW items
 * @returns Map of role to total cost
 */
export const calculateCostByRole = (items: SOWItem[]): Map<string, number> => {
  const grouped = groupItemsByRole(items);
  const costByRole = new Map<string, number>();
  
  grouped.forEach((roleItems, role) => {
    const totalCost = roleItems.reduce((sum, item) => sum + item.cost, 0);
    costByRole.set(role, totalCost);
  });
  
  return costByRole;
};

/**
 * Calculate total hours by role
 * @param items - Array of SOW items
 * @returns Map of role to total hours
 */
export const calculateHoursByRole = (items: SOWItem[]): Map<string, number> => {
  const grouped = groupItemsByRole(items);
  const hoursByRole = new Map<string, number>();
  
  grouped.forEach((roleItems, role) => {
    const totalHours = roleItems.reduce((sum, item) => sum + item.hours, 0);
    hoursByRole.set(role, totalHours);
  });
  
  return hoursByRole;
};
