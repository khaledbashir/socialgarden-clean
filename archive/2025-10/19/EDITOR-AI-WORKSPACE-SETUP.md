# Creating Dedicated AnythingLLM Workspace for Editor "Ask AI"

## 🎯 What We're Setting Up

A **dedicated AnythingLLM workspace** specifically for the **"Ask AI" inline editor feature** - separate from the sidebar chat AI.

### Current Setup
- **Sidebar Chat AI**: Uses Gardner workspaces (e.g., `gen-the-architect`)
- **Editor "Ask AI"**: Uses workspace slug `pop` (needs to be created in AnythingLLM)

---

## 📋 Step-by-Step Setup

### Step 1: Create Workspace in AnythingLLM

1. **Open AnythingLLM**: https://ahmad-anything-llm.840tjq.easypanel.host

2. **Create New Workspace**:
   - Click **"+ New Workspace"** button
   - Name: `Editor AI Assistant`
   - Slug: `pop` (must match the env variable)
   - Description: `Dedicated workspace for inline editor AI assistance (Ask AI popup)`

3. **Configure AI Model**:
   - Settings → Chat Model
   - Choose: **Claude 3.5 Sonnet** (recommended for editing)
   - OR: **GPT-4** (good for code and formatting)
   - OR: **DeepSeek V3** (fast and reasoning)

4. **Configure Behavior**:
   - **System Prompt** (optional):
     ```
     You are an expert writing and editing assistant integrated into a document editor.
     Your role is to help users improve, expand, shorten, fix, or continue their text.
     
     When given a command like "improve", "fix", "make shorter", etc., apply that 
     transformation to the provided text.
     
     Always maintain the original tone and intent while following the user's instruction.
     Keep responses concise and focused on the editing task.
     Use Markdown formatting when appropriate.
     ```

5. **Add Knowledge Base** (optional):
   - Upload SOW templates
   - Add style guides
   - Include company-specific terminology

6. **Save Workspace**

---

### Step 2: Verify Environment Variables

Already configured in `/frontend/app/api/generate/route.ts`:

```typescript
const anythingllmUrl = process.env.ANYTHINGLLM_URL || "https://ahmad-anything-llm.840tjq.easypanel.host";
const workspaceSlug = process.env.ANYTHINGLLM_WORKSPACE_SLUG || "pop";
const apiKey = process.env.ANYTHINGLLM_API_KEY;
```

**Check your `.env` file has**:
```bash
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
ANYTHINGLLM_WORKSPACE_SLUG=pop
```

---

### Step 3: Test the Integration

1. **Start dev server**:
   ```bash
   cd /root/the11/frontend
   npm run dev
   ```

2. **Open editor**: Navigate to any SOW document

3. **Select text**: Highlight some text in the editor

4. **Click "Ask AI" button** (or use slash command `/`)

5. **Try commands**:
   - `make this more professional`
   - `fix grammar`
   - `expand on this point`
   - `make this shorter`

6. **Verify response streams in** from the `pop` workspace

---

## 🔧 How It Works

### Editor "Ask AI" Flow

```
User selects text in editor
  ↓
Clicks "Ask AI" or uses slash command
  ↓
Popup opens with command input
  ↓
User types command (e.g., "improve this")
  ↓
Frontend sends to /api/generate
  ↓
Backend routes to AnythingLLM workspace "pop"
  ↓
AI processes text + command
  ↓
Response streams back to editor
  ↓
User can accept/reject/edit
```

### Workspace Separation

**Purpose**: Different workspaces for different AI roles

1. **Sidebar Chat** (`gen-the-architect`, etc.)
   - Full SOW generation
   - Complex multi-turn conversations
   - Strategic planning
   - Document creation

2. **Editor "Ask AI"** (`pop`)
   - Quick text transformations
   - Grammar/spelling fixes
   - Expand/shorten text
   - Inline editing assistance
   - Single-turn commands

3. **Dashboard AI** (`sow-master-dashboard`)
   - Analytics queries
   - Reporting
   - Data aggregation

---

## 📝 Commands Available in Editor "Ask AI"

### Built-in Options (buttons):
- **Continue** - Continue writing from current point
- **Improve** - Make text better/more professional
- **Shorter** - Condense text
- **Longer** - Expand text with more details
- **Fix** - Fix grammar and spelling

### Custom Commands (type in input):
- `make this more formal`
- `add bullet points`
- `convert to a table`
- `simplify for non-technical audience`
- `add examples`
- `rewrite as a question`
- `translate to [language]`
- Anything else!

---

## 🎨 Customizing the Editor AI

### Option 1: Change System Prompt in AnythingLLM

Best for changing AI behavior globally:

1. Open workspace `pop` in AnythingLLM
2. Settings → System Prompt
3. Add instructions like:
   ```
   - Always use active voice
   - Keep sentences under 20 words
   - Use technical terminology when appropriate
   - Format code blocks with proper syntax highlighting
   ```

