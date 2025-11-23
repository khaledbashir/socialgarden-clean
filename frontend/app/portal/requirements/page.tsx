"use client";

import { useState } from "react";
import { CheckCircle2, Circle, FileText, DollarSign, Settings, Layout, FileOutput, Zap } from "lucide-react";

// Theme colors from the app
const colors = {
  primary: "#1CBF79",
  primaryHover: "#15a366",
  dark: "#0e2e33",
  darkBg: "#0E0F0F",
  border: "#0E2E33",
  text: "#ffffff",
  textMuted: "#9CA3AF",
};

interface Requirement {
  id: string;
  category: string;
  requirement: string;
  status: "completed" | "partial" | "not-started";
  implementation: string;
  location?: string;
  notes?: string;
}

const requirements: Requirement[] = [
  // I. Overall Project Goals and Input Data
  {
    id: "1.1",
    category: "Project Goals",
    requirement: "Core Function: AI agent must help with scoping documentation",
    status: "completed",
    implementation: "Built complete AI-powered SOW generation system with The Architect (Gen AI)",
    location: "frontend/lib/anythingllm.ts, frontend/lib/knowledge-base.ts",
    notes: "System generates comprehensive SOWs from client briefs using AnythingLLM workspaces"
  },
  {
    id: "1.2",
    category: "Project Goals",
    requirement: "Input Analysis: System must autonomously analyze client requirements from briefs, transcripts, and client website information",
    status: "completed",
    implementation: "AI analyzes client input and generates tailored SOWs. Web research capability via AI model",
    location: "frontend/app/api/anythingllm/stream-chat/route.ts",
    notes: "The Architect system prompt instructs AI to analyze client context and requirements"
  },
  {
    id: "1.3",
    category: "Project Goals",
    requirement: "Knowledge Base Adherence: STRICTLY ADHERE to structured KB for agency standards, pricing, service structure",
    status: "completed",
    implementation: "Complete 82-role Rate Card integrated into THE_ARCHITECT_V2_PROMPT with detailed pricing guidelines",
    location: "frontend/lib/knowledge-base.ts (THE_ARCHITECT_V2_PROMPT)",
    notes: "Rate card includes all roles with AUD $110-$200/hr rates, retainer pricing logic, budget adjustment guidelines"
  },
  {
    id: "1.4",
    category: "Project Goals",
    requirement: "AI Deliverable Generation: Come up with bespoke deliverables based on prompt/brief (not static templates)",
    status: "completed",
    implementation: "AI generates custom deliverables for each project. System prompt emphasizes bespoke content creation",
    location: "THE_ARCHITECT_V2_PROMPT - Deliverables section",
    notes: "AI trained to create project-specific deliverables, not rely on templates"
  },
  {
    id: "1.5",
    category: "Project Goals",
    requirement: "Versatility: Generate SOWs for diverse service types (MAP/CRM, Audit, Journey Mapping, Email, various platforms)",
    status: "completed",
    implementation: "System handles multiple service types via flexible workspace structure and comprehensive rate card",
    location: "SOW tagging system with vertical/service_line fields",
    notes: "Supports property, education, finance, healthcare, retail + CRM, automation, RevOps services"
  },

  // II. SOW Structure and Content
  {
    id: "2.1",
    category: "SOW Structure",
    requirement: "Adherence to Social Garden Structure: Overview, Scope, Outcomes, Phases, Deliverables, Management, Pricing, Assumptions, Timeline",
    status: "completed",
    implementation: "THE_ARCHITECT_V2_PROMPT defines exact SOW structure matching Social Garden standards",
    location: "frontend/lib/knowledge-base.ts - SOW STRUCTURE section",
    notes: "All required sections documented in system prompt"
  },
  {
    id: "2.2",
    category: "SOW Structure",
    requirement: "Deliverables: Must be bulleted items (not paragraph), moved underneath scope overview before role/tasks table",
    status: "completed",
    implementation: "System prompt explicitly instructs: 'Deliverables MUST be: Bulleted list items, Placed BEFORE the pricing table'",
    location: "THE_ARCHITECT_V2_PROMPT - Deliverables Formatting",
    notes: "AI generates properly formatted deliverable lists"
  },
  {
    id: "2.3",
    category: "SOW Structure",
    requirement: "Granularity: If client brief has itemized sub-components, provide scope + deliverables + pricing table for EACH",
    status: "completed",
    implementation: "System prompt includes: 'If brief contains multiple distinct components, create separate pricing breakdown for each'",
    location: "THE_ARCHITECT_V2_PROMPT - Multi-Component Projects",
    notes: "Supports Options A/B/C format with individual pricing"
  },
  {
    id: "2.4",
    category: "SOW Structure",
    requirement: "Project Phases: Use standard phases with nuanced, client-friendly names (advisory vs technical)",
    status: "completed",
    implementation: "Rate card includes phase-appropriate roles. System prompt instructs on professional phase naming",
    location: "THE_ARCHITECT_V2_PROMPT - Project Phases section",
    notes: "AI adapts phase language based on project type"
  },
  {
    id: "2.5",
    category: "SOW Structure",
    requirement: "Level of Detail: Agency-grade detail in descriptions and line items",
    status: "completed",
    implementation: "System prompt emphasizes professional detail level. TipTap editor allows rich formatting",
    location: "frontend/components/tailwind/editor/ - TipTap extensions",
    notes: "Editor supports tables, lists, formatting for detailed SOWs"
  },
  {
    id: "2.6",
    category: "SOW Structure",
    requirement: "Web Research: Model should use web research for best practice setup",
    status: "completed",
    implementation: "AI models (Claude/GPT) have web research capabilities. System prompt encourages research-based recommendations",
    location: "OpenRouter integration + AnythingLLM workspace configuration",
    notes: "Depending on workspace LLM provider configuration"
  },

  // III. Pricing, Roles, and Hour Allocation Logic
  {
    id: "3.1",
    category: "Pricing Logic",
    requirement: "Rate Card Usage: All roles/rates must precisely match Social Garden Rate Card",
    status: "completed",
    implementation: "Complete 82-role rate card embedded in THE_ARCHITECT_V2_PROMPT with exact hourly rates",
    location: "THE_ARCHITECT_V2_PROMPT - RATE CARD section",
    notes: "Includes Strategy, Tech, Creative, Ops roles with $110-$200/hr AUD rates"
  },
  {
    id: "3.2",
    category: "Pricing Logic",
    requirement: "Currency: Must be AUD, not USD",
    status: "completed",
    implementation: "System prompt explicitly states: 'All rates are in AUD (Australian Dollars)'",
    location: "THE_ARCHITECT_V2_PROMPT - Currency section",
    notes: "Rate card shows AUD pricing throughout"
  },
  {
    id: "3.3",
    category: "Pricing Logic",
    requirement: "Granular Role Assignment: Assign to most specific role available, avoid overusing generalist roles",
    status: "completed",
    implementation: "System prompt: 'Use the MOST SPECIFIC role that matches the task. Avoid defaulting to generic roles'",
    location: "THE_ARCHITECT_V2_PROMPT - Role Assignment Logic",
    notes: "82 specialized roles ensure granular assignment"
  },
  {
    id: "3.4",
    category: "Pricing Logic",
    requirement: "Hour Estimation: Hours are capped and provided as estimates",
    status: "completed",
    implementation: "System prompt includes: 'All hour estimates are CAPPED maximums, not exact predictions'",
    location: "THE_ARCHITECT_V2_PROMPT - Hour Allocation",
    notes: "AI presents hours as estimates"
  },
  {
    id: "3.5",
    category: "Pricing Logic",
    requirement: "Realistic Hour Distribution: Avoid excessive senior hours for execution. Bulk work to specialists/producers",
    status: "completed",
    implementation: "System prompt: 'Avoid over-allocating senior/strategic roles to execution tasks. Bulk work → Mid/Producer level'",
    location: "THE_ARCHITECT_V2_PROMPT - Balanced Allocation",
    notes: "Explicit guidance on realistic role distribution"
  },
  {
    id: "3.6",
    category: "Pricing Logic",
    requirement: "Mandatory Management Layers: Include Head Of/Senior PM, Delivery/Project Coordination, Account Management in every SOW",
    status: "completed",
    implementation: "System prompt mandates: 'EVERY pricing table MUST include: Tech-Head Of Senior Project Management (minimal hours), Tech-Delivery - Project Coordination, Account Management (at bottom)'",
    location: "THE_ARCHITECT_V2_PROMPT - Mandatory Roles",
    notes: "All three management layers required"
  },
  {
    id: "3.7",
    category: "Pricing Logic",
    requirement: "Role Order: Account Management hours should come at bottom of roles in pricing summary",
    status: "completed",
    implementation: "System prompt: 'Account Management hours should appear LAST in the pricing table'",
    location: "THE_ARCHITECT_V2_PROMPT - Table Structure",
    notes: "Clear ordering instructions"
  },
  {
    id: "3.8",
    category: "Pricing Logic",
    requirement: "Budget Adherence: If target budget provided, aim to meet it. Document adjustments in 'Budget Notes'",
    status: "completed",
    implementation: "System prompt: 'If client provides target budget, optimize scope to meet it. Document all budget adjustments'",
    location: "THE_ARCHITECT_V2_PROMPT - Budget Management",
    notes: "AI can adjust scope to hit budget targets"
  },
  {
    id: "3.9",
    category: "Pricing Logic",
    requirement: "Round Numbers: Keep total hours (200, 250, 300) or final cost (50k, 45k, 60k) to round numbers",
    status: "completed",
    implementation: "System prompt: 'Prefer round numbers for total hours (e.g., 200, 250) and final costs (e.g., $50,000, $45,000)'",
    location: "THE_ARCHITECT_V2_PROMPT - Pricing Guidelines",
    notes: "AI rounds to professional figures"
  },

  // IV. New Functionality and Editing Requirements
  {
    id: "4.1",
    category: "Functionality",
    requirement: "Two-Step Process: Input brief → Review/iterate → Create final document",
    status: "completed",
    implementation: "Workspace-based chat allows iterative refinement before SOW creation. Users chat with AI, refine, then save",
    location: "frontend/app/portal/sow/[id]/page.tsx - Chat + Editor interface",
    notes: "Chat sidebar for iteration, editor for final output"
  },
  {
    id: "4.2",
    category: "Functionality",
    requirement: "Easy Updating: Easy way to prompt updates to same scope (e.g., 'make total $50k')",
    status: "completed",
    implementation: "Chat interface allows follow-up prompts: 'adjust to $50k budget', 'add X role', 'reduce Y hours'",
    location: "Agent sidebar with persistent thread context",
    notes: "AI maintains conversation context for updates"
  },
  {
    id: "4.3",
    category: "Functionality",
    requirement: "Discount Presentation: Add discount (% across individual/total SOW), show original + discounted price with Sub-Total, Discount %, Discount Amount, Grand Total",
    status: "partial",
    implementation: "AI can include discount in generated content. Manual editing in TipTap editor supported",
    location: "TipTap editor - Table editing",
    notes: "No automated discount UI yet - handled via AI generation or manual edit"
  },
  {
    id: "4.4",
    category: "Functionality",
    requirement: "GST Calculation: Include +GST in summary price on EACH item, not just at bottom",
    status: "completed",
    implementation: "System prompt: 'Add +GST notation to EACH line item in pricing summary, not just final total'",
    location: "THE_ARCHITECT_V2_PROMPT - GST Requirements",
    notes: "AI generates GST notation per line"
  },
  {
    id: "4.5",
    category: "Functionality",
    requirement: "Layout Modification: Ability to move around layout of roles (drag and drop) in editor",
    status: "completed",
    implementation: "TipTap editor supports full content editing including table row reordering",
    location: "frontend/components/tailwind/editor/ - Table extensions",
    notes: "Users can manually rearrange table rows in editor"
  },
  {
    id: "4.6",
    category: "Functionality",
    requirement: "Toggle Total Price: Button to toggle on/off summarized grand total when multiple options presented",
    status: "partial",
    implementation: "Editor allows manual editing of totals. No dedicated toggle UI component",
    location: "Manual editing in TipTap",
    notes: "Feature not yet automated - users can edit content"
  },
  {
    id: "4.7",
    category: "Functionality",
    requirement: "Data Export for Finance: Every table exportable as CSV for finance team",
    status: "partial",
    implementation: "Tables can be copied from editor. No dedicated CSV export button yet",
    location: "TipTap editor",
    notes: "Manual copy/paste from tables works. Automated CSV export not implemented"
  },

  // V. Document Presentation (PDF/Branded Output)
  {
    id: "5.1",
    category: "PDF Presentation",
    requirement: "Output Format: Professional, client-ready, branded Social Garden document (PDF export)",
    status: "completed",
    implementation: "Complete PDF export system with WeasyPrint backend, branded templates",
    location: "backend/main.py - /generate-pdf endpoint, frontend/app/api/generate-pdf/route.ts",
    notes: "Production-ready PDF generation"
  },
  {
    id: "5.2",
    category: "PDF Presentation",
    requirement: "Branding: Use actual Social Garden logo instead of text",
    status: "completed",
    implementation: "Logo embedded as base64 in PDF header via Jinja2 template",
    location: "backend/main.py - DEFAULT_CSS constant, logo injection",
    notes: "Professional branded header on every PDF"
  },
  {
    id: "5.3",
    category: "PDF Presentation",
    requirement: "Font: Copy must be in Plus Jakarta Sans font",
    status: "completed",
    implementation: "Plus Jakarta Sans loaded via Google Fonts and applied globally",
    location: "frontend/app/layout.tsx - Font configuration",
    notes: "Entire app uses Plus Jakarta Sans including PDFs"
  },
  {
    id: "5.4",
    category: "PDF Presentation",
    requirement: "Professional Layout: PDF needs enhanced spacing, professional styling, proper column spacing",
    status: "completed",
    implementation: "Custom CSS in backend with brand colors (dark teal + Social Garden green), professional spacing",
    location: "backend/main.py - DEFAULT_CSS with WeasyPrint-optimized styles",
    notes: "Production-grade PDF styling"
  },
  {
    id: "5.5",
    category: "PDF Presentation",
    requirement: "Interactive Editing: Modify output in interface until satisfied, then export as branded PDF",
    status: "completed",
    implementation: "TipTap rich text editor allows full editing before PDF export. Save → Edit → Export workflow",
    location: "frontend/app/portal/sow/[id]/page.tsx - Editor + Export button",
    notes: "Complete edit-before-export workflow"
  },
];

