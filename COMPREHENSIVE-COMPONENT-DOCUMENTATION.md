# Social Garden SOW Generator - Complete Component Documentation

**Generated:** October 27, 2025  
**Project:** Social Garden Statement of Work Generator  
**Version:** 1.0.0  
**Status:** Production Ready  

---

## 🎯 Executive Summary

The Social Garden SOW Generator is a comprehensive AI-powered platform for creating professional Statement of Work documents. This documentation provides a complete overview of all components, features, and system architecture.

---

## 🏗️ System Architecture Overview

### Technology Stack
- **Frontend:** Next.js 15.1.4, TypeScript, Tailwind CSS, Radix UI
- **Backend:** FastAPI (Python), WeasyPrint PDF generation
- **Database:** MySQL 8.0
- **AI Integration:** AnythingLLM platform
- **Editor:** TipTap/ProseMirror rich text editor
- **Infrastructure:** Docker, Nginx, VPS deployment

### Core Value Proposition
- **AI-Powered Content Generation** using "The Architect" agent
- **Interactive Pricing Tables** with 82+ granular roles and real-time calculations
- **Professional PDF Export** with Social Garden branding
- **Client Portal Integration** for sharing and digital signatures
- **Enterprise Analytics** with real-time dashboard and business intelligence

---

## 📁 Component Categories & Documentation

### 🏗️ **Core Application Components**

#### **Main Application (`/frontend/app/page.tsx`)**
Primary application component orchestrating the entire SOW generation workflow with dashboard, editor, and AI chat views.

#### **Layout Components (`/frontend/app/layout.tsx`)**
Root layout component providing global styling, theme configuration, and application structure.

#### **Providers (`/frontend/app/providers.tsx`)**
Context providers for global state management including toast notifications and theme providers.

---

### 🎨 **Header & Navigation Components**

#### **SG Header (`header/sg-header.tsx`)**
Social Garden branded header component with navigation, user controls, and company branding.

#### **Sidebar Navigation (`tailwind/sidebar-nav.tsx`)**
Primary workspace and SOW navigation with hierarchical folder structure and workspace management.

#### **Dashboard Sidebar (`tailwind/DashboardSidebar.tsx`)**
AI chat sidebar for dashboard analytics mode with workspace selection and conversation management.

#### **Workspace Sidebar (`tailwind/WorkspaceSidebar.tsx`)**
AI chat sidebar for editor mode with thread management and SOW-specific conversations.

#### **Agent Sidebar (`tailwind/agent-sidebar-clean.tsx`)**
Clean interface for AI agent selection and management with minimal design.

---

### 📊 **Dashboard & Analytics Components**

#### **Enhanced Dashboard (`tailwind/enhanced-dashboard.tsx`)**
Real-time analytics dashboard displaying SOW metrics, recent activity, top clients, and business intelligence widgets.

#### **Social Garden BI (`tailwind/social-garden-bi.tsx`)**
Business intelligence widgets for vertical and service line filtering with interactive charts and metrics.

#### **Stateful Dashboard Chat (`tailwind/stateful-dashboard-chat.tsx`)**
Complete chat system with conversation history, message persistence, and dashboard integration.

---

### ✏️ **Editor & Content Components**

#### **Advanced Editor (`tailwind/advanced-editor.tsx`)**
TipTap-based rich text editor with SOW-specific formatting, pricing table integration, and real-time collaboration features.

#### **Resizable Layout (`tailwind/resizable-layout.tsx`)**
Three-panel resizable interface managing sidebar, main content, and AI chat panels with responsive behavior.

#### **Document Status Bar (`tailwind/document-status-bar.tsx`)**
SOW metadata display with save status, vertical/service line tagging, and export actions.

#### **Selection Toolbar (`tailwind/selection-toolbar.tsx`)**
Contextual toolbar for text selection actions including formatting, links, and content insertion.

---

### 💰 **Pricing & Financial Components**

#### **Pricing Table Builder (`tailwind/pricing-table-builder.tsx`)**
Interactive drag-drop pricing table builder with 82+ roles, real-time calculations, and discount management.

