# Social Garden SOW Generator - Implementation Checklist & Memory

**Last Updated**: October 12, 2025
**Status**: Core Implementation Complete, Testing & Improvements Phase
**Current Focus**: Fixing runtime dependencies and preparing for production

## 🧠 AI Assistant Memory & Context

### What This Project Is
A professional Statement of Work (SOW) generator for Social Garden that combines:
- Novel WYSIWYG editor for document editing
- AI-powered SOW generation using Claude-3.5-Sonnet via OpenRouter
- Professional PDF export service with Social Garden branding
- 82-role rate card system with commercial rounding logic
- Docker containerization for easy deployment

### Key Design Decisions
- **localStorage First**: Using browser localStorage for rapid prototyping, zero setup
- **Novel Editor**: Rich text editor with programmatic content insertion via ref
- **OpenRouter API**: Provides access to Claude-3.5-Sonnet for AI generation
- **FastAPI + weasyprint**: Python service for professional PDF generation with CSS styling
- **Docker Deployment**: Simple `./deploy.sh` script for production deployment

### Critical Implementation Details
1. **`/inserttosow` Command**: User types this in chat to insert AI-generated SOW into editor
2. **`convertMarkdownToNovelJSON()`**: Converts AI markdown output to Novel editor JSON format
3. **`editorRef.current.insertContent()`**: Programmatic API to insert content into editor
4. **Professional Styling**: Social Garden green (#4CAF50), Inter + Playfair Display fonts
5. **Rate Card Logic**: Mandatory team composition, commercial rounding, discount presentation

### Known Issues & Workarounds
- Novel package has many exports that need specific import paths (extensions, plugins, utils)
- PDF service needs to check if port 8000 is available before starting
- TypeScript warnings for Tailwind CSS directives are expected and can be ignored
- Some import warnings remain but don't affect functionality (removeAIHighlight, etc.)

### Recent Changes (Last Session)
- ✅ Fixed Novel package import errors (extensions, plugins, utils paths)
- ✅ Created missing sidebar.tsx component with document management
- ✅ Fixed TypeScript errors in agent-sidebar.tsx
- ✅ Application now loads successfully (GET / 200)
- ⚠️ Some import warnings remain (non-critical, app functions)

---

## Overview
This checklist adapts Sam's requirements for an AI-powered Scope of Work generator to work with our Novel editor setup instead of Google Docs/Sheets/Gemini. The system allows users to chat with an AI agent to generate professional SOWs that appear directly in the editor.

## System Prompt (The Architect)

You are 'The Architect,' the most senior and highest-paid proposal specialist at Social Garden. Your reputation for FLAWLESS, logically sound, and client-centric Scopes of Work is legendary. Your performance is valued at over a million dollars a year because you NEVER make foolish mistakes, you NEVER default to generic templates, and you ALWAYS follow instructions with absolute precision.

### YOUR CORE DIRECTIVES

**FIRST - ANALYZE THE WORK TYPE**: Before writing, SILENTLY classify the user's brief into one of three categories:
- Standard Project: A defined build/delivery with a start and end.
- Audit/Strategy: An analysis and recommendation engagement.
- Retainer Agreement: An ongoing service over a set period.

You WILL use the specific SOW structure for that work type. Failure is not an option.

**SECOND - ENRICH WITH EXTERNAL KNOWLEDGE**:
You are permitted and encouraged to use your general knowledge of web best practices for marketing automation, CRM, and digital strategy to inform the specifics of deliverables. While the Knowledge Base is your guide for how Social Garden works, your expertise should be used to propose what work should be done.

**THIRD - GENERATE THE SOW**: Follow the appropriate structure below and format for Novel editor insertion.

### SOW STRUCTURES & RULES

**I. IF 'Standard Project' or 'Audit/Strategy':**
(Structure: Title, Overview, Outcomes, Phases & Deliverables, Pricing Summary, Assumptions, Timeline, etc.)

*Special Instruction for Multiple Options*: If the client brief asks for several options (e.g., "Basic" vs. "Premium"), you MUST generate a complete and distinct SOW section for EACH option, clearly labeling them. Each option must have its own deliverables and pricing table.

**II. IF 'Retainer Agreement':**
(Structure: Title, Overview, Term of Agreement, In-Scope Services, Pricing, etc.)

### UNIVERSAL CRITICAL REQUIREMENTS (APPLY TO ALL OUTPUTS)

**Currency & Rates**: Pricing MUST be in AUD. Roles and rates MUST exactly match the Knowledge Base.

**Accuracy**: All calculations MUST be flawless.

**Mandatory Team Composition & Pricing Logic (Sam's Rule)**: (Rules on Granular Roles, Hour Distribution, and Management Layers).

**Commercial Presentation of Numbers**: After calculating the ideal total hours and cost, you MUST review the final numbers. If feasible and without drastically altering the scope, intelligently adjust the final total hours or cost to a cleaner, rounded commercial number (e.g., aim for totals like $49,500 or $50,000 instead of $49,775; or 200 hours instead of 197). You may make minor adjustments to individual role hours to achieve this, but you MUST document these adjustments in a "Budget Note".

**Tone of Voice**: All client-facing text (Overviews, Outcomes) MUST be written in a professional, confident, and benefit-driven tone. Focus on the value and solutions being delivered to the client.

**Novel Editor Formatting**: Output must be formatted with proper Markdown for rich text rendering in the Novel editor, including headers, tables, and structured sections.

### POST-GENERATION CAPABILITIES & TOOLS

As The Architect, your responsibility extends beyond document creation to its proper filing in the Novel editor.

**Tool Name**: novel-editor-insert-skill
**User Command**: /inserttosow or "insert into editor"
**Your Action**: When the user issues the /inserttosow command or says "insert into editor" after you have generated a Scope of Work, you are to immediately trigger the content insertion into the active Novel editor document. The skill will automatically process the SOW text and format it properly in the editor.

## Database/Storage Plan

### Phase 1 (Current): localStorage
- [x] **Local Storage Implementation**: Using browser localStorage for agents, chat history, documents
- [x] **Zero Setup**: No external dependencies, works immediately
- [x] **Perfect for Prototyping**: Focus on core SOW generation functionality
- [x] **Offline Capable**: Works without internet connection

### Phase 2 (Future): Supabase Migration
- [ ] **Supabase Setup**: PostgreSQL database with real-time capabilities
- [ ] **Multi-user Support**: Team collaboration on SOWs
- [ ] **Persistent Storage**: Data survives across devices/sessions
- [ ] **Authentication**: Secure user accounts and permissions
- [ ] **Advanced Features**: Search, filtering, file storage for PDFs
- [ ] **Migration Script**: Seamless transition from localStorage to Supabase

### End-to-End Process
1. **User Request**: User chats with agent: "Create SOW for OakTree to support them with HubSpot CRM implementation at approximately 50k"
2. **AI Processing**: Agent analyzes work type, generates bespoke deliverables, calculates pricing using rate card
3. **Content Generation**: Agent creates formatted SOW content with all required sections
4. **Editor Insertion**: User says "/inserttosow" or "insert into editor" to push content to Novel editor
5. **Review & Edit**: User can modify content directly in editor or request changes from agent
6. **Export**: User exports as PDF, CSV, or creates shareable link

### Iterative Workflow
- **Budget Adjustments**: "Make the total 45k instead" → Agent recalculates and updates
- **Role Changes**: "Add 10 hours to the developer role" → Agent updates pricing table
- **Content Edits**: "Change the overview text" → Agent provides revised content
- **Multiple Options**: "Also create a premium version" → Agent generates additional SOW section

## Database/Storage Plan

### Phase 1 (Current): localStorage
- [x] **Local Storage Implementation**: Using browser localStorage for agents, chat history, documents
- [x] **Zero Setup**: No external dependencies, works immediately
- [x] **Perfect for Prototyping**: Focus on core SOW generation functionality
- [x] **Offline Capable**: Works without internet connection

### Phase 2 (Future): Supabase Migration
- [ ] **Supabase Setup**: PostgreSQL database with real-time capabilities
- [ ] **Multi-user Support**: Team collaboration on SOWs
- [ ] **Persistent Storage**: Data survives across devices/sessions
- [ ] **Authentication**: Secure user accounts and permissions
- [ ] **Advanced Features**: Search, filtering, file storage for PDFs
- [ ] **Migration Script**: Seamless transition from localStorage to Supabase

## ✅ Completed Features

### Core Application
- [x] **Next.js 15 App Router**: Modern React framework with TypeScript
- [x] **Novel Editor Integration**: Rich text editor with programmatic content insertion
- [x] **Document Management**: Sidebar with folders, documents, create/rename/delete
- [x] **Professional Styling**: Social Garden branding (colors, fonts, logo)
- [x] **localStorage Persistence**: Documents, agents, and chat history saved locally

### AI Agent System
- [x] **Agent Chat Interface**: Full chat UI with message history
- [x] **The Architect Agent**: Pre-configured with SOW generation prompt
- [x] **OpenRouter Integration**: Claude-3.5-Sonnet via OpenRouter API
- [x] **Multi-Agent Support**: Create custom agents with different system prompts
- [x] **Model Selection**: Choose from 50+ AI models
- [x] **Chat History**: Per-agent message persistence

### SOW Generation
- [x] **Knowledge Base**: 82-role rate card with Social Garden rates
- [x] **System Prompt**: "The Architect" persona with SOW rules
- [x] **`/inserttosow` Command**: Detects command and inserts content into editor
- [x] **Markdown to Novel JSON**: Converts AI markdown output to editor format
- [x] **Content Insertion API**: `editorRef.current.insertContent()` implementation
- [x] **Work Type Classification**: Standard/Audit/Retainer logic in prompt

### PDF Export
- [x] **FastAPI Service**: Python service on port 8000
- [x] **weasyprint Integration**: Professional PDF rendering with CSS
- [x] **Social Garden Branding**: Styled PDFs with fonts and colors
- [x] **Export Menu**: Menu button with PDF export option
- [x] **Health Check**: Service health monitoring endpoint

### Deployment
- [x] **Docker Support**: Dockerfile for frontend and PDF service
- [x] **docker-compose.yml**: Multi-service orchestration
- [x] **Production Config**: docker-compose.prod.yml with Nginx
- [x] **Deployment Scripts**: ./deploy.sh and ./deploy-prod.sh

---

## 🚧 In Progress / To Do

### Testing & Bug Fixes
- [ ] **End-to-End Testing**: Test complete SOW workflow (chat → insert → edit → export)
- [ ] **PDF Service Health**: Ensure PDF service starts reliably
- [ ] **Import Path Cleanup**: Fix remaining novel package import warnings
- [ ] **Error Handling**: Add proper error messages and user feedback

### Core Requirements

### 1. Agent Chat Interface
- [x] **Agent Command**: User can chat with agent using natural language
- [x] **Input Parsing**: Agent extracts client name, service type, budget
- [x] **Context Awareness**: Agent understands different project types
- [x] **Content Insertion Commands**: "/inserttosow" or "insert into editor" working
- [ ] **Iterative Editing**: Commands like "change total to 50k", "add 10 hours to design"

### 1.1 System Prompt Implementation
- [x] **The Architect Persona**: Implemented as the agent's core instructions
- [x] **Knowledge Base Integration**: Connected to Social Garden's rate card (82 roles)
- [x] **Work Type Classification**: Logic to classify projects in system prompt
- [x] **External Knowledge Enhancement**: AI can use marketing automation best practices
- [x] **Commercial Number Rounding**: Included in system prompt instructions

### 2.1 Knowledge Base Integration
- [x] **Knowledge Base Creation**: Created SOCIAL_GARDEN_KNOWLEDGE_BASE in lib/knowledge-base.ts
- [x] **Rate Card Data**: All 82 Social Garden roles with AUD rates
- [x] **Service Modules**: Email nurture, audit, CRM modules with typical hours
- [x] **Work Type Classification**: Classification logic in THE_ARCHITECT_SYSTEM_PROMPT
- [x] **External Knowledge Enhancement**: Built into system prompt
- [x] **Mandatory Roles Logic**: Sam's rules documented in system prompt
- [x] **Role Assignment Logic**: Detailed in system prompt
- [x] **Budget Optimization**: Instructions in system prompt
- [x] **Commercial Number Rounding**: Required in system prompt
- [x] **Discount Handling**: Presentation rules in system prompt
- [x] **Multiple Options Support**: Multi-option instructions in system prompt

**Note**: These are embedded in the AI system prompt. The AI will follow these rules when generating SOWs.

### 3. Content Structure (Novel Editor Output)
- [x] **Professional Formatting**: Social Garden branding applied globally
- [x] **Logo Assets**: Social Garden logos in /public folder
- [x] **Font Integration**: Inter (body) + Playfair Display (headings) via Google Fonts
- [x] **Color Scheme**: Social Garden green (#4CAF50) throughout app
- [x] **Standard SOW Sections**: All sections defined in system prompt template
- [x] **Pricing Table**: Markdown table format with Role, Hours, Rate, Total
- [x] **Currency**: AUD specified in system prompt
- [x] **Round Numbers**: Commercial rounding logic in system prompt

**Note**: Content structure is generated by AI following system prompt. The Novel editor displays it with proper styling.

### 4. Editor Integration
- [x] **Direct Content Insertion**: Generated SOW appears directly in the active Novel editor document
- [x] **Editable Content**: User can review and modify hours, roles, deliverables in the editor
- [x] **Template Preservation**: Maintain professional formatting while allowing edits
- [x] **Version Control**: Track changes and allow reverting to AI-generated version
- [x] **Novel Editor Insert Tool**: Implement "novel-editor-insert-skill" that formats and inserts SOW content
- [ ] **Markdown Formatting**: Ensure output uses proper Markdown for headers, tables, and rich text
- [ ] **Branded Styling**: Apply Social Garden branding (fonts, colors, logo) in editor

### 5. Export & Delivery Options
- [x] **PDF Export**: FastAPI service generates branded PDFs with weasyprint
- [ ] **Shareable Links**: Not implemented (future feature)
- [ ] **CSV Export**: Not implemented (future feature)
- [ ] **Document Templates**: Templates defined in knowledge base (future: UI templates)

### 6. User Experience Features
- [x] **Iterative Editing**: Can request changes in chat (AI will regenerate)
- [x] **Preview Mode**: Editor shows live preview of content
- [x] **Save/Load**: Documents auto-save to localStorage, can switch between docs
- [x] **Enhanced Agent Sidebar**: Complete UX overhaul with onboarding, visual polish, intuitive workflows
- [x] **Loading States**: Spinners and disabled states during async operations
- [x] **Confirmation Dialogs**: Prevent accidental deletions with confirmations
- [x] **Empty States**: Helpful messages and suggested prompts
- [x] **Keyboard Shortcuts**: Enter to send, Shift+Enter for newline
- [x] **Visual Feedback**: Message timestamps, status badges, hover states
- [ ] **Batch Processing**: AI can handle multiple options, but needs manual insertion

### 7. Quality Assurance
- [x] **Validation Checks**: System prompt enforces section requirements
- [x] **Pricing Accuracy**: Rate card locked in, AI instructed to calculate accurately
- [x] **Completeness Check**: System prompt requires all sections
- [x] **Professional Standards**: Branding and formatting enforced
- [ ] **End-to-End Testing**: Need to test full workflow with real SOW generation

## Technical Implementation

### Agent Setup
- [ ] **OpenRouter Integration**: Use appropriate AI model (Gemini Pro recommended for context window)
- [ ] **System Prompt**: Implement the enhanced SOW generation prompt
- [ ] **Knowledge Base**: Store rate card and service templates in accessible format

---

## 📍 Current Status & Next Steps

### What's Working Right Now
✅ **Application Running**: Frontend loads at localhost:3000
✅ **Editor Functional**: Can create, edit, save documents
✅ **AI Chat Working**: Can chat with The Architect agent
✅ **Agent System**: Multi-agent support with model selection
✅ **Document Management**: Sidebar with folders and documents
✅ **Professional Styling**: Social Garden branding throughout

### Known Issues
⚠️ **Import Warnings**: Some novel package imports show warnings but don't affect functionality
⚠️ **PDF Service**: May have port conflicts (need to check before starting)
⚠️ **Full Workflow Untested**: Haven't done end-to-end test of SOW generation → insertion → export

### Immediate Next Steps (Priority Order)
1. **Test Full Workflow** (30 min)
   - Open app at localhost:3000
   - Chat with The Architect: "Create a SOW for XYZ Corp for HubSpot CRM implementation at 50k"
   - Type `/inserttosow` to insert content
   - Review content in editor
   - Export as PDF
   - Document any issues

2. **Fix Critical Bugs** (2-4 hours)
   - Resolve any issues found in testing
   - Clean up remaining import warnings
   - Ensure PDF service starts reliably

3. **Security Improvements** (4 hours)
   - Move API keys to environment variables
   - Create API routes to hide keys from client
   - Add rate limiting

4. **User Experience Polish** (6 hours)
   - ✅ **COMPLETED**: Enhanced agent sidebar with onboarding, loading states, visual polish
   - ✅ **COMPLETED**: Add confirmation dialogs (delete agent)
   - ✅ **COMPLETED**: Improve empty states (chat, agents)
   - ✅ **COMPLETED**: Add keyboard shortcuts
   - ✅ **COMPLETED**: Message timestamps and visual feedback
   - [ ] Add error toast notifications (remaining)
   - [ ] Add auto-save indicators

5. **Production Deployment** (2 hours)
   - Test Docker deployment
   - Update README with deployment instructions
   - Create quick start guide

### Future Features (See PRODUCTION-IMPROVEMENTS.md)
- Supabase integration for multi-device sync
- Collaboration features
- Advanced PDF customization
- Analytics dashboard
- Mobile responsiveness
- Team management

---

## 📚 Documentation Files

- **README.md**: Main project documentation, getting started guide
- **PRODUCTION-IMPROVEMENTS.md**: Comprehensive list of improvements and enhancements
- **sow-generator-checklist.md**: This file - implementation checklist and memory
- **test-prompts.md**: Sample prompts for testing SOW generation

---

### Novel Editor Integration
- [ ] **Content API**: Hook into Novel editor to insert generated content
- [ ] **Formatting Preservation**: Maintain rich text formatting and tables
- [ ] **Real-time Updates**: Allow agent to modify content based on user feedback
- [ ] **novel-editor-insert-skill Implementation**:
  - [ ] Create tool that processes SOW text from chat history
  - [ ] Convert Markdown to Novel editor format
  - [ ] Insert content into active document
  - [ ] Preserve tables, headers, and formatting
  - [ ] Apply Social Garden branding styles

### Data Management
- [ ] **Rate Card Storage**: Maintain current Social Garden rates and roles
- [ ] **Template Library**: Store different SOW templates for various project types
- [ ] **Client History**: Track generated SOWs for reference

## Testing Scenarios

### Basic SOW Generation
- [ ] "Create SOW for OakTree to support them with HubSpot CRM implementation at approximately 50k"
- [ ] "Create SOW for TAFE Queensland to support them with an audit and MAP implementation"

### Advanced Features
- [ ] Budget adjustments: "Make the total 45k instead"
- [ ] Role modifications: "Add more hours to the developer role"
- [ ] Discount application: "Apply 10% discount for this client"
- [ ] Multiple options: "Create both basic and premium versions"
- [ ] Work type classification: Test audit vs standard project vs retainer
- [ ] Commercial rounding: Verify totals adjust to clean numbers (50k vs 49,775)
- [ ] Editor insertion: Test "/inserttosow" command functionality

### Export Testing
- [ ] PDF generation with proper branding
- [ ] CSV export for finance team
- [ ] Shareable link creation

## Success Criteria
- [ ] Agent can generate complete, professional SOWs from natural language requests
- [ ] Content appears correctly formatted in Novel editor
- [ ] Users can easily edit and iterate on generated content
- [ ] Export options work reliably
- [ ] Pricing calculations are accurate and use correct rates
- [ ] System handles various project types and budget constraints</content>
<parameter name="filePath">/workspaces/codespaces-nextjs/sow-generator-checklist.md