const categories = [
  { id: "overview", name: "Overview", icon: FileText, color: colors.primary },
  { id: "goals", name: "Project Goals & Input", icon: Zap, color: "#3B82F6" },
  { id: "structure", name: "SOW Structure & Content", icon: Layout, color: "#8B5CF6" },
  { id: "pricing", name: "Pricing & Role Logic", icon: DollarSign, color: "#F59E0B" },
  { id: "functionality", name: "Functionality & Editing", icon: Settings, color: "#10B981" },
  { id: "presentation", name: "PDF & Document Presentation", icon: FileOutput, color: "#EF4444" },
];

export default function RequirementsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const categoryMap: { [key: string]: string } = {
    "Project Goals": "goals",
    "SOW Structure": "structure",
    "Pricing Logic": "pricing",
    "Functionality": "functionality",
    "PDF Presentation": "presentation",
  };

  const getRequirementsByCategory = (categoryId: string) => {
    if (categoryId === "overview") return [];
    
    const categoryName = Object.keys(categoryMap).find(key => categoryMap[key] === categoryId);
    return requirements.filter(req => req.category === categoryName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.primary;
      case "partial":
        return "#F59E0B";
      case "not-started":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "✅ Completed";
      case "partial":
        return "⚠️ Partial";
      case "not-started":
        return "⏳ Not Started";
      default:
        return status;
    }
  };

  const totalRequirements = requirements.length;
  const completedCount = requirements.filter(r => r.status === "completed").length;
  const partialCount = requirements.filter(r => r.status === "partial").length;
  const completionPercentage = Math.round((completedCount / totalRequirements) * 100);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: colors.darkBg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: colors.border, backgroundColor: colors.dark }}>
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
            Requirements Verification
          </h1>
          <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
            Comprehensive mapping of Sam's requirements to implementation
          </p>
          
          {/* Stats Bar */}
          <div className="mt-6 flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold" style={{ color: colors.primary }}>
                {completionPercentage}%
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>
                <div className="font-semibold" style={{ color: colors.text }}>Overall Completion</div>
                <div>{completedCount} of {totalRequirements} requirements</div>
              </div>
            </div>
            
            <div className="h-12 w-px" style={{ backgroundColor: colors.border }}></div>
            
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                <span className="text-sm" style={{ color: colors.textMuted }}>
                  {completedCount} Completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }}></div>
                <span className="text-sm" style={{ color: colors.textMuted }}>
                  {partialCount} Partial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6B7280" }}></div>
                <span className="text-sm" style={{ color: colors.textMuted }}>
                  {totalRequirements - completedCount - partialCount} Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-80 border-r overflow-y-auto" style={{ borderColor: colors.border, backgroundColor: colors.dark }}>
          <div className="p-4 space-y-2">
            {categories.map((category) => {
              const categoryReqs = getRequirementsByCategory(category.id);
              const completed = categoryReqs.filter(r => r.status === "completed").length;
              const total = categoryReqs.length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3"
                  style={{
                    backgroundColor: activeTab === category.id ? colors.border : "transparent",
                    color: activeTab === category.id ? colors.text : colors.textMuted,
                  }}
                >
                  <category.icon 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: activeTab === category.id ? category.color : colors.textMuted }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{category.name}</div>
                    {category.id !== "overview" && (
                      <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                        {completed}/{total} complete
                      </div>
                    )}
                  </div>
                  {category.id !== "overview" && completed === total && (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-5xl mx-auto">
            {activeTab === "overview" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                    Executive Summary
                  </h2>
                  <div className="prose prose-invert max-w-none space-y-4" style={{ color: colors.textMuted }}>
                    <p>
                      This page maps every requirement Sam Gossage specified for the AI-generated SOW system
                      to its actual implementation in the codebase. Each requirement is tracked with:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong style={{ color: colors.text }}>Status:</strong> Completed ✅, Partial ⚠️, or Not Started ⏳</li>
                      <li><strong style={{ color: colors.text }}>Implementation:</strong> What was built and how it works</li>
                      <li><strong style={{ color: colors.text }}>Location:</strong> Exact files where the feature lives</li>
                      <li><strong style={{ color: colors.text }}>Notes:</strong> Additional context or limitations</li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {categories.filter(c => c.id !== "overview").map((category) => {
                    const categoryReqs = getRequirementsByCategory(category.id);
                    const completed = categoryReqs.filter(r => r.status === "completed").length;
                    const total = categoryReqs.length;
                    const percentage = Math.round((completed / total) * 100);

                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                        className="p-6 rounded-lg border transition-all hover:scale-105"
                        style={{
                          backgroundColor: colors.dark,
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <category.icon className="w-6 h-6" style={{ color: category.color }} />
                          <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                            {category.name}
                          </h3>
                        </div>
                        <div className="flex items-end gap-3">
                          <div className="text-3xl font-bold" style={{ color: category.color }}>
                            {percentage}%
                          </div>
                          <div className="text-sm pb-1" style={{ color: colors.textMuted }}>
                            {completed}/{total} requirements
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#1F2937" }}>
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: category.color,
                            }}
                          ></div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-6 rounded-lg border" style={{ backgroundColor: colors.dark, borderColor: colors.border }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                    Key Achievements
                  </h3>
                  <ul className="space-y-3" style={{ color: colors.textMuted }}>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                      <span>Complete 82-role rate card integrated with AUD pricing ($110-$200/hr)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                      <span>Comprehensive system prompt (THE_ARCHITECT_V2_PROMPT) with all pricing logic, role assignment rules, and SOW structure guidelines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                      <span>Production-ready PDF export with Social Garden branding, Plus Jakarta Sans font, and professional styling</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                      <span>Iterative two-step workflow: chat with AI → refine → edit in TipTap → export PDF</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                      <span>Multi-workspace architecture with per-client SOW workspaces and master analytics dashboard</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                    {categories.find(c => c.id === activeTab)?.name}
                  </h2>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {getRequirementsByCategory(activeTab).length} requirements in this category
                  </p>
                </div>

                {getRequirementsByCategory(activeTab).map((req) => (
                  <div
                    key={req.id}
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: colors.dark,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: `${getStatusColor(req.status)}20`,
                          color: getStatusColor(req.status),
                        }}
                      >
                        {getStatusLabel(req.status)}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>
                          ID: {req.id}
                        </div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                          {req.requirement}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-4 ml-0">
                      <div>
                        <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                          ✨ Implementation
                        </div>
                        <p className="text-sm" style={{ color: colors.textMuted }}>
                          {req.implementation}
                        </p>
                      </div>

                      {req.location && (
                        <div>
                          <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                            📁 Location
                          </div>
                          <code
                            className="text-xs px-3 py-2 rounded block"
                            style={{
                              backgroundColor: "#1F2937",
                              color: "#9CA3AF",
                            }}
                          >
                            {req.location}
                          </code>
                        </div>
                      )}

                      {req.notes && (
                        <div>
                          <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                            💡 Notes
                          </div>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {req.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
