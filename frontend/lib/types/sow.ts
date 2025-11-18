/**
 * Type definitions for SOW (Statement of Work) related data structures
 */

export interface RoleAllocation {
  role: string;
  description: string;
  hours: number;
  rate: number;
  cost: number;
  discount?: number;
}

export interface Scope {
  scope_name: string;
  scope_description: string;
  deliverables: string[];
  assumptions: string[];
  role_allocation: RoleAllocation[];
}

export interface MultiScopeData {
  scopes: Scope[];
  discount: number;
  extractedAt?: number;
}

export interface Document {
  id: string;
  title: string;
  content: any;
  folderId?: string;
  workspaceSlug?: string;
  threadSlug?: string;
  syncedAt?: string;
  lastModified?: string;
  totalInvestment?: number;
  pricingData?: MultiScopeData | null;
  vertical?: string;
  serviceLine?: string;
  clientName?: string;
  clientEmail?: string;
  budgetNotes?: string;
  discount?: number;
  budget?: number;
  service?: string;
}

export interface Folder {
  id: string;
  name: string;
  workspaceSlug: string;
  workspaceId?: string;
  embedId?: string;
  syncedAt?: string;
  sowIds?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  sows?: SOW[];
  workspace_slug?: string;
}

export interface SOW {
  id: string;
  name: string;
  workspaceId: string;
  vertical?: string;
  service_line?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Array<{
    name: string;
    mime: string;
    contentString: string;
  }>;
}

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
}

export interface PDFExportData {
  title: string;
  scopes: Array<{
    id: string;
    title: string;
    description: string;
    items: Array<{
      description: string;
      role: string;
      hours: number;
      rate: number;
      cost: number;
    }>;
    deliverables: string[];
    assumptions: string[];
    total: number;
  }>;
  discount: number;
  clientName: string;
  company: {
    name: string;
  };
  projectSubtitle: string;
  projectOverview: string;
  budgetNotes: string;
  currency: string;
  gstApplicable: boolean;
  generatedDate: string;
  authoritativeTotal: number;
}

export interface StructuredSOW {
  clientName?: string;
  serviceName?: string;
  overview?: string;
  deliverables?: string[];
  outcomes?: string[];
  phases?: Array<{
    name: string;
    duration: string;
    activities: string[];
  }>;
  pricing?: {
    total: number;
    breakdown: Array<{
      item: string;
      cost: number;
    }>;
  };
  assumptions?: string[];
  timeline?: string;
}
