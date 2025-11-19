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
  threadId?: string;
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

// Folder interface kept for backward compatibility but deprecated
// Use Workspace instead - folders and workspaces are the same thing
export interface Folder {
  id: string;
  name: string;
  workspaceSlug: string;
  workspaceId?: string;
  embedId?: string | number;
  parentId?: string | number;
  syncedAt?: string;
  sowIds?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  sows: SOW[];
  workspace_slug?: string; // AnythingLLM workspace slug
  slug?: string; // Alias for workspace_slug
  workspaceSlug?: string; // Alias for workspace_slug (for compatibility)
  workspaceId?: string; // AnythingLLM workspace ID
  embedId?: string | number; // Embed ID
  parentId?: string | number; // For nested workspaces (if needed)
  syncedAt?: string; // Last sync timestamp
}

export interface SOW {
  id: string;
  name: string;
  workspaceId: string;
  vertical?:
    | "property"
    | "education"
    | "finance"
    | "healthcare"
    | "retail"
    | "hospitality"
    | "professional-services"
    | "technology"
    | "other"
    | null;
  service_line?:
    | "crm-implementation"
    | "marketing-automation"
    | "revops-strategy"
    | "managed-services"
    | "consulting"
    | "training"
    | "other"
    | null;
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
  showPricingSummary?: boolean; // 🎯 Control visibility of pricing summary in professional PDF
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