#### **Editable Pricing Table (`tailwind/extensions/editable-pricing-table.tsx`)**
Inline editable pricing table component with role selection, hours/rate input, and total calculations.

#### **Pricing Table Enhancer (`tailwind/pricing-table-enhancer.tsx`)**
Advanced pricing table features including bulk operations, role validation, and export capabilities.

#### **SOW Calculator (`tailwind/sow-calculator.tsx`)**
Financial calculator for project estimates, retainer calculations, and investment projections.

---

### 🤖 **AI & Chat Components**

#### **Stateful Dashboard Chat (`tailwind/stateful-dashboard-chat.tsx`)**
Full-featured chat interface with conversation history, real-time messaging, and context awareness.

#### **Message Display Panel (`tailwind/message-display-panel.tsx`)**
Chat message rendering with streaming support, thinking indicators, and message formatting.

#### **Streaming Thought Accordion (`tailwind/streaming-thought-accordion.tsx`)**
Collapsible AI thinking process display with step-by-step reasoning visualization.

#### **Floating AI Bar (`tailwind/floating-ai-bar.tsx`)**
Floating AI assistant bar for quick access to chat functionality across the application.

---

### 🏢 **Workspace & SOW Management**

#### **Workspace Creation Progress (`tailwind/workspace-creation-progress.tsx`)**
Multi-step workspace creation wizard with progress tracking and error handling.

#### **New SOW Modal (`tailwind/new-sow-modal.tsx`)**
Modal dialog for creating new SOW documents with template selection and initial configuration.

#### **SOW Tag Selector (`tailwind/sow-tag-selector.tsx`)**
Vertical and service line tagging interface for business intelligence categorization.

#### **SOW Type Badge (`tailwind/sow-type-badge.tsx`)**
Visual indicators for SOW types (project, audit, retainer) with color coding and styling.

---

### 📱 **UI & Interaction Components**

#### **Interactive Onboarding (`tailwind/interactive-onboarding.tsx`)**
Step-by-step tutorial system for new users with guided tour and feature introduction.

#### **Onboarding Flow (`tailwind/onboarding-flow.tsx`)**
Complete onboarding experience with workspace creation and initial setup guidance.

#### **Onboarding Tutorial (`tailwind/onboarding-tutorial.tsx`)**
Comprehensive tutorial system covering all platform features and workflows.

#### **Guided Client Setup (`tailwind/guided-client-setup.tsx`)**
Client setup wizard with requirements gathering and configuration assistance.

#### **Empty State Welcome (`tailwind/empty-state-welcome.tsx`)**
Welcome interface for empty states with action prompts and feature discovery.

---

### 🔧 **Utility & Extension Components**

#### **Extensions Server (`tailwind/extensions-server.ts`)**
Server-side extension management for custom functionality and plugin system.

#### **Extensions (`tailwind/extensions.ts`)**
Client-side extension framework for adding new features and capabilities.

#### **Table Menu (`tailwind/extensions/table-menu.tsx`)**
Contextual menu for table operations including sorting, filtering, and data manipulation.

#### **Editable Pricing Table (`ui/editable-pricing-table.tsx`)**
Standalone editable pricing table component with advanced editing capabilities.

---

### 🎯 **Generative AI Components**

#### **AI Selector (`tailwind/generative/ai-selector.tsx`)**
AI model selection interface with provider options and configuration settings.

#### **AI Selector New (`tailwind/generative/ai-selector-new.tsx`)**
Updated AI selector with improved UX and expanded model support.

#### **AI Selector Commands (`tailwind/generative/ai-selector-commands.tsx`)**
Command-based AI selection with keyboard shortcuts and quick access.

#### **AI Completion Command (`tailwind/generative/ai-completion-command.tsx`)**
Slash command interface for AI-powered content completion and insertion.

#### **Generative Menu Switch (`tailwind/generative/generative-menu-switch.tsx`)**
Toggle interface for switching between different generative AI modes and providers.

---

### 🎛️ **UI Control Components**

#### **Color Selector (`tailwind/selectors/color-selector.tsx`)**
Color picker component for theme customization and content styling.

