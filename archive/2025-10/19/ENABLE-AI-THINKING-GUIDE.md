# How to Enable AI Thinking Display

## Quick Fix: Configure Reasoning Model in AnythingLLM

Your streaming is working perfectly! But to see the thinking accordion, you need a reasoning model that outputs `<think>` tags.

### Step 1: Open AnythingLLM Dashboard

1. Go to: https://ahmad-anything-llm.840tjq.easypanel.host
2. Log in with your credentials
3. Select workspace: "GEN - The Architect" (or whichever workspace you're using)

### Step 2: Change to DeepSeek Model

1. Click **Settings** (gear icon)
2. Go to **Chat Settings** or **AI Provider**
3. Change **Chat Model** to one of these:
   - **DeepSeek V3** (best for reasoning)
   - **DeepSeek R1** (reasoning-optimized)
   - **DeepSeek Chat** (general purpose)
4. Enable **"Show Reasoning"** or **"Include Thinking"** option (if available)
5. Click **Save**

### Step 3: Test in Your App

1. Open your app at localhost:3000
2. Select "The Architect" agent
3. Ask a complex question like:
   ```
   Analyze the tradeoffs between microservices and monoliths 
   for a high-traffic e-commerce platform
   ```
4. You should now see:
   - 🧠 **Thinking accordion** expands automatically
   - ⌨️ **Reasoning streams** character-by-character
   - ✅ **Final answer** appears below

---

## Alternative: Test with Sample Thinking Tags

If you want to test without changing AnythingLLM, you can modify the system prompt to force thinking output:

### Option A: Update System Prompt in Agent Config

Edit `/root/the11/frontend/app/page.tsx` and add this to your agent's system prompt:

```typescript
const THE_ARCHITECT_SYSTEM_PROMPT = `
You are The Architect, an expert SOW creator.

IMPORTANT: Always structure your response like this:
1. First, wrap your thinking/reasoning in <think>...</think> tags
2. Then provide your final answer outside the tags

Example:
<think>
I need to consider:
- Project scope and requirements
- Timeline and milestones
- Budget constraints
- Risk factors
</think>

Based on the analysis above, here is the SOW...
`;
```

### Option B: Ask Questions That Trigger Reasoning

Even without DeepSeek, you can explicitly ask for reasoning:

```
Please show your thinking process before answering:
What are the pros and cons of serverless architecture?
```

---

## How It Works

### With DeepSeek/Reasoning Models:
```
User: "Analyze microservices vs monoliths"

AI Response:
<think>
I need to consider:
- Scalability patterns
- Development complexity
- Operational overhead
- Cost implications
</think>

Based on this analysis, here's a comprehensive comparison...
```

### Your App Will:
1. ✅ Receive the full response with `<think>` tags
2. ✅ Extract thinking section automatically
3. ✅ Display thinking in collapsible accordion
4. ✅ Show clean answer below
5. ✅ Stream both in real-time

---

## Troubleshooting

### "I changed to DeepSeek but still no thinking"

**Check AnythingLLM settings:**
- Verify workspace actually switched models (sometimes needs page refresh)
- Check if "reasoning" or "thinking" mode is enabled
- Try sending a test message in AnythingLLM dashboard directly

### "Thinking shows but doesn't stream"

**Check console logs:**
```bash
cd /root/the11/frontend
npm run dev
# Open browser console (F12)
# Send a message and look for:
# "📤 [AnythingLLM Stream] Forwarding: ..."
```

### "Accordion never appears"

**Verify response format:**
Open browser console and check the AI response:
```javascript
// Should see <think> tags in the content
console.log(chatMessages[chatMessages.length - 1].content);
```

---

## Current Status

✅ **Streaming works** - Messages appear in real-time  
✅ **Fast response** - No delays, instant updates  
✅ **Accordion ready** - Component waiting for `<think>` tags  
⏳ **Waiting for reasoning model** - Configure DeepSeek in AnythingLLM

Once you switch to DeepSeek, you'll get the thinking accordion back! 🎉
