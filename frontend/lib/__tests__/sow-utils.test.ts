/**
 * Test Suite: Financial Data Integrity
 * Tests for calculateTotalInvestment() function
 * 
 * Run with: npm test -- frontend/lib/__tests__/sow-utils.test.ts
 */

import { calculateTotalInvestment } from '../sow-utils';

describe('calculateTotalInvestment', () => {
  
  describe('Valid Pricing Tables', () => {
    
    test('calculates total for single line item', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: 40, rate: 250 }
            ]
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(10000);
    });

    test('sums multiple line items correctly', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: 40, rate: 250 },
              { role: 'Developer', hours: 60, rate: 300 },
              { role: 'Project Manager', hours: 20, rate: 200 }
            ]
          }
        }]
      });
      // 40*250 + 60*300 + 20*200 = 10000 + 18000 + 4000 = 32000
      expect(calculateTotalInvestment(content)).toBe(32000);
    });

    test('uses first pricing table only (ignores subsequent tables)', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'editablePricingTable',
            attrs: {
              rows: [
                { role: 'Designer', hours: 40, rate: 250 }
              ]
            }
          },
          {
            type: 'editablePricingTable',
            attrs: {
              rows: [
                { role: 'Developer', hours: 100, rate: 400 }
              ]
            }
          }
        ]
      });
      // Should be 10000 (first table), not 10000 + 40000
      expect(calculateTotalInvestment(content)).toBe(10000);
    });

  });

  describe('Total Row Handling (Critical)', () => {
    
    test('excludes total row from calculation', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: 40, rate: 250 },
              { role: 'Developer', hours: 60, rate: 300 },
              { role: '**Total**', hours: 0, rate: 0 }
            ]
          }
        }]
      });
      // 40*250 + 60*300 = 10000 + 18000 = 28000 (excludes total row)
      expect(calculateTotalInvestment(content)).toBe(28000);
    });

    test('excludes total row regardless of case', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: 40, rate: 250 },
              { role: 'TOTAL', hours: 0, rate: 0 }
            ]
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(10000);
    });

    test('excludes rows with zero or negative rates', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: 40, rate: 250 },
              { role: 'Invalid Row', hours: 20, rate: 0 },
              { role: 'Another Invalid', hours: 10, rate: -50 }
            ]
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(10000);
    });

  });

  describe('Edge Cases & Robustness', () => {
    
    test('returns 0 for empty content', () => {
      expect(calculateTotalInvestment('')).toBe(0);
    });

    test('returns 0 for null content', () => {
      expect(calculateTotalInvestment(null as any)).toBe(0);
    });

    test('returns 0 for undefined content', () => {
      expect(calculateTotalInvestment(undefined as any)).toBe(0);
    });

    test('returns 0 for invalid JSON', () => {
      expect(calculateTotalInvestment('not valid json')).toBe(0);
    });

    test('returns 0 for document without pricing table', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Some text' }] }
        ]
      });
      expect(calculateTotalInvestment(content)).toBe(0);
    });

    test('returns 0 for empty pricing table', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: []
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(0);
    });

    test('handles missing hours field (treated as 0)', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', rate: 250 }
            ]
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(0);
    });

    test('handles missing rate field (treated as 0)', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: 40 }
            ]
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(0);
    });

    test('handles string values for hours and rate (coerced to numbers)', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Designer', hours: '40', rate: '250' }
            ]
          }
        }]
      });
      expect(calculateTotalInvestment(content)).toBe(10000);
    });

  });

  describe('Real-World Scenarios', () => {
    
    test('typical 2-week SOW with 3 roles', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Brand Strategist', hours: 40, rate: 180 },
              { role: 'Visual Designer', hours: 80, rate: 150 },
              { role: 'Developer', hours: 60, rate: 200 },
              { role: '**Total**', hours: 0, rate: 0 }
            ]
          }
        }]
      });
      // 40*180 + 80*150 + 60*200 = 7200 + 12000 + 12000 = 31200
      expect(calculateTotalInvestment(content)).toBe(31200);
    });

    test('high-value retainer SOW', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Account Manager', hours: 160, rate: 220 },
              { role: 'Content Creator', hours: 120, rate: 190 },
              { role: '**Total (Monthly)**', hours: 0, rate: 0 }
            ]
          }
        }]
      });
      // 160*220 + 120*190 = 35200 + 22800 = 58000
      expect(calculateTotalInvestment(content)).toBe(58000);
    });

    test('complex SOW with mixed pricing', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [{
          type: 'editablePricingTable',
          attrs: {
            rows: [
              { role: 'Fractional CMO', hours: 80, rate: 300 },
              { role: 'Strategist', hours: 40, rate: 220 },
              { role: 'Designer', hours: 60, rate: 150 },
              { role: 'Developer', hours: 100, rate: 250 },
              { role: 'QA Tester', hours: 20, rate: 120 },
              { role: '**Total Project Cost**', hours: 0, rate: 0 }
            ]
          }
        }]
      });
      // 80*300 + 40*220 + 60*150 + 100*250 + 20*120
      // = 24000 + 8800 + 9000 + 25000 + 2400 = 69200
      expect(calculateTotalInvestment(content)).toBe(69200);
    });

  });

  describe('Logging & Error Context', () => {
    
    test('logs error context on parsing failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      calculateTotalInvestment('invalid json');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SOW Financial Calculation] Failed to parse SOW content:',
        expect.objectContaining({
          error: expect.any(String),
          contentLength: 12
        })
      );
      
      consoleSpy.mockRestore();
    });

  });

});
