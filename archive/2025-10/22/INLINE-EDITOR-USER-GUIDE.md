# 📋 INLINE EDITOR - User Guide

## Two Modes Explained

### Mode 1️⃣ - Selection Mode (Recommended for editing)

**When to use:** You want to improve or transform existing text

**Steps:**
```
1. Highlight text you want to edit
   └─> Toolbar appears above the selection
   
2. Click "Ask AI" button
   └─> Full floating bar opens below
   └─> Quick action buttons appear:
       • Improve Writing
       • Shorten
       • Elaborate
       • More formal / More casual
       • Bulletize
       • Summarize
       • Rewrite
       
3. Either:
   
   Option A - Quick Action:
   ├─> Click any quick action button
   └─> AI transforms your text instantly
   
   Option B - Custom Command:
   ├─> Type your custom prompt (e.g., "add emojis")
   ├─> Press Enter or click the Sparkles button
   └─> AI transforms your text
       
4. Preview the result in the floating bar

5. Choose an action:
   ├─> Replace: Replaces selected text with result
   └─> Insert: Inserts result on next line
```

**Result:** Your selected text is transformed ✨

---

### Mode 2️⃣ - Slash Command Mode (For generating new content)

**When to use:** You want AI to generate new content from scratch

**Steps:**
```
1. Click where you want new content
   └─> Position cursor in your document
   
2. Type: /ai
   └─> Command is replaced with floating bar
   └─> Full bar opens below cursor
   └─> NO quick actions (free-form mode)
   
3. Type what you want:
   Examples:
   • "write a professional email about..."
   • "create a pros and cons list"
   • "write a haiku about coding"
   • "generate 5 marketing taglines"
   
4. Press Enter or click Sparkles button
   └─> AI generates content
   
5. Preview appears in floating bar

6. Choose an action:
   ├─> Insert: Inserts below cursor
   └─> Replace: Replaces at cursor position
```

**Result:** New AI-generated content appears in your document 🎯

---

## Quick Visual Guide

### Selection Mode - Toolbar Appearance
```
┌─ Highlighted Text ─┐
│  Select me please  │ ← When you highlight text
└────────────────────┘
  ↓
  ┌─────────────┐
  │ 🌟 Ask AI   │ ← Toolbar appears
  └─────────────┘
```

### Selection Mode - After Clicking "Ask AI"
```
┌─────────────────────────────────────┐
│ ✨ AI WRITING ASSISTANT     [X]     │
├─────────────────────────────────────┤
│ Quick Actions ▼                     │
│ [Improve] [Shorten] [Elaborate]...  │
│                                     │
│ Model: Gemini 2.0 Flash ▼          │
│                                     │
│ [What would you like to do?]        │ ← Type here
│                                [✨]  │
└─────────────────────────────────────┘
       ↑ Floating bar opens below
```

### Slash Command Mode
```
Click in editor → Type /ai → Bar opens
                              
┌─────────────────────────────────────┐
│ ✨ Help me write            [X]     │
├─────────────────────────────────────┤
│ Model: Gemini 2.0 Flash ▼          │
│                                     │
│ [What would you like to do?]        │ ← Type command here
│ (e.g., "write a summary")           │
│                                [✨]  │
└─────────────────────────────────────┘
       ↑ NO quick actions (free form)
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Generate | `Enter` |
| Close bar | `Esc` |
| Switch models | Click dropdown |

---

## Pro Tips

### 💡 Selection Mode Tips
- **One-click transformations:** Use quick action buttons for instant results
- **Refine results:** Click "Refine" to try again with a different prompt
- **Replace vs Insert:**
  - `Replace` = Replaces your selected text
  - `Insert` = Adds result below (keeps original)

### 💡 Slash Command Mode Tips
- **Be specific:** "write a professional bio" works better than "write something"
- **Describe context:** "write an email to a client apologizing for delays" is better
- **Use examples:** "write bullet points like this: • Point 1 • Point 2"
- **After generating:** Use Replace to put it where you want

### 💡 General Tips
- **Try different models:** Different AI models have different strengths
  - Gemini 2.0: Fast and creative
  - Claude: Great for detailed writing
  - Llama: Good for coding
- **Combine modes:** Generate with slash command, then refine with selection mode
- **Multiple iterations:** Click "Refine" to try the same prompt again with variations

---

## What If Something Goes Wrong?

### Toolbar doesn't appear when I select text
- Make sure you've selected actual text (not just clicked)
- Try selecting more text
- Refresh the page if it persists

### /ai command doesn't work
- Make sure you type it as `/ai` (with the slash)
- Make sure you're in the editor, not in a different field
- Try pressing Escape and trying again

### AI doesn't generate anything
- Check your API credit/quota
- Try a different model from the dropdown
- Type a clearer, more specific prompt
- Check your internet connection

### Results look weird or cut off
- Click "Refine" to try again
- Type a more specific instruction
- Check if the model has API limits

---

## Summary

```
❓ Do you want to change existing text?
   YES ─→ Select text ─→ Click "Ask AI" ─→ Pick action
   NO  ─→ Type /ai ─→ Describe what you want

That's it! 🎉
```

Enjoy using the improved inline editor!
