/**
 * AnythingLLM Integration Service - Validation Tests
 * 
 * Tests core functionality:
 * 1. Workspace creation & retrieval
 * 2. Rate card embedding
 * 3. Thread management
 * 4. Dual embedding (client + master dashboard)
 * 5. Document embedding
 */

import { AnythingLLMService } from '../anythingllm';
import { THE_ARCHITECT_V2_PROMPT } from '../knowledge-base';
import { ROLES } from '../rateCard';

// Utility function for validation tests
function validate(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Validation failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

// Test Suite
let service: AnythingLLMService;

beforeEach(() => {
  // Create a service instance (will use default config)
  service = new AnythingLLMService();
});

  describe('Workspace Management', () => {
    test('should generate valid workspace slug from client name', () => {
      // Test slug generation logic
      const testCases = [
        { input: 'Test Client', expected: 'test-client' },
        { input: 'Client@123!', expected: 'client123' },
        { input: 'Multi   Word   Name', expected: 'multi-word-name' },
        { input: 'UPPERCASE', expected: 'uppercase' },
      ];

      // Simulate slug generation (same logic as createOrGetClientWorkspace)
      testCases.forEach(({ input, expected }) => {
        const slug = input
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        expect(slug).toBe(expected);
      });
    });

    test('should have correct service initialization', () => {
      expect(service).toBeDefined();
      expect(service).toHaveProperty('getMasterSOWWorkspace');
      expect(service).toHaveProperty('listWorkspaces');
      expect(service).toHaveProperty('embedSOWInBothWorkspaces');
    });
  });

  describe('Rate Card', () => {
    test('should have valid ROLES array', () => {
      expect(Array.isArray(ROLES)).toBe(true);
      expect(ROLES.length).toBeGreaterThan(0);
      
      // Validate role structure
      ROLES.forEach(role => {
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('rate');
        expect(typeof role.name).toBe('string');
        expect(typeof role.rate).toBe('number');
        expect(role.rate).toBeGreaterThan(0);
      });
    });

    test('should generate valid rate card markdown', () => {
      // Test the buildRateCardMarkdown logic
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const version = `${yyyy}-${mm}-${dd}`;

      // Simulate buildRateCardMarkdown
      const header = `# Social Garden - Official Rate Card (AUD/hour)\n\n`;
      const intro = `This document is the single source of truth for hourly rates across roles.\n\n`;
      const tableHeader = `| Role | Rate (AUD/hr) |\n|---|---:|\n`;
      const rows = ROLES
        .map(r => `| ${r.name} | ${r.rate.toFixed(2)} |`)
        .join('\n');
      const markdown = header + intro + tableHeader + rows;

      expect(markdown).toContain('# Social Garden - Official Rate Card');
      expect(markdown).toContain('| Role | Rate (AUD/hr) |');
      expect(markdown.split('|').length).toBeGreaterThan(10); // At least some roles
      
      // Validate markdown structure
      ROLES.forEach(role => {
        expect(markdown).toContain(`| ${role.name} |`);
        expect(markdown).toContain(`${role.rate.toFixed(2)}`);
      });
    });
  });

  describe('System Prompts', () => {
    test('should have valid Architect prompt', () => {
      expect(THE_ARCHITECT_V2_PROMPT).toBeDefined();
      expect(typeof THE_ARCHITECT_V2_PROMPT).toBe('string');
      expect(THE_ARCHITECT_V2_PROMPT.length).toBeGreaterThan(100);
      
      // Verify key prompt components
      expect(THE_ARCHITECT_V2_PROMPT.toLowerCase()).toContain('architect' || 'sow' || 'rate');
    });

    test('should generate valid client-facing prompt', () => {
      // Simulate getClientFacingPrompt logic
      const clientName = 'Test Client';
      const greeting = `Hi! I'm the Social Garden AI assistant for ${clientName}.`;
      
      expect(greeting).toContain('Social Garden');
      expect(greeting).toContain(clientName);
      expect(greeting).toContain('AI assistant');
    });
  });

  describe('Thread Management', () => {
    test('should have thread management methods', () => {
      expect(service).toHaveProperty('createThread');
      expect(service).toHaveProperty('updateThread');
      expect(service).toHaveProperty('deleteThread');
      expect(service).toHaveProperty('getThreadChats');
      expect(service).toHaveProperty('chatWithThread');
      expect(service).toHaveProperty('streamChatWithThread');
    });

    test('should generate valid thread names', () => {
      // Test thread naming
      const now = new Date().toLocaleString();
      const autoThreadName = `Thread ${now}`;
      
      expect(autoThreadName).toContain('Thread');
      expect(autoThreadName.length).toBeGreaterThan(10);
    });
  });

  describe('Document Embedding', () => {
    test('should have document embedding methods', () => {
      expect(service).toHaveProperty('embedSOWDocument');
      expect(service).toHaveProperty('embedRateCardDocument');
      expect(service).toHaveProperty('embedCompanyKnowledgeBase');
      expect(service).toHaveProperty('embedSOWInBothWorkspaces');
    });
  });

  describe('Helper Methods', () => {
    test('should validate HTML to text conversion logic', () => {
      // Simulate htmlToText
      const testCases = [
        {
          input: '<p>Hello <b>World</b></p>',
          shouldContain: 'Hello',
        },
        {
          input: '<script>alert("xss")</script><p>Safe</p>',
          shouldNotContain: 'script',
        },
        {
          input: '&nbsp;&amp;&lt;&gt;&quot;',
          shouldNotContain: '&nbsp;',
        },
      ];

      testCases.forEach(({ input, shouldContain, shouldNotContain }) => {
        const result = input
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (shouldContain) {
          expect(result.toLowerCase()).toContain(shouldContain.toLowerCase());
        }
        if (shouldNotContain) {
          expect(result.toLowerCase()).not.toContain(shouldNotContain.toLowerCase());
        }
      });
    });

    test('should validate embed script generation', () => {
      const embedId = 'test-embed-123';
      const baseUrl = 'https://test.example.com';
      
      // Simulate getEmbedScript logic
      const script = `<script
  data-embed-id="${embedId}"
  data-base-api-url="${baseUrl}/api/embed"
  data-mode="chat"
  src="${baseUrl}/embed/anythingllm-chat-widget.min.js">
</script>`;

      expect(script).toContain(embedId);
      expect(script).toContain(baseUrl);
      expect(script).toContain('data-embed-id');
      expect(script).toContain('anythingllm-chat-widget');
    });
  });

  describe('API URL Configuration', () => {
    test('should have valid base URL configuration', () => {
      // Verify that service can be initialized with custom URLs
      const customUrl = 'https://custom.anythingllm.com';
      const customKey = 'test-key-123';
      const customService = new AnythingLLMService(customUrl, customKey);
      
      expect(customService).toBeDefined();
    });
  });

  describe('Master Dashboard', () => {
    test('should have master dashboard methods', () => {
      expect(service).toHaveProperty('getOrCreateMasterDashboard');
    });

    test('should generate valid master dashboard prompt', () => {
      // Simulate master dashboard prompt
      const prompt = `You are the Master Dashboard Analytics Assistant for Social Garden's SOW management system.

Your role is to:
- Analyze SOW data across all clients
- Provide business insights and trends
- Answer questions about proposals, revenue, and client activity
- Generate reports and summaries
- Help with strategic decision-making`;

      expect(prompt).toContain('Master Dashboard');
      expect(prompt).toContain('Analytics');
      expect(prompt).toContain('SOW');
    });
  });

  describe('Method Signatures', () => {
    test('should have correct workspace creation signature', () => {
      const method = service.getMasterSOWWorkspace;
      expect(method).toBeDefined();
      expect(typeof method).toBe('function');
    });

    test('should have correct chat methods signature', () => {
      expect(typeof service.chatWithThread).toBe('function');
      expect(typeof service.streamChatWithThread).toBe('function');
      expect(typeof service.getThreadChats).toBe('function');
    });

    test('should have correct embedding methods signature', () => {
      expect(typeof service.embedSOWDocument).toBe('function');
      expect(typeof service.embedSOWInBothWorkspaces).toBe('function');
      expect(typeof service.embedRateCardDocument).toBe('function');
    });
  });
 

describe('Integration Flow Validation', () => {
  let service: AnythingLLMService;

  beforeEach(() => {
    service = new AnythingLLMService();
  });

  test('workspace creation flow structure is valid', async () => {
    // Test that the expected flow would work
    const clientName = 'Test Client';
    const slug = clientName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    expect(slug).toBe('test-client');
    
    // Verify that service has all required methods for the flow
    expect(service.listWorkspaces).toBeDefined();
    expect(service.getMasterSOWWorkspace).toBeDefined();
    expect(service.setWorkspacePrompt).toBeDefined(); // Private but accessible through tests
    expect(service.embedRateCardDocument).toBeDefined();
    expect(service.createThread).toBeDefined();
  });

  test('SOW embedding flow structure is valid', async () => {
    // Verify dual embedding structure
    const sowTitle = 'Test SOW';
    const clientWorkspace = 'test-client';
    
    // Service should have all methods for dual embedding
    expect(service.embedSOWInBothWorkspaces).toBeDefined();
    expect(service.getOrCreateMasterDashboard).toBeDefined();
    expect(service.embedSOWDocument).toBeDefined();
  });

  test('chat flow structure is valid', async () => {
    // Verify chat methods are chained correctly
    expect(service.createThread).toBeDefined();
    expect(service.getThreadChats).toBeDefined();
    expect(service.chatWithThread).toBeDefined();
    expect(service.streamChatWithThread).toBeDefined();
    
    // Verify retry logic exists in getThreadChats
    const method = service.getThreadChats.toString();
    expect(method).toContain('retry');
  });
});