#### **Link Selector (`tailwind/selectors/link-selector.tsx`)**
URL and link management interface with validation and preview capabilities.

#### **Math Selector (`tailwind/selectors/math-selector.tsx`)**
Mathematical equation editor and selector for technical documentation.

#### **Node Selector (`tailwind/selectors/node-selector.tsx`)**
Document node selection and manipulation interface for complex editing operations.

#### **Text Buttons (`tailwind/selectors/text-buttons.tsx`)**
Specialized text formatting buttons for enhanced typography control.

---

### 🔧 **UI Foundation Components**

#### **Alert (`tailwind/ui/alert.tsx`)**
Alert notification component with different severity levels and styling options.

#### **Badge (`tailwind/ui/badge.tsx`)**
Status and category badge component with various color schemes and sizes.

#### **Button (`tailwind/ui/button.tsx`)**
Primary button component with multiple variants, sizes, and states.

#### **Card (`tailwind/ui/card.tsx`)**
Card container component for grouping related content and actions.

#### **Command (`tailwind/ui/command.tsx`)**
Command palette interface with searchable actions and keyboard navigation.

#### **Dialog (`tailwind/ui/dialog.tsx`)**
Modal dialog component with overlay, focus management, and animation support.

#### **Input (`tailwind/ui/input.tsx`)**
Text input component with validation, error states, and various input types.

#### **Label (`tailwind/ui/label.tsx`)**
Form label component with accessibility features and proper associations.

#### **Menu (`tailwind/ui/menu.tsx`)**
Dropdown menu component with keyboard navigation and nested items.

#### **Popover (`tailwind/ui/popover.tsx`)**
Popover component for contextual information and actions.

#### **Scroll Area (`tailwind/ui/scroll-area.tsx`)**
Custom scrollable area with touch support and custom styling.

#### **Select (`tailwind/ui/select.tsx`)**
Select dropdown component with searchable options and multiple selection.

#### **Separator (`tailwind/ui/separator.tsx`)**
Visual separator component for content organization and layout.

#### **Switch (`tailwind/ui/switch.tsx`)**
Toggle switch component for boolean settings and preferences.

#### **Table (`tailwind/ui/table.tsx`)**
Data table component with sorting, filtering, and pagination.

#### **Tabs (`tailwind/ui/tabs.tsx`)**
Tab navigation component with content switching and state management.

#### **Textarea (`tailwind/ui/textarea.tsx`)**
Multi-line text input component with resizing and character counting.

---

### 🖼️ **Icon Components**

#### **Crazy Spinner (`tailwind/ui/icons/crazy-spinner.tsx`)**
Animated loading spinner with unique styling and motion effects.

#### **Font Default (`tailwind/ui/icons/font-default.tsx`)**
Default typography icon for font selection and formatting.

#### **Font Mono (`tailwind/ui/icons/font-mono.tsx`)**
Monospace font icon for code and technical content styling.

#### **Font Serif (`tailwind/ui/icons/font-serif.tsx`)**
Serif font icon for traditional typography styling.

#### **Loading Circle (`tailwind/ui/icons/loading-circle.tsx`)**
Simple circular loading indicator with customizable size and color.

#### **Magic (`tailwind/ui/icons/magic.tsx`)**
Magic wand icon for AI and automated feature indication.

#### **Icon Index (`tailwind/ui/icons/index.tsx`)**
Centralized icon export and management system.

---

### 🏢 **Backend Services**

#### **Main Service (`backend/main.py`)**
FastAPI application providing PDF generation, Google Sheets integration, and health check endpoints.

#### **Google OAuth Handler (`backend/services/google_oauth_handler.py`)**
OAuth authentication handler for Google Sheets API access and token management.

#### **Google Sheets Generator (`backend/services/google_sheets_generator.py`)**
SOW to Google Sheets export functionality with formatting and data transformation.

---

## 🚀 **Complete Feature Overview**

### 🎯 **Core SOW Generation Features**

#### **AI-Powered Content Creation**
- **"The Architect" AI Agent** specialized in SOW generation
- **Context-aware prompting** with rate card integration
- **Streaming responses** with real-time thinking display
- **Structured JSON output** with pricing data and narrative
- **Multi-model support** via OpenRouter and AnythingLLM

