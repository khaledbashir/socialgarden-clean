# 🖋️ Scribe System - Architecture Design

## Concept
**Scribe** = A purpose-built AI writing assistant with its own personality, knowledge, and capabilities.

Each Scribe is actually an **AnythingLLM Workspace** with:
- Custom system prompt (defines personality & instructions)
- Specific LLM model selection (GPT-4, Claude, Gemini, etc.)
- Agent skills (@agent commands for RAG, web search, etc.)
- Embedded knowledge base (documents, templates, guides)
- Chat history and memory settings

## Why "Scribe"?
- Professional writing terminology
- Implies expertise and craftsmanship
- Clear purpose: AI that writes
- Not generic (vs "Agent" or "Assistant")

## User Experience Flow

### 1. Create a Scribe
```
User clicks: "Create New Scribe"
  ↓
Opens: Scribe Configuration Form
  - Name (e.g., "The Architect", "Email Copywriter", "Blog Writer")
  - System Prompt (the Scribe's instructions & personality)
  - Model Selection (GPT-4, Claude 3.5, Gemini 2.5, etc.)
  - Chat Mode (Chat vs Query)
  - Temperature (creativity level)
  - Chat History (how much context to remember)
  ↓
Backend: Creates AnythingLLM workspace with these settings
  ↓
Result: New Scribe appears in sidebar, ready to use
```

### 2. Using a Scribe
- User selects Scribe from dropdown (like selecting workspace)
- Chat interface connects to that specific AnythingLLM workspace
- All responses use that Scribe's configuration
- Can use @agent commands if configured (e.g., @search, @rag)

### 3. Managing Scribes
- Edit: Update system prompt, model, temperature
- Embed Documents: Add knowledge base (PDFs, docs, URLs)
- Configure Agents: Enable/disable skills (@search, @rag, @scrape)
- Delete: Remove Scribe (and its workspace)
- Clone: Duplicate successful Scribe configurations

## Technical Implementation

### Database Schema
```sql
-- Scribes table (mirrors agents, but maps to AnythingLLM workspaces)
CREATE TABLE scribes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  workspace_slug VARCHAR(255) UNIQUE NOT NULL, -- AnythingLLM workspace slug
  model VARCHAR(100) DEFAULT 'gpt-4',
  temperature DECIMAL(2,1) DEFAULT 0.7,
  chat_mode ENUM('chat', 'query') DEFAULT 'chat',
  chat_history INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Scribe documents (embedded knowledge)
CREATE TABLE scribe_documents (
  id VARCHAR(255) PRIMARY KEY,
  scribe_id VARCHAR(255) NOT NULL,
  document_name VARCHAR(255),
  document_type VARCHAR(50),
  anythingllm_doc_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scribe_id) REFERENCES scribes(id) ON DELETE CASCADE
);
```

### API Routes
```
POST   /api/scribes              - Create new Scribe (+ AnythingLLM workspace)
GET    /api/scribes              - List all Scribes
GET    /api/scribes/:id          - Get Scribe details
PUT    /api/scribes/:id          - Update Scribe configuration
DELETE /api/scribes/:id          - Delete Scribe (+ workspace)
POST   /api/scribes/:id/documents - Embed document into Scribe
GET    /api/scribes/:id/chat     - Chat with specific Scribe
```

### Frontend Components
```
components/
  ├── scribe-creator.tsx        - Modal for creating new Scribe
  ├── scribe-editor.tsx         - Form for editing Scribe config
  ├── scribe-selector.tsx       - Dropdown to select active Scribe
  ├── scribe-document-manager.tsx - Upload/manage Scribe knowledge
  └── scribe-chat.tsx           - Chat interface (connects to workspace)
```

## Key Features

### 1. System Prompt Templates
Pre-built templates for common use cases:
- **SOW Generator** (The Architect)
- **Email Copywriter**
- **Blog Post Writer**
- **Social Media Manager**
- **Technical Documentation Writer**
- **SEO Content Specialist**

### 2. Model Flexibility
Support all AnythingLLM-compatible models:
- OpenAI: GPT-4, GPT-4 Turbo, GPT-3.5
- Anthropic: Claude 3.5 Sonnet, Claude 3 Opus
- Google: Gemini 2.5 Flash, Gemini Pro
- Local: Ollama models, LM Studio

