/**
 * SOW PDF Export Module
 * 
 * A complete system for generating professional Statement of Work (SOW) PDFs
 * using @react-pdf/renderer.
 * 
 * @example
 * ```tsx
 * import { SOWPdfExportWrapper } from '@/components/sow';
 * import type { SOWData } from '@/components/sow';
 * 
 * const mySOWData: SOWData = { ... };
 * 
 * <SOWPdfExportWrapper sowData={mySOWData} fileName="My-SOW.pdf" />
 * ```
 */

// Main components
export { default as SOWPdfExport } from './SOWPdfExport';
export { default as SOWPdfExportWrapper } from './SOWPdfExportWrapper';
export { default as SOWPdfExportExample } from './SOWPdfExportExample';

// Types
export type {
  SOWItem,
  SOWScope,
  SOWCompany,
  SOWData,
  SOWPdfExportProps,
  SOWPdfExportWrapperProps,
  ScopeSummary,
  ProjectTotals,
  CurrencyConfig,
} from './types';

export { CURRENCIES } from './types';

// Utilities
export {
  formatCurrency,
  calculateScopeTotal,
  calculateScopeHours,
  calculateGrandTotal,
  calculateTotalHours,
  generateScopeSummary,
  generateProjectTotals,
  validateSOWData,
  formatDate,
  generateSOWFilename,
  calculateAverageRate,
  groupItemsByRole,
  calculateCostByRole,
  calculateHoursByRole,
} from './utils';
