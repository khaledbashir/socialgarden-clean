# ⚡ QUICK ACTION: Create Editor AI Workspace

## What You Need to Do RIGHT NOW

### 🎯 Create the `pop` Workspace in AnythingLLM

**Your editor "Ask AI" feature is coded and ready - it just needs this workspace to exist!**

---

## 5-Minute Setup

### Step 1: Open AnythingLLM
```
URL: https://ahmad-anything-llm.840tjq.easypanel.host
Login with your credentials
```

### Step 2: Create New Workspace
Click **"+ New Workspace"** button

Fill in:
```
Name: Editor AI Assistant
Slug: pop          ⭐ MUST BE EXACTLY "pop"
Description: Inline editor AI for text editing and transformations
```

### Step 3: Configure Model
```
Settings → Chat Model
Choose: Claude 3.5 Sonnet (recommended)
OR: GPT-4
OR: DeepSeek V3
```

### Step 4: Add System Prompt (Optional but Recommended)
```
You are an expert writing and editing assistant integrated into a document editor.
Your role is to help users improve, expand, shorten, fix, or continue their text.

When given editing commands, apply them precisely while maintaining the original 
tone and intent. Keep responses concise and focused on the editing task.

Use Markdown formatting when appropriate.
```

### Step 5: Save
Click **Save** button

---

## ✅ That's It!

Now your editor AI will:
- ✨ Respond to "Ask AI" commands
- 🚀 Stream responses in real-time
- ✏️ Help with text transformations
- 🎯 Work separately from sidebar chat

---

## Test It

1. Open your app at `localhost:3000`
2. Create or open a document
3. Select some text
4. Click "Ask AI" button (or use `/` command)
5. Type: `make this more professional`
6. Watch AI transform your text!

---

## Why This Matters

**Sidebar Chat AI** (Gardner workspaces):
- Full SOW generation
- Multi-turn conversations
- Complex document creation

**Editor "Ask AI"** (`pop` workspace):
- Quick text fixes
- Grammar corrections
- Expand/shorten text
- Inline editing

**Two different AIs for two different jobs!** 🎯

---

## Troubleshooting

**If "Ask AI" doesn't work:**
1. Check workspace slug is EXACTLY `pop` (lowercase, no spaces)
2. Verify workspace has an AI model configured
3. Check console for errors
4. Restart dev server if needed

**Still not working?**
Check environment variable:
```bash
echo $ANYTHINGLLM_WORKSPACE_SLUG
# Should output: pop
```

---

## 🚀 Ready to Go!

Everything is coded and configured. Just create the workspace and you're done!

**CREATE `pop` WORKSPACE → EDITOR AI WORKS** ✨