### 3. Agent Skills (@commands)
Enable specialized capabilities:
- `@search` - Web search for current information
- `@rag` - Retrieve from embedded knowledge base
- `@scrape` - Extract content from URLs
- `@analyze` - Deep analysis mode

### 4. Knowledge Base Per Scribe
Each Scribe can have its own embedded documents:
- Company brand guidelines
- Previous writing samples
- Style guides
- Reference materials
- Templates library

## User Stories

### Story 1: Sam creates "The Architect" Scribe
```
1. Sam clicks "Create New Scribe"
2. Names it: "The Architect (SOW Generator)"
3. Pastes the massive system prompt about SOW formatting
4. Selects model: "gemini-2.5-flash" (fast + cost-effective)
5. Sets temperature: 0.3 (low creativity, precise formatting)
6. Sets chat history: 5 (only recent context)
7. Clicks "Create Scribe"

Backend:
- Creates AnythingLLM workspace: "the-architect-sow-generator"
- Configures workspace with system prompt
- Sets model to Gemini 2.5 Flash
- Returns Scribe object with workspace_slug

Result:
- "The Architect" appears in Scribe dropdown
- When selected, all chats use that workspace
- Perfect SOW formatting every time
```

### Story 2: Sam creates "Email Wizard" Scribe
```
1. Creates new Scribe: "Email Wizard"
2. System prompt: Email marketing expert with brand voice
3. Model: Claude 3.5 Sonnet (best at creative writing)
4. Temperature: 0.8 (more creative)
5. Uploads documents:
   - Social Garden brand guidelines
   - 10 best-performing emails
   - Email template library
6. Enables @rag agent skill

Usage:
- User: "Write a product launch email for HubSpot implementation @rag"
- Scribe retrieves relevant templates and brand guidelines
- Generates on-brand email copy
- User inserts into email platform
```

## Migration Path (Agents → Scribes)

### Current "Agents" System
- Stored locally in database
- Each agent has system prompt + model
- Limited to our app's capabilities
- No document embedding
- No RAG/search features

### New "Scribes" System
- Each Scribe = AnythingLLM workspace
- Full AnythingLLM feature set
- Document embedding + RAG
- @agent skills
- Better memory management
- Can be shared/exported

### Migration Strategy
1. **Phase 1**: Add Scribes alongside Agents
2. **Phase 2**: Convert existing Agents to Scribes automatically
3. **Phase 3**: Deprecate old Agent system
4. **Phase 4**: Full Scribe-only system

## Comparison: Agents vs Scribes

| Feature | Current Agents | New Scribes |
|---------|---------------|-------------|
| System Prompt | ✅ Yes | ✅ Yes |
| Model Selection | ✅ Yes | ✅ Yes (more models) |
| Chat History | ❌ No | ✅ Configurable (5-100) |
| Document Embedding | ❌ No | ✅ Yes |
| RAG Retrieval | ❌ No | ✅ Yes (@rag) |
| Web Search | ❌ No | ✅ Yes (@search) |
| Temperature Control | ❌ No | ✅ Yes (0-1) |
| Chat/Query Modes | ❌ No | ✅ Yes |
| Skills (@agents) | ❌ No | ✅ Yes |
| Export/Import | ❌ No | ✅ Yes (workspace export) |
| Backend | Our API | AnythingLLM API |

## Next Steps

1. ✅ Design complete
2. [ ] Create database migration for `scribes` table
3. [ ] Build `/api/scribes/*` routes
4. [ ] Create ScribeCreator component
5. [ ] Update UI to show "Scribes" instead of "Agents"
6. [ ] Implement AnythingLLM workspace creation integration
7. [ ] Add document upload functionality
8. [ ] Test with "The Architect" as first Scribe
9. [ ] Add pre-built Scribe templates
10. [ ] Document in MASTER-GUIDE.md

## Benefits

### For Users:
- More powerful AI assistants
- Can upload reference materials
- Better context understanding
- Specialized tools (@commands)
- Consistent output quality

### For Business:
- Leverage AnythingLLM infrastructure
- No need to build RAG from scratch
- Better knowledge management
- Scalable architecture
- Professional feature set

---

**Decision**: Use "Scribe" as the term. It's perfect. 🖋️
