# Code Walkthrough: The Critical If/Else Statements

This document shows EVERY conditional statement in `agent-sidebar-clean.tsx` that creates the dual-context behavior.

## 1. Mode Detection (Lines 615-621)

```tsx
// FILE: agent-sidebar-clean.tsx
// LOCATION: Inside the component function body

const isDashboardMode = viewMode === 'dashboard';  // Boolean flag
const isEditorMode = viewMode === 'editor';        // Boolean flag

const currentWorkspaceName = availableWorkspaces.find(
  w => w.slug === dashboardChatTarget
)?.name || '🎯 All SOWs (Master)';

const isMasterView = dashboardChatTarget === 'sow-master-dashboard';
```

**Effect**: These 4 boolean values control EVERYTHING downstream.

---

## 2. Persona Display Logic (Lines 623-629)

```tsx
// IF/ELSE #1: Persona Name
const personaName = viewMode === 'dashboard'
  ? (isMasterView ? 'Analytics Assistant' : 'The Architect')  // Dashboard personas
  : 'The Architect';                                           // Editor persona

// IF/ELSE #2: Persona Subtitle
const personaSubtitle = viewMode === 'dashboard'
  ? (isMasterView ? 'Master Dashboard' : 'Client Workspace')  // Dashboard subtitles
  : 'SOW generation';                                          // Editor subtitle
```

**Truth Table**:

| viewMode | dashboardChatTarget | personaName | personaSubtitle |
|----------|---------------------|-------------|-----------------|
| 'dashboard' | 'sow-master-dashboard' | 'Analytics Assistant' | 'Master Dashboard' |
| 'dashboard' | 'hello' | 'The Architect' | 'Client Workspace' |
| 'editor' | (any) | 'The Architect' | 'SOW generation' |

---

## 3. Thread Loading Workspace Selection (Lines 631-639)

```tsx
// IF/ELSE #3: Which workspace to load threads from?
useEffect(() => {
  const ws = isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug;
  //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //          THIS IS THE KEY ROUTING DECISION
  
  if (ws) {
    loadThreads(ws);
    
    // IF/ELSE #4: Sync thread slug in editor mode only
    if (isEditorMode && editorThreadSlug) {
      setCurrentThreadSlug(editorThreadSlug);
    }
  }
}, [isDashboardMode, dashboardChatTarget, editorWorkspaceSlug, editorThreadSlug]);
```

