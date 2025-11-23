# Complete AnythingLLM Mirror Implementation Plan

## 🎯 Goal
Mirror EVERYTHING from AnythingLLM workspace into our dashboard chat:

## ✅ What We Already Have
1. Thread API functions (create, delete, rename, get chats) ✅
2. Basic UI structure (agent-sidebar-clean) ✅
3. Workspace selector ✅
4. Chat streaming ✅

## 🚀 What We Need to Add

### 1. Thread Management UI (Priority 1)
- [x] Thread list sidebar (like AnythingLLM left panel)
- [ ] "New Thread" button
- [ ] Thread switcher with thread names
- [ ] Thread rename (inline edit)
- [ ] Thread delete (with confirmation)
- [ ] Active thread highlighting
- [ ] Thread timestamps
- [ ] Load thread history when switching

### 2. Agent/Model Selector (Priority 2)
- [ ] @agent dropdown (like AnythingLLM)
- [ ] Model selector dropdown
- [ ] Agent switching preserves thread context
- [ ] Visual indicator of current agent/model

### 3. Slash Commands (Priority 3)
- [ ] /command autocomplete
- [ ] Custom command presets
- [ ] Command history
- [ ] Quick command buttons

### 4. Settings & Controls (Priority 4)
- [ ] Temperature slider
- [ ] History length control
- [ ] Chat mode (chat vs query)
- [ ] Token count display

### 5. File Attachments (Priority 5)
- [ ] File upload button
- [ ] Image preview
- [ ] PDF support
- [ ] Attachment display in chat

## 📋 Implementation Steps

### Step 1: Thread UI Integration
1. Add thread state management to agent-sidebar-clean
2. Load threads on mount from AnythingLLM API
3. Create thread list UI component
4. Wire up new thread button
5. Implement thread switching
6. Load chat history when switching threads

### Step 2: Update Parent Component (page.tsx)
1. Pass thread management functions as props
2. Handle thread state in parent
3. Update chat routing to use threads
4. Store current thread ID in state

### Step 3: API Integration
1. Use existing anythingllm.ts functions
2. Create thread management hooks
3. Handle loading states
4. Error handling & retries

### Step 4: UI Polish
1. Match AnythingLLM visual style
2. Smooth animations
3. Loading indicators
4. Empty states

## 🎨 UI Layout (Match AnythingLLM)

```
┌─────────────────────────────────────────┐
│ 🎯 Dashboard Chat          [Settings] X │
├─────────────────────────────────────────┤
│ [+ New Thread]  [History (5)]           │
├─────────────────────────────────────────┤
│ Thread List:                            │
│ ● How many SOWs? (active)              │
│ ○ Total revenue                         │
│ ○ Client breakdown                      │
├─────────────────────────────────────────┤
│ Chat Area:                              │
│  [Messages for active thread]           │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ [@agent ▾] [Model ▾] [/commands ▾]     │
│ ┌─────────────────────────────────────┐ │
│ │ Type your message...                │ │
│ └─────────────────────────────────────┘ │
│ [📎] [⚙️] [Send]                        │
└─────────────────────────────────────────┘
```

## 🔄 Data Flow

1. User clicks "New Thread"
   → Call `anythingLLM.createThread(workspaceSlug)`
   → Get thread slug back
   → Add to thread list
   → Set as active thread

2. User switches threads
   → Call `anythingLLM.getThreadChats(workspaceSlug, threadSlug)`
   → Load chat history
   → Display in chat area

3. User sends message
   → Call `/api/anythingllm/stream-chat` with thread slug
   → Stream response
   → Messages auto-save to thread

4. User renames thread
   → Call `anythingLLM.updateThread(workspaceSlug, threadSlug, newName)`
   → Update UI

5. User deletes thread
   → Confirm dialog
   → Call `anythingLLM.deleteThread(workspaceSlug, threadSlug)`
   → Remove from list
   → Switch to another thread or create new

## 🎯 Next Action
Start with Step 1: Thread UI Integration
- Add thread state management
- Load threads from API
- Create thread list component
- Wire up new thread button

Ready to implement?
