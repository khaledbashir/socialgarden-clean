# Visual Architecture: Dual-Context Chat Sidebar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAGE.TSX (PARENT)                              │
│                                                                             │
│  State:                                                                     │
│  • viewMode: 'dashboard' | 'editor'  ← THE KEY DISCRIMINATOR               │
│  • dashboardChatTarget: string (e.g., 'sow-master-dashboard', 'hello')     │
│  • currentDoc: { workspaceSlug, threadSlug, ... }                          │
│                                                                             │
└────────────────────────┬────────────────────────────────────────────────────┘
                         │
                         │ Props Passed Down:
                         │ • viewMode={viewMode}
                         │ • dashboardChatTarget={dashboardChatTarget}
                         │ • editorWorkspaceSlug={currentDoc?.workspaceSlug}
                         │ • editorThreadSlug={currentDoc?.threadSlug}
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AGENT-SIDEBAR-CLEAN.TSX                                │
│                      (SINGLE COMPONENT, DUAL CONTEXTS)                      │
│                                                                             │
│  Internal Logic:                                                            │
│  const isDashboardMode = viewMode === 'dashboard';                          │
│  const isEditorMode = viewMode === 'editor';                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CONDITIONAL BRANCHING                           │   │
│  │                                                                     │   │
│  │  isDashboardMode ?                      : isEditorMode ?           │   │
│  │  ┌─────────────────────────┐            ┌──────────────────────┐   │   │
│  │  │  DASHBOARD CONTEXT      │            │  EDITOR CONTEXT      │   │   │
│  │  └─────────────────────────┘            └──────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────┬─────────────────────────────────────┐   │
│  │  DASHBOARD MODE               │  EDITOR MODE                        │   │
│  ├───────────────────────────────┼─────────────────────────────────────┤   │
│  │ Persona Name:                 │ Persona Name:                       │   │
│  │  • "Analytics Assistant"      │  • "The Architect"                  │   │
│  │    (if master dashboard)      │                                     │   │
│  │  • "The Architect"            │ Persona Subtitle:                   │   │
│  │    (if client workspace)      │  • "SOW generation"                 │   │
│  │                               │                                     │   │
│  │ Persona Subtitle:             │ Workspace Source:                   │   │
│  │  • "Master Dashboard"         │  • editorWorkspaceSlug              │   │
│  │  • "Client Workspace"         │    (from current SOW)               │   │
│  │                               │                                     │   │
│  │ Workspace Source:             │ Features:                           │   │
│  │  • dashboardChatTarget        │  • ✅ Insert to Editor              │   │
│  │                               │  • ✅ Thread Sync with Parent       │   │
│  │ Features:                     │  • ✅ System Prompt Display         │   │
│  │  • ❌ NO Insert Button        │  • ✅ Full Chat Controls            │   │
│  │  • ✅ Workspace Dropdown      │  • ❌ NO Workspace Dropdown         │   │
│  │  • ❌ Query-Only Mode         │  • ✅ SOW Generation Mode           │   │
│  │  • ❌ NO System Prompt        │                                     │   │
│  │                               │ Empty State:                        │   │
│  │ Empty State:                  │  • "Ask The Architect to            │   │
│  │  • "Query your embedded       │     generate a new SOW..."          │   │
│  │     SOWs and get business     │                                     │   │
│  │     insights. I cannot        │ Placeholder:                        │   │
│  │     create new SOWs."         │  • "Type /help for commands..."     │   │
│  │                               │                                     │   │
│  │ Placeholder:                  │ API Routing:                        │   │
│  │  • "Ask a question about      │  • Workspace: currentDoc.           │   │
│  │     an existing SOW..."       │    workspaceSlug                    │   │
│  │                               │    (e.g., "hello", "pho")           │   │
│  │ API Routing:                  │  • Endpoint: /api/anythingllm/      │   │
│  │  • Workspace: dashboardChat   │    stream-chat                      │   │
│  │    Target                     │  • Thread: currentDoc.threadSlug    │   │
│  │    (e.g., "sow-master-        │                                     │   │
│  │     dashboard", "hello")      │                                     │   │
│  │  • Endpoint: /api/anythingllm/│                                     │   │
│  │    stream-chat                │                                     │   │
│  │  • Thread: local state only   │                                     │   │
│  └───────────────────────────────┴─────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                         │
                         │ API Calls Go To:
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   /API/ANYTHINGLLM/STREAM-CHAT                              │
│                                                                             │
│  Query Params:                                                              │
│  • workspace: dashboardChatTarget (dashboard) OR                            │
│               editorWorkspaceSlug (editor)                                  │
│  • thread: threadSlug (optional, for persistence)                           │
│  • mode: 'chat' (always, for thread history)                                │
│                                                                             │
│  Routes To AnythingLLM:                                                     │
│  • POST {ANYTHINGLLM_URL}/api/v1/workspace/{workspace}/stream-chat          │
│  • Uses workspace-specific system prompt                                    │
│  • Persists messages to thread history                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANYTHINGLLM SERVER                                   │
│                                                                             │
│  Workspaces:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ sow-master-dashboard (Master Analytics)                            │   │
│  │  • Contains: All embedded SOWs                                      │   │
│  │  • Purpose: Business intelligence queries                           │   │
│  │  • System Prompt: "You are an Analytics Assistant..."              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ hello (Client Workspace)                                            │   │
│  │  • Contains: SOWs for "Hello" client                                │   │
│  │  • Purpose: SOW generation for this client                          │   │
│  │  • System Prompt: "You are The Architect v2..."                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ pho (Client Workspace)                                              │   │
│  │  • Contains: SOWs for "Pho" client                                  │   │
│  │  • Purpose: SOW generation for this client                          │   │
│  │  • System Prompt: "You are The Architect v2..."                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ... (more client workspaces)                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## User Journey Examples

### Example 1: Dashboard Mode (Master Analytics)

```
1. USER clicks "Dashboard" button in sidebar
   └─> page.tsx: setViewMode('dashboard')
   └─> page.tsx: dashboardChatTarget = 'sow-master-dashboard'

2. AgentSidebar receives props:
   └─> viewMode = 'dashboard'
   └─> dashboardChatTarget = 'sow-master-dashboard'

3. Component Logic:
   └─> isDashboardMode = true
   └─> personaName = 'Analytics Assistant'
   └─> personaSubtitle = 'Master Dashboard'
   └─> Shows workspace dropdown (can switch to client workspaces)
   └─> Hides insert button

4. USER types: "How many SOWs were created this month?"

5. handleSendMessage():
   └─> workspaceSlug = dashboardChatTarget ('sow-master-dashboard')
   └─> API call: /api/anythingllm/stream-chat?workspace=sow-master-dashboard

6. AnythingLLM:
   └─> Uses master dashboard workspace
   └─> Queries embedded SOWs
   └─> Returns analytics data
```

### Example 2: Editor Mode (SOW Generation)

```
1. USER clicks on SOW "Project for Hello Client" in sidebar
   └─> page.tsx: setViewMode('editor')
   └─> page.tsx: currentDoc = { workspaceSlug: 'hello', threadSlug: 'thread-123', ... }

2. AgentSidebar receives props:
   └─> viewMode = 'editor'
   └─> editorWorkspaceSlug = 'hello'
   └─> editorThreadSlug = 'thread-123'

3. Component Logic:
   └─> isEditorMode = true
   └─> personaName = 'The Architect'
   └─> personaSubtitle = 'SOW generation'
   └─> Hides workspace dropdown
   └─> Shows insert button
   └─> Displays workspace system prompt

4. USER types: "Add a data migration workstream"

5. handleSendMessage():
   └─> workspaceSlug = editorWorkspaceSlug ('hello')
   └─> threadSlug = editorThreadSlug ('thread-123')
   └─> API call: /api/anythingllm/stream-chat?workspace=hello&thread=thread-123

6. AnythingLLM:
   └─> Uses 'hello' client workspace
   └─> Applies "The Architect v2" system prompt
   └─> Generates SOW content
   └─> Persists to thread-123

7. USER clicks "Insert to Editor" button
   └─> Content inserted into TipTap editor
   └─> SOW updated and saved
```

### Example 3: Dashboard Mode (Client Workspace Switch)

```
1. USER is in Dashboard mode, selects "Hello" from workspace dropdown
   └─> page.tsx: setDashboardChatTarget('hello')

2. AgentSidebar receives updated props:
   └─> viewMode = 'dashboard' (unchanged)
   └─> dashboardChatTarget = 'hello' (changed)

3. Component Logic:
   └─> isDashboardMode = true (unchanged)
   └─> personaName = 'The Architect' (changed - now client workspace)
   └─> personaSubtitle = 'Client Workspace' (changed)
   └─> Still shows workspace dropdown
   └─> Still hides insert button (query-only in dashboard)

4. USER types: "Show me all SOWs for Hello client"

5. handleSendMessage():
   └─> workspaceSlug = dashboardChatTarget ('hello')
   └─> API call: /api/anythingllm/stream-chat?workspace=hello

6. AnythingLLM:
   └─> Uses 'hello' workspace
   └─> Queries embedded SOWs in this workspace only
   └─> Returns client-specific data
```

## Key Insight

**The same React component (`agent-sidebar-clean.tsx`) renders completely different UIs and routes to different AnythingLLM workspaces based solely on the `viewMode` prop.** This is a textbook example of component polymorphism in React.

The component is NOT confused or duplicated. It's a **single source of truth** that adapts its behavior through prop-driven conditional rendering.