**Effect**:
- Dashboard mode → loads threads from `dashboardChatTarget` ('sow-master-dashboard' or client workspace)
- Editor mode → loads threads from `editorWorkspaceSlug` (current SOW's workspace)

---

## 4. System Prompt Display (Editor Only) (Lines 679-701)

```tsx
// IF/ELSE #5: Show workspace system prompt?
{isEditorMode && (
  <div className="mt-3">
    <details className="group border border-[#0E2E33] rounded-md overflow-hidden">
      <summary className="cursor-pointer px-3 py-2 bg-[#0E2E33]/40">
        <span>🧩 Workspace System Prompt</span>
        <span className="ml-auto text-gray-400">The Architect v2</span>
      </summary>
      <div className="px-3 py-3 bg-[#0b0d0d]">
        {loadingPrompt ? (
          <div>Loading prompt…</div>
        ) : workspacePrompt ? (
          <pre>{workspacePrompt}</pre>
        ) : (
          <div>No prompt found for this workspace.</div>
        )}
      </div>
    </details>
  </div>
)}
```

**Effect**: 
- Editor mode → shows collapsible system prompt details
- Dashboard mode → hidden (doesn't render at all)

---

## 5. Workspace Dropdown (Dashboard Only) (Lines 705-722)

```tsx
// IF/ELSE #6: Show workspace selector dropdown?
{isDashboardMode && (
  <div className="mt-3">
    <Select
      value={dashboardChatTarget}
      onValueChange={onDashboardWorkspaceChange}
      disabled={loadingThreads}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select workspace..." />
      </SelectTrigger>
      <SelectContent>
        {availableWorkspaces.map((workspace) => (
          <SelectItem key={workspace.slug} value={workspace.slug}>
            {workspace.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

**Effect**:
- Dashboard mode → shows dropdown to switch between master and client workspaces
- Editor mode → hidden (workspace is fixed to current SOW)

---

## 6. Main UI Conditional Rendering (Lines 783-1130)

```tsx
// IF/ELSE #7: Which entire UI block to render?
{isDashboardMode ? (
  // ========================================
  // DASHBOARD MODE UI
  // ========================================
  <>
    <ScrollArea className="flex-1">
      <div className="p-5 space-y-5">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <Bot className="h-16 w-16 text-gray-600 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Master SOW Analytics  {/* DASHBOARD EMPTY STATE */}
            </h3>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Query your embedded SOWs and get business insights. 
              I cannot create new SOWs.  {/* LIMITATION STATEMENT */}
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div key={msg.id}>
              {/* Message rendering */}
              <div>
                {/* NO INSERT BUTTON IN DASHBOARD MODE - Query only */}
                {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
                {/* THIS COMMENT MARKS WHERE INSERT BUTTON WOULD BE */}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>

    <div className="p-5 border-t">
      <div className="flex items-end gap-3">
        <Textarea
          placeholder="Ask a question about an existing SOW..."
          {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
          {/* DASHBOARD PLACEHOLDER */}
        />
        {/* Enhance button (recently added) */}
        <Button onClick={handleEnhanceOnly}>✨</Button>
        <Button onClick={handleSendMessage}>
          <Send />
        </Button>
      </div>
    </div>
  </>
) : isEditorMode ? (
  // ========================================
  // EDITOR MODE UI
  // ========================================
  <>
    <ScrollArea className="flex-1">
      <div className="p-5 space-y-5">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <Bot className="h-16 w-16 text-gray-600 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">
              The Architect  {/* EDITOR EMPTY STATE */}
            </h3>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Ask me to generate a new Statement of Work...
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div key={msg.id}>
              {/* Message rendering WITH insert button */}
              {msg.role === 'assistant' && (
                <div className="sticky bottom-0 z-10">
                  {/* IF/ELSE #8: Show insert button for AI messages */}
                  {onInsertToEditor && (
                    <Button
                      onClick={() => {
                        const cleaned = extractNonJsonText(msg.content);
                        onInsertToEditor(cleaned);
                      }}
                    >
                      📝 Insert to Editor
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>

    <div className="p-5 border-t">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Type /help for commands..."
            {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
            {/* EDITOR PLACEHOLDER */}
          />
          <div className="flex gap-2">
            {/* File upload button */}
            <Button onClick={() => fileInputRef.current?.click()}>
              📎 Attach
            </Button>
            {/* Settings button */}
            <Button onClick={() => setShowSettings(!showSettings)}>
              ⚙️
            </Button>
          </div>
        </div>
        {/* Enhance button */}
        <Button onClick={handleEnhanceOnly}>✨ Enhance</Button>
        {/* Send button */}
        <Button onClick={handleSendMessage}>
          <Send />
        </Button>
      </div>
    </div>
  </>
) : null}
```

**Effect**: Completely different UI blocks rendered based on `viewMode`.

---

## 7. Workspace Routing in Message Sending (Line 544-560)

```tsx
// FILE: agent-sidebar-clean.tsx
// FUNCTION: handleSendMessage

const handleSendMessage = async () => {
  if (!chatInput.trim() || isLoading) return;

  // IF/ELSE #9: Ensure thread exists in dashboard mode
  let threadToUse = currentThreadSlug;
  if (isDashboardMode && !threadToUse) {
    const created = await handleNewThread();
    if (!created) return;
    threadToUse = created;
  }

  // IF/ELSE #10: Workspace routing for API call
  console.log('📤 Sending message:', {
    message: chatInput,
    threadSlug: threadToUse,
    attachments: attachments.length,
    workspaceSlug: isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug,
    //              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //              ROUTING DECISION: Which workspace to send to?
    isDashboardMode,
  });

  onSendMessage(chatInput, threadToUse, attachments);
  setChatInput("");
  setAttachments([]);
};
```

**Effect**:
- Dashboard mode → sends to `dashboardChatTarget` workspace
- Editor mode → sends to `editorWorkspaceSlug` workspace

---

## 8. Parent-Level Routing (page.tsx Lines 3103-3145)

```tsx
// FILE: page.tsx
// FUNCTION: handleSendMessage

const handleSendMessage = async (message, threadSlugParam, attachments) => {
  const isDashboardMode = viewMode === 'dashboard';
  //      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //      PARENT COMPONENT CHECKS THE SAME FLAG

  // ... validation ...

  // IF/ELSE #11: Workspace routing at parent level
  let endpoint: string;
  let workspaceSlug: string | undefined;

  if (isDashboardMode && useAnythingLLM) {
    // Dashboard mode routing
    if (dashboardChatTarget === 'sow-master-dashboard') {
      endpoint = '/api/anythingllm/stream-chat';
      workspaceSlug = 'sow-master-dashboard';
    } else {
      endpoint = '/api/anythingllm/stream-chat';
      workspaceSlug = dashboardChatTarget; // Client workspace
    }
  } else {
    // Editor mode routing — always AnythingLLM via the SOW's workspace
    endpoint = '/api/anythingllm/stream-chat';
    workspaceSlug = documents.find(d => d.id === currentDocId)?.workspaceSlug;
  }

  // IF/ELSE #12: Use actual SOW workspace in editor mode
  if (!isDashboardMode && useAnythingLLM && currentSOWId) {
    const currentSOW = documents.find(d => d.id === currentSOWId);
    if (currentSOW?.workspaceSlug) {
      workspaceSlug = currentSOW.workspaceSlug;
      console.log(`🎯 [SOW Chat] Using SOW workspace: ${workspaceSlug}`);
    }
  }

  // IF/ELSE #13: Log the routing decision
  console.log('🎯 [Chat Routing]', {
    isDashboardMode,
    useAnythingLLM,
    dashboardChatTarget,
    endpoint,
    workspaceSlug,
    routeType: isDashboardMode 
      ? (dashboardChatTarget === 'sow-master-dashboard' 
          ? 'MASTER_DASHBOARD' 
          : 'CLIENT_WORKSPACE')
      : 'SOW_GENERATION'
  });

  // ... make API call with workspaceSlug ...
};
```

**Effect**: 
- Dashboard mode + master → routes to 'sow-master-dashboard'
- Dashboard mode + client → routes to client workspace (e.g., 'hello')
- Editor mode → routes to current SOW's workspace

---

## 9. Thread Selection Routing (Lines 322-325)

```tsx
// FILE: agent-sidebar-clean.tsx
// FUNCTION: handleSelectThread

const handleSelectThread = async (threadSlug: string) => {
  console.log('📂 Switching to thread:', threadSlug);
  setCurrentThreadSlug(threadSlug);
  setShowThreadList(false);
  setLoadingThreads(true);
  
  try {
    // IF/ELSE #14: Which workspace to load thread history from?
    const ws = isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug;
    //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //          ROUTING DECISION
    
    if (!ws) throw new Error('No workspace available for loading threads');
    
    const response = await fetch(
      `/api/anythingllm/thread?workspace=${encodeURIComponent(ws)}&thread=${encodeURIComponent(threadSlug)}`
    );
    
    // ... load and display thread history ...
    
    // IF/ELSE #15: Sync with parent in editor mode only
    if (isEditorMode && onEditorThreadChange) {
      onEditorThreadChange(threadSlug);
    }
  } catch (error) {
    console.error('❌ Failed to load thread history:', error);
  } finally {
    setLoadingThreads(false);
  }
};
```

**Effect**:
- Dashboard mode → loads thread from `dashboardChatTarget` workspace
- Editor mode → loads thread from `editorWorkspaceSlug` AND syncs with parent

---

## 10. Thread Deletion Routing (Lines 367-375)

```tsx
// FILE: agent-sidebar-clean.tsx
// FUNCTION: handleDeleteThread

const handleDeleteThread = async (threadSlug: string) => {
  if (!confirm('Delete this chat? This cannot be undone.')) return;
  
  try {
    // IF/ELSE #16: Which workspace to delete thread from?
    const ws = isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug;
    //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //          ROUTING DECISION
    
    if (!ws) throw new Error('No workspace selected for thread deletion');

    const response = await fetch(
      `/api/anythingllm/thread?workspace=${encodeURIComponent(ws)}&thread=${encodeURIComponent(threadSlug)}`,
      { method: 'DELETE' }
    );
    
    // ... handle deletion ...
    
    // IF/ELSE #17: Notify parent in editor mode only
    if (isEditorMode && onEditorThreadChange) {
      const stillExists = threads.some(t => t.slug === threadSlug);
      if (!stillExists) onEditorThreadChange(null);
    }
  } catch (error) {
    console.error('❌ Failed to delete thread:', error);
  }
};
```

**Effect**:
- Dashboard mode → deletes from `dashboardChatTarget` workspace
- Editor mode → deletes from `editorWorkspaceSlug` AND notifies parent

---

## Summary: The If/Else Chain

Here's the complete chain of conditional logic that creates dual-context behavior:

1. **Mode Detection** → `isDashboardMode = viewMode === 'dashboard'`
2. **Persona Name** → `viewMode === 'dashboard' ? ... : ...`
3. **Thread Loading** → `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`
4. **System Prompt** → `{isEditorMode && <SystemPromptDisplay />}`
5. **Workspace Dropdown** → `{isDashboardMode && <WorkspaceSelector />}`
6. **Main UI** → `{isDashboardMode ? <DashboardUI /> : <EditorUI />}`
7. **Insert Button** → Only in Editor mode, hidden in Dashboard
8. **Message Sending** → `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`
9. **Thread Selection** → `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`
10. **Thread Deletion** → `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`
11. **Parent Routing** → `isDashboardMode ? ... : ...`
12. **SOW Workspace** → `!isDashboardMode && currentSOW?.workspaceSlug`
13. **Route Logging** → `isDashboardMode ? 'MASTER_DASHBOARD' : 'SOW_GENERATION'`
14. **Thread History** → `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`
15. **Parent Sync** → `{isEditorMode && onEditorThreadChange(slug)}`
16. **Delete Routing** → `isDashboardMode ? dashboardChatTarget : editorWorkspaceSlug`
17. **Delete Sync** → `{isEditorMode && onEditorThreadChange(null)}`

**Every single one of these if/else statements is driven by the same two props:**
- `viewMode` ('dashboard' or 'editor')
- The workspace source (`dashboardChatTarget` vs `editorWorkspaceSlug`)

**This is NOT confusion. This is deliberate, systematic, prop-driven polymorphism.**
