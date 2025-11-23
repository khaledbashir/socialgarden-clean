# AnythingLLM Workspace Architecture - Complete Map

## 🏗️ Current Workspace Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    AnythingLLM Instance                         │
│        https://ahmad-anything-llm.840tjq.easypanel.host         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                             │
        ▼                                             ▼
┌──────────────────┐                      ┌──────────────────────┐
│  SIDEBAR CHAT    │                      │   EDITOR "ASK AI"    │
│   Workspaces     │                      │     Workspace        │
└──────────────────┘                      └──────────────────────┘
        │                                             │
        │                                             │
        ├──► gen-the-architect                       └──► pop ⭐ NEW
        │    (SOW Generation)                             (Inline Editing)
        │
        ├──► property-marketing-pro
        │    (Marketing Content)
        │
        ├──► ad-copy-machine
        │    (Ad Copy)
        │
        ├──► crm-communication-specialist
        │    (Email Templates)
        │
        ├──► case-study-crafter
        │    (Case Studies)
        │
        ├──► landing-page-persuader
        │    (Landing Pages)
        │
        ├──► seo-content-strategist
        │    (SEO Content)
        │
        └──► proposal-and-audit-specialist
             (Proposals)
```

---

## 🎯 Workspace Roles & Purposes

### 1. **Sidebar Chat Workspaces** (Gardner Agents)
**Location**: Right sidebar chat panel  
**Use Case**: Full document generation, complex conversations  
**Workspaces**:
- `gen-the-architect` - Complete SOW creation
- `property-marketing-pro` - Marketing materials
- `ad-copy-machine` - Advertisement copy
- `crm-communication-specialist` - CRM templates
- `case-study-crafter` - Case studies
- `landing-page-persuader` - Landing pages
- `seo-content-strategist` - SEO-optimized content
- `proposal-and-audit-specialist` - Proposals and audits

**Features**:
- Multi-turn conversations
- Context retention across messages
- Streaming responses with thinking display
- Insert into editor functionality

---

### 2. **Editor "Ask AI" Workspace** ⭐ **NEW - NEEDS SETUP**
**Workspace Slug**: `pop`  
**Location**: Inline editor popup (text selection + "Ask AI" button)  
**Use Case**: Quick text transformations, editing assistance  

**Features**:
- Single-turn commands
- Text transformation (improve, fix, shorten, etc.)
- Grammar and spelling fixes
- Context-aware editing
- Instant feedback

**Commands**:
- `continue` - Continue writing
- `improve` - Make text better
- `shorter` - Condense text
- `longer` - Expand with details
- `fix` - Fix grammar/spelling
- Custom: Any freeform instruction

**Example Usage**:
```
User selects: "The project will be done by the team"
Command: "make this more professional"
AI returns: "The deliverable will be completed by our specialized team"
```

---

### 3. **Dashboard AI Workspace**
**Workspace Slug**: `sow-master-dashboard`  
**Location**: Dashboard view chat panel  
**Use Case**: Analytics, reporting, SOW aggregation  

**Features**:
- Query SOW data
- Generate reports
- Analytics insights
- Master dashboard queries

---

## 🔗 How They Connect to Your App

### Code Mapping

```typescript
// File: /frontend/lib/workspace-config.ts

WORKSPACE_CONFIG = {
  sidebar: {
    slug: 'gen',  // Base slug (Gardner workspaces extend this)
    purpose: 'Generate complete Statements of Work'
  },
  
  editor: {
    slug: 'pop',  // ⭐ EDITOR AI - NEEDS ANYTHINGLLM WORKSPACE
    purpose: 'Help with SOW editing and refinement'
  },
  
  dashboard: {
    slug: 'sow-master-dashboard',
    purpose: 'Analytics, reporting, and SOW aggregation'
  }
}
```

### API Routes

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend Components                                         │
└─────────────────────────────────────────────────────────────┘
              │                    │                    │
              │                    │                    │
              ▼                    ▼                    ▼
        Sidebar Chat          Editor AI           Dashboard
              │                    │                    │
              ▼                    ▼                    ▼
  /api/anythingllm/       /api/generate        /api/dashboard/
    stream-chat                                    chat
              │                    │                    │
              │                    │                    │
              └────────────────────┴────────────────────┘
                                   │
                                   ▼
                         AnythingLLM API
                    /api/v1/workspace/{slug}/...
```