### Option 2: Modify API Route

For programmatic changes, edit `/frontend/app/api/generate/route.ts`:

```typescript
// Add context to all commands
const enhancedPrompt = `
CONTEXT: You are editing a Statement of Work document.
COMPANY: Social Garden
STYLE: Professional, clear, concise

USER COMMAND: ${fullPrompt}
`;
```

### Option 3: Add Pre-Processing

Detect content type and adjust:

```typescript
// In /frontend/components/tailwind/generative/ai-selector.tsx
const detectContentType = (text: string) => {
  if (text.includes('$') || text.includes('cost')) return 'pricing';
  if (text.includes('deliverable') || text.includes('milestone')) return 'scope';
  if (text.includes('week') || text.includes('month')) return 'timeline';
  return 'general';
};

const enhancedCommand = `[${contentType}] ${command}`;
```

---

## 🚀 Advanced Features

### 1. Context-Aware Editing

The editor AI can use surrounding text for context:

```typescript
// Get paragraph context
const { from, to } = editor.state.selection;
const $from = editor.state.doc.resolve(from);
const paragraph = $from.node($from.depth);
const contextBefore = paragraph.textContent.slice(0, from - $from.start());
const contextAfter = paragraph.textContent.slice(to - $from.start());

// Send to AI with context
const fullPrompt = `
Before: ${contextBefore}
[SELECTED: ${selectedText}]
After: ${contextAfter}

Command: ${userCommand}
`;
```

### 2. Multi-Step Editing

Chain multiple transformations:

```typescript
// 1. Fix grammar
// 2. Make more professional
// 3. Add bullet points
```

### 3. Template-Based Editing

Pre-defined transformations for SOWs:

```typescript
const sowTemplates = {
  'convert to scope item': 'Transform this into a proper scope item with deliverables and acceptance criteria',
  'add pricing row': 'Convert this into a pricing table row with role, hours, rate, and cost',
  'create milestone': 'Format this as a project milestone with date, deliverable, and dependencies'
};
```

---

## 🐛 Troubleshooting

### "Ask AI" button not working

**Check**:
1. Workspace `pop` exists in AnythingLLM
2. Environment variables are set correctly
3. AnythingLLM API key is valid
4. Console logs for errors

**Debug**:
```bash
# In browser console
localStorage.clear(); // Clear any cached settings
# Refresh page
```

### Slow responses

**Solutions**:
1. Switch to faster model (e.g., GPT-3.5, DeepSeek)
2. Reduce temperature setting
3. Add max token limit

### Wrong workspace being used

**Verify**:
```bash
# Check environment variable
echo $ANYTHINGLLM_WORKSPACE_SLUG

# Should output: pop
```

### Responses not streaming

**Check** in `/frontend/app/api/generate/route.ts`:
- Using `/stream-chat` endpoint (not `/chat`)
- Proper SSE handling
- Response headers include `text/event-stream`

---

## 📊 Monitoring & Analytics

### Track Editor AI Usage

Add logging to see how users interact:

```typescript
// In ai-selector.tsx
const trackEditorAIUsage = async (command: string, option: string) => {
  await fetch('/api/analytics/editor-ai', {
    method: 'POST',
    body: JSON.stringify({
      command,
      option,
      selectedTextLength: selectedText.length,
      timestamp: Date.now()
    })
  });
};
```

### Common Commands Dashboard

See which editing commands are most popular:
- Grammar fixes
- Expansions
- Shortenings
- Custom commands

---

## ✅ Next Steps

1. ✅ **Create workspace** `pop` in AnythingLLM
2. ✅ **Configure Claude 3.5** or preferred model
3. ✅ **Add system prompt** for editing behavior
4. ✅ **Test commands** in editor
5. ✅ **Monitor usage** and refine prompts
6. ✅ **Add custom templates** for common SOW edits

---

## 📚 Related Documentation

- **Sidebar Chat AI**: Uses Gardner workspaces (`gen-the-architect`, etc.)
- **Dashboard AI**: Uses `sow-master-dashboard` workspace
- **Workspace Config**: `/frontend/lib/workspace-config.ts`
- **API Route**: `/frontend/app/api/generate/route.ts`
- **Editor Component**: `/frontend/components/tailwind/generative/ai-selector.tsx`

---

## Summary

✅ **Dedicated workspace for editor AI** - Separate from sidebar chat  
✅ **Workspace slug**: `pop` (already configured in code)  
✅ **Just needs creation** in AnythingLLM dashboard  
✅ **Streaming support** - Real-time responses  
✅ **Customizable** - System prompts, templates, models  

**CREATE THE `pop` WORKSPACE IN ANYTHINGLLM AND YOU'RE DONE!** 🎉