#### **Interactive Rich Text Editor**
- **TipTap/ProseMirror integration** with custom SOW extensions
- **Real-time collaboration** with conflict resolution
- **Drag-drop pricing tables** with live calculations
- **Auto-save functionality** with 1.5s debounce
- **Version history** and document restoration

#### **Advanced Pricing System**
- **82+ Granular Roles** from Social Garden rate card
- **Real-time calculations** for hours, rates, and totals
- **Smart discount application** with percentage or fixed amounts
- **GST calculation** (10% Australian tax)
- **Rounding optimization** to nearest $100 for clean presentation

### 📊 **Business Intelligence Features**

#### **Real-time Dashboard Analytics**
- **SOW metrics tracking** (total value, active proposals, monthly counts)
- **Client performance analysis** with top clients and revenue tracking
- **Service line analytics** showing popular services and trends
- **Vertical industry analysis** for market segmentation
- **Real-time activity monitoring** with live updates

#### **Interactive Filtering System**
- **Click-to-filter by vertical** (property, education, finance, etc.)
- **Service line filtering** (CRM, marketing automation, etc.)
- **Date range selection** for temporal analysis
- **Combined filters** for complex queries
- **Filter persistence** across sessions

#### **Data Visualization**
- **Progress charts** showing conversion funnels
- **Revenue trends** with monthly/quarterly comparisons
- **Client distribution** with pie charts and graphs
- **Service popularity** with horizontal bar charts
- **Activity timelines** with chronological views

### 🤖 **AI & Chat Integration**

#### **AnythingLLM Integration**
- **Dual-workspace architecture** (client + master dashboard)
- **Document embedding** with semantic search
- **Streaming chat responses** with SSE support
- **Thread management** per SOW document
- **Context-aware conversations** with embedded knowledge

#### **Multi-Agent Support**
- **The Architect** (primary SOW generator)
- **Analytics Assistant** (dashboard queries)
- **Custom agent creation** with system prompts
- **Agent switching** with preference persistence
- **Performance monitoring** per agent

#### **Advanced Chat Features**
- **Streaming responses** with real-time display
- **Thinking process visualization** via collapsible accordion
- **File attachment support** for document uploads
- **Message persistence** with conversation history
- **Context switching** between dashboard and editor modes

### 💼 **Client Portal & Sharing**

#### **Secure Client Portal**
- **Share link generation** with unique URLs
- **No-login access** for clients
- **Branded experience** with Social Garden styling
- **Mobile responsive** design for all devices
- **Real-time engagement tracking** with view analytics

#### **Digital Signature System**
- **Canvas drawing** for signature capture
- **Typed signatures** with font selection
- **File upload** for existing signatures
- **Legal compliance** with IP logging and timestamps
- **Terms acceptance** with checkbox confirmation

#### **Client Feedback System**
- **Section-specific comments** with contextual threading
- **Read/unread tracking** for agency follow-up
- **Threaded discussions** for complex feedback
- **Email notifications** for new comments
- **Resolution tracking** with status updates

### 📄 **Export & Integration**

#### **Professional PDF Export**
- **WeasyPrint generation** with Social Garden branding
- **Plus Jakarta Sans typography** for professional appearance
- **Custom templates** with branded headers and footers
- **Pricing table formatting** with proper currency display
- **Print-optimized layouts** with page breaks and margins

#### **Google Sheets Integration**
- **OAuth authentication** with secure token handling
- **Automated sheet creation** with SOW data formatting
- **Collaborative editing** with real-time sync
- **Share link generation** for client access
- **Template customization** with branded styling

#### **Excel Export**
- **Detailed pricing breakdown** with all role information
- **Formula preservation** for ongoing calculations
- **Conditional formatting** for visual enhancement
- **Multiple worksheets** for comprehensive data
- **Professional formatting** with headers and footers

### 🏗️ **Workspace Management**