### Workspace Routing Logic

```typescript
// Sidebar Chat
getWorkspaceForAgent('gen-the-architect') 
  → Returns: 'gen-the-architect'
  → Routes to: /api/anythingllm/stream-chat
  → Workspace: gen-the-architect

// Editor AI
process.env.ANYTHINGLLM_WORKSPACE_SLUG
  → Returns: 'pop'
  → Routes to: /api/generate
  → Workspace: pop ⭐

// Dashboard
dashboardChatTarget === 'sow-master-dashboard'
  → Routes to: /api/dashboard/chat
  → Workspace: sow-master-dashboard
```

---

## 📋 Setup Checklist

### ✅ Already Done
- [x] Sidebar chat workspaces created (Gardner agents)
- [x] Dashboard workspace created (`sow-master-dashboard`)
- [x] Streaming support implemented
- [x] Thinking accordion working
- [x] Code configured for `pop` workspace

### ⏳ Needs to be Done
- [ ] **Create `pop` workspace in AnythingLLM** ⭐ **CRITICAL**
- [ ] Configure AI model for editor workspace (Claude 3.5 recommended)
- [ ] Add system prompt for editing behavior
- [ ] Test inline "Ask AI" commands
- [ ] Add SOW-specific templates to workspace

---

## 🎯 Quick Setup Steps

### Create the `pop` Workspace

1. **Open AnythingLLM**: https://ahmad-anything-llm.840tjq.easypanel.host
2. **Click "New Workspace"**
3. **Enter Details**:
   - Name: `Editor AI Assistant`
   - Slug: `pop` (MUST BE EXACTLY THIS)
   - Description: `Inline editor AI for text transformations`
4. **Configure Model**: Choose Claude 3.5 Sonnet or GPT-4
5. **Save**

### Test It Works

1. Open your app
2. Create/open a document
3. Select some text
4. Click "Ask AI" button
5. Type command: `make this more professional`
6. Verify AI response streams in

---

## 🔍 Environment Variables Reference

```bash
# AnythingLLM Connection
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA

# Editor AI Workspace
ANYTHINGLLM_WORKSPACE_SLUG=pop  # ⭐ Maps to workspace slug
```

---

## 📊 Workspace Comparison

| Feature | Sidebar Chat | Editor AI | Dashboard AI |
|---------|-------------|-----------|--------------|
| **Purpose** | Full document generation | Quick text edits | Analytics & reporting |
| **Interaction** | Multi-turn conversation | Single commands | Data queries |
| **Location** | Right sidebar panel | Inline popup | Dashboard view |
| **Workspaces** | Multiple Gardner agents | Single `pop` workspace | Single dashboard workspace |
| **Streaming** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Context** | Full chat history | Selected text only | Dashboard data |
| **Use Case** | Create SOWs from scratch | Improve existing text | Analyze SOW data |

---

## 🚀 Next Steps

1. **Create `pop` workspace** in AnythingLLM (5 minutes)
2. **Test editor AI** with simple command
3. **Customize system prompt** for your editing style
4. **Add SOW templates** to workspace knowledge base
5. **Monitor usage** and refine prompts

---

## 📚 File References

- **Workspace Config**: `/frontend/lib/workspace-config.ts`
- **Editor AI Component**: `/frontend/components/tailwind/generative/ai-selector.tsx`
- **Editor API Route**: `/frontend/app/api/generate/route.ts`
- **Sidebar Chat API**: `/frontend/app/api/anythingllm/stream-chat/route.ts`
- **Dashboard Chat API**: `/frontend/app/api/dashboard/chat/route.ts`

---

## Summary

✅ **3 Separate Workspace Types** - Each with specific purpose  
✅ **Sidebar Chat** - Full document creation (8 Gardner workspaces)  
⭐ **Editor AI** - Quick edits (`pop` workspace - **NEEDS SETUP**)  
✅ **Dashboard AI** - Analytics and reporting  

**CREATE THE `pop` WORKSPACE AND YOUR EDITOR AI WILL BE FULLY FUNCTIONAL!** 🎉
