/**
 * Utility functions extracted from page.tsx
 * These functions handle client name extraction, budget calculations, and document processing
 */

import { MultiScopeData } from './types/sow';

/**
 * Extracts client name from content
 */
export function extractClientName(content: string): string | null {
  const patterns = [
    /client[:\s]+([A-Za-z0-9\s&,.'-]+)/i,
    /for[:\s]+([A-Za-z0-9\s&,.'-]+(?:Ltd|LLC|Inc|Corp|Company|Association|Foundation|Institute|Organization))/i,
    /project[:\s]+for[:\s]+([A-Za-z0-9\s&,.'-]+(?:Ltd|LLC|Inc|Corp|Company|Association|Foundation|Institute|Organization))/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extracts budget and discount information from content
 */
export function extractBudgetAndDiscount(content: string): {
  budget: number | null;
  discount: number | null;
} {
  let budget: number | null = null;
  let discount: number | null = null;

  // Budget extraction patterns
  const budgetPatterns = [
    /budget[:\s]*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
    /investment[:\s]*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
    /cost[:\s]*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
    /price[:\s]*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
    /total[:\s]*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
    /\$([0-9,]+(?:\.[0-9]{2})?)(?:\s*(?:ex|in)cl?\.?\s*GST)?/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const budgetValue = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(budgetValue) && budgetValue > 0) {
        budget = budgetValue;
        break;
      }
    }
  }

  // Discount extraction patterns
  const discountPatterns = [
    /discount[:\s]*([0-9]+(?:\.[0-9]{1,2})?)%?/i,
    /([0-9]+(?:\.[0-9]{1,2})?)%?\s*discount/i,
    /off[:\s]*([0-9]+(?:\.[0-9]{1,2})?)%?/i,
    /([0-9]+(?:\.[0-9]{1,2})?)%?\s*off/i,
    /reduction[:\s]*([0-9]+(?:\.[0-9]{1,2})?)%?/i,
  ];

  for (const pattern of discountPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const discountValue = parseFloat(match[1]);
      if (!isNaN(discountValue) && discountValue > 0) {
        discount = discountValue;
        break;
      }
    }
  }

  return { budget, discount };
}

/**
 * Extracts pricing JSON from content
 */
export function extractPricingJSON(content: string): MultiScopeData | null {
  const pricingJsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (!pricingJsonMatch) {
    return null;
  }

  try {
    const parsedJson = JSON.parse(pricingJsonMatch[1]);

    // Validate the structure
    if (!parsedJson || typeof parsedJson !== 'object') {
      return null;
    }

    // Handle single scope format
    if (parsedJson.scope_name && !parsedJson.scopes) {
      return {
        scopes: [{
          scope_name: parsedJson.scope_name,
          scope_description: parsedJson.scope_description || '',
          deliverables: parsedJson.deliverables || [],
          assumptions: parsedJson.assumptions || [],
          role_allocation: parsedJson.role_allocation || []
        }],
        discount: parsedJson.discount || 0,
        extractedAt: Date.now()
      };
    }

    // Handle multi-scope format
    if (parsedJson.scopes && Array.isArray(parsedJson.scopes)) {
      return {
        scopes: parsedJson.scopes,
        discount: parsedJson.discount || 0,
        extractedAt: Date.now()
      };
    }

    // Handle legacy format with flat structure
    if (parsedJson.roles && !parsedJson.scopes) {
      let scopesArray = [];

      if (parsedJson.scope_name) {
        scopesArray.push({
          scope_name: parsedJson.scope_name,
          scope_description: parsedJson.scope_description || '',
          deliverables: parsedJson.deliverables || [],
          assumptions: parsedJson.assumptions || [],
          role_allocation: parsedJson.roles.map((role: any) => ({
            role: role.role || '',
            description: role.description || '',
            hours: role.hours || 0,
            rate: role.rate || 0,
            cost: role.cost || 0
          }))
        });
      } else {
        // Create a default scope if none is specified
        scopesArray.push({
          scope_name: 'Default Scope',
          scope_description: '',
          deliverables: [],
          assumptions: [],
          role_allocation: parsedJson.roles.map((role: any) => ({
            role: role.role || '',
            description: role.description || '',
            hours: role.hours || 0,
            rate: role.rate || 0,
            cost: role.cost || 0
          }))
        });
      }

      const discount = parsedJson.discount || 0;
      const allRoles = parsedJson.roles.map((role: any) => ({
        role: role.role || '',
        description: role.description || '',
        hours: role.hours || 0,
        rate: role.rate || 0,
        cost: role.cost || 0
      }));

      return {
        scopes: scopesArray,
        discount,
        extractedAt: Date.now()
      };
    }

    return null;
  } catch (e) {
    console.error('Error parsing pricing JSON:', e);
    return null;
  }
}

/**
 * Extracts financial reasoning from content
 */
export function extractFinancialReasoning(content: string): string | null {
  const reasoningMatch = content.match(/(?:reasoning|justification|explanation)[:\s]*([^\n]*\n(?:[^\n]*\n)*)/i);
  if (reasoningMatch && reasoningMatch[1]) {
    return reasoningMatch[1].trim();
  }
  return null;
}

/**
 * Sanitizes empty text nodes from editor content
 */
export function sanitizeEmptyTextNodes(content: any): any {
  if (!content) return content;

  const processNode = (node: any): any => {
    if (!node) return null;

    // Create a copy to avoid mutating the original
    const newNode = { ...node };

    // Process children
    if (newNode.content && Array.isArray(newNode.content)) {
      newNode.content = newNode.content
        .map(processNode)
        .filter(Boolean); // Remove null nodes
    }

    // Remove empty text nodes
    if (newNode.type === 'text' && !newNode.text?.trim()) {
      return null;
    }

    return newNode;
  };

  return processNode(content);
}

/**
 * Builds suggested roles from Architect SOW content
 */
export function buildSuggestedRolesFromArchitectSOW(content: string): any[] {
  const hoursByRole: Record<string, number> = {};
  const roles: any[] = [];

  // Extract role information from the content
  const roleMatches = content.matchAll(/(?:role|position)[^:]*[:\s]*([A-Za-z\s]+)[^:]*[:\s]*([0-9.]+)\s*(?:hours?|hrs?)?/gi);

  for (const match of roleMatches) {
    const roleName = match[1].trim();
    const hours = parseFloat(match[2]);

    if (!isNaN(hours) && hours > 0) {
      hoursByRole[roleName] = (hoursByRole[roleName] || 0) + hours;
    }
  }

  // Convert to the expected format
  for (const [roleName, hrs] of Object.entries(hoursByRole)) {
    roles.push({
      role: roleName,
      hours: hrs
    });
  }

  return roles;
}