#### **Client Workspace Creation**
- **Automated AnythingLLM workspace** creation per client
- **Rate card embedding** with 82+ roles for AI access
- **Default thread creation** for SOW conversations
- **Master dashboard synchronization** for analytics
- **Custom prompt injection** with The Architect configuration

#### **Hierarchical Organization**
- **Folder structure** with nested workspace organization
- **Drag-drop reordering** for custom organization
- **Bulk operations** for efficiency
- **Search and filtering** within workspace hierarchy
- **Export capabilities** for external backup

### 🔧 **Administrative Features**

#### **System Administration**
- **User preference management** with cloud synchronization
- **Agent configuration** with system prompt editing
- **Database management** with health monitoring
- **API endpoint documentation** with interactive testing
- **Performance monitoring** with real-time metrics

#### **Quality Assurance**
- **Role validation** ensuring mandatory roles inclusion
- **Pricing enforcement** with business rules
- **Content sanitization** with XSS protection
- **Data integrity checks** with validation rules
- **Error tracking** with detailed logging

### 🔐 **Security & Compliance**

#### **Data Protection**
- **End-to-end encryption** for sensitive data
- **Secure OAuth implementation** with token rotation
- **API key management** with environment isolation
- **Access logging** with audit trails
- **GDPR compliance** with data retention policies

#### **Legal Compliance**
- **Digital signature legal framework** with proper logging
- **Terms of service integration** with acceptance tracking
- **Client consent management** with explicit opt-in
- **Data export rights** with client data portability
- **Right to deletion** with cascade removal

### 📱 **Mobile & Responsive Design**

#### **Cross-Platform Compatibility**
- **Mobile-optimized interface** with touch-friendly controls
- **Tablet support** with responsive layouts
- **Desktop enhancement** with advanced features
- **Progressive web app** capabilities for offline access
- **Cross-browser support** with polyfills and fallbacks

### 🚀 **Performance & Scalability**

#### **Optimization Features**
- **Code splitting** with dynamic imports
- **Image optimization** with Next.js Image component
- **Bundle size optimization** with tree shaking
- **Database query optimization** with indexing
- **Caching strategies** with Redis and CDN integration

#### **Monitoring & Analytics**
- **Real-time performance monitoring** with alerts
- **Error tracking** with stack trace analysis
- **User analytics** with privacy-compliant tracking
- **API performance** with response time monitoring
- **System health** with automated health checks

---

## 🏆 **Key Differentiators**

### **1. AI-First Approach**
Unlike traditional document generators, our platform leverages AI as the primary content creation tool, with "The Architect" agent specifically trained for SOW generation.

### **2. Real-time Collaboration**
Advanced editing capabilities with AI integration, allowing users to chat with AI while editing documents in real-time.

### **3. Business Intelligence Integration**
Built-in analytics dashboard with vertical and service line filtering, providing actionable business insights.

### **4. Comprehensive Pricing System**
82+ granular roles with real-time calculations, smart discounts, and tax handling for accurate project estimates.

### **5. Client Portal Innovation**
Secure, branded client portal with digital signatures, feedback systems, and engagement tracking.

### **6. Enterprise-Grade Architecture**
Production-ready system with MySQL database, FastAPI backend, Docker deployment, and comprehensive monitoring.

---

## 📞 **Support & Resources**

### **Documentation**
- [Project Overview](./COMPREHENSIVE-PROJECT-OVERVIEW.md)
- [API Documentation](./ANYTHINGLLM-ENDPOINTS-REFERENCE.md)
- [Database Schema](./database/schema.sql)
- [Deployment Guide](./QUICK-DEPLOYMENT-GUIDE.md)

### **Technical Support**
- GitHub Issues: [Project Repository](https://github.com/khaledbashir/the11-dev)
- Email: Technical support via repository issues
- Documentation: Comprehensive guides in `/docs` directory

### **Training Resources**
- Interactive onboarding system built into the application
- Video tutorials and explainer scripts
- Best practices documentation for AI prompt engineering
- Role and pricing system guides

---

**Document Version:** 1.0.0  
**Last Updated:** October 27, 2025  
**Next Review:** November 27, 2025  
**Status:** Complete Component Documentation
