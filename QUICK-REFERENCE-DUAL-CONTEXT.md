# Quick Reference: Dual-Context Chat Sidebar

## The One Thing You Need to Know

```tsx
// agent-sidebar-clean.tsx is ONE component with TWO modes:

const isDashboardMode = viewMode === 'dashboard';  // Boolean flag
const isEditorMode = viewMode === 'editor';        // Boolean flag

// Everything else is just if/else based on these flags:
{isDashboardMode ? <DashboardUI /> : <EditorUI />}
```

## The Props That Control Everything

```tsx
<AgentSidebar
  viewMode={viewMode}                    // 🔑 'dashboard' or 'editor'
  dashboardChatTarget={dashboardChatTarget}  // For dashboard mode
  editorWorkspaceSlug={currentDoc?.workspaceSlug}  // For editor mode
  editorThreadSlug={currentDoc?.threadSlug}
  // ... other props ...
/>
```

## The Routing Pattern (Appears 17 Times)

```tsx
const ws = isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug;
```

## Quick Truth Tables

### Persona Display

| viewMode | dashboardChatTarget | Persona | Subtitle |
|----------|---------------------|---------|----------|
| 'dashboard' | 'sow-master-dashboard' | Analytics Assistant | Master Dashboard |
| 'dashboard' | 'hello' | The Architect | Client Workspace |
| 'editor' | (any) | The Architect | SOW generation |

### Workspace Routing

| viewMode | Source Prop | Workspace Slug Used |
|----------|------------|---------------------|
| 'dashboard' | `dashboardChatTarget` | 'sow-master-dashboard' or client |
| 'editor' | `editorWorkspaceSlug` | Current SOW's workspace |

### Feature Availability

| Feature | Dashboard | Editor |
|---------|-----------|--------|
| Insert Button | ❌ | ✅ |
| Workspace Dropdown | ✅ | ❌ |
| System Prompt Display | ❌ | ✅ |
| File Attachments | ❌ | ✅ |
| Settings Button | ❌ | ✅ |

## Code Locations

- Mode detection: Lines 615-621
- Persona logic: Lines 623-629
- Thread loading: Lines 631-639
- System prompt: Lines 679-701
- Workspace dropdown: Lines 705-722
- Main UI conditional: Lines 783-1130
- Message sending: Lines 544-560

## Common Patterns

### Pattern 1: Workspace Selection
```tsx
const ws = isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug;
```

### Pattern 2: Conditional Rendering
```tsx
{isDashboardMode && <DashboardOnlyFeature />}
{isEditorMode && <EditorOnlyFeature />}
```

### Pattern 3: Conditional Logic
```tsx
if (isDashboardMode) {
  // Dashboard-specific logic
} else if (isEditorMode) {
  // Editor-specific logic
}
```

## Parent Component (page.tsx)

### View Mode State
```tsx
const [viewMode, setViewMode] = useState<'editor' | 'dashboard'>('dashboard');
```

### Switching Modes
```tsx
setViewMode('dashboard');  // Show Analytics Assistant
setViewMode('editor');     // Show The Architect
```

### Routing Logic
```tsx
if (isDashboardMode) {
  workspaceSlug = dashboardChatTarget;  // Master or client
} else {
  workspaceSlug = currentDoc?.workspaceSlug;  // SOW's workspace
}
```

## API Endpoints (Both Modes Use Same Routes)

- `/api/anythingllm/stream-chat` - Streaming chat
- `/api/anythingllm/thread` - Thread CRUD
- `/api/anythingllm/threads` - Thread listing

**The difference is in the `workspace` query parameter:**
- Dashboard: `?workspace=sow-master-dashboard`
- Editor: `?workspace=hello` (or other client workspace)

## Key Insight

**Same component, same API routes, different workspaces.**

The entire dual-context behavior is achieved through:
1. A single prop: `viewMode`
2. Conditional rendering: `{isDashboardMode ? ... : ...}`
3. Workspace routing: `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`

**This is NOT confusion. This is elegant architecture.**
