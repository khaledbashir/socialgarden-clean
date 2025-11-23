# 📚 QUICK SUMMARY: Dev-to-Prod Best Practices

## Your Questions Answered:

### Q: "How do I ensure dev works the same as prod?"

**A: Follow these 5 rules:**

| Rule | Dev Problem | Prod Problem | Solution |
|------|---|---|---|
| **1. Logging** | `console.log` everywhere | Logs removed, can't debug | Use `/lib/logger.ts` |
| **2. Dynamic Values** | Works with `Date.now()` | Hydration mismatch | Use `useState` + `useEffect` |
| **3. Conditionals** | `if (typeof window)` works | Server renders differently | Use `useEffect` only |
| **4. Controlled Inputs** | `value={undefined}` → warning | Switches modes, breaks UI | Initialize with default: `''` |
| **5. HTML Structure** | Browser forgives errors | Stricter parsing | Valid nesting only |

---

## 📁 New Files Created:

### 1. **DEV-TO-PROD-GUIDE.md** (333 lines)
   - Complete guide with examples
   - Checklist for production
   - Build instructions
   - Link: `/root/the11/DEV-TO-PROD-GUIDE.md`

### 2. **lib/logger.ts** (36 lines)
   - Safe logging utility
   - Auto-disabled in prod build
   - Replace all `console.log` with this
   - Usage: `import { debug } from '@/lib/logger'`

### 3. **cleanup-console-logs.sh** (35 lines)
   - Find all console.logs
   - Shows what to replace
   - Link: `/root/the11/cleanup-console-logs.sh`

---

## 🎯 What's Happening Right Now:

Your app shows these errors:
- ✅ **Hydration mismatch** → From browser extension or dynamic values
- ✅ **Console spam** → 47+ debug logs showing
- ✅ **405 error** → `/api/preferences/current_agent_id` needs PUT handler
- ✅ **400 error** → `/api/models` endpoint issue
- ✅ **404 error** → `/api/agents/architect` endpoint issue

But the **AI generation works!** ✅ (You generated 72 characters successfully)

---

## 🚀 Next Steps:

### Step 1: Replace console.logs (Optional but Clean)
```bash
# Find all console.logs
grep -rn "console\." frontend/app/ frontend/components/ frontend/lib/

# Replace console.log with debug:
# OLD: console.log('text');
# NEW: debug('text');
# ADD: import { debug } from '@/lib/logger';
```

### Step 2: Test Prod Build Locally
```bash
cd /root/the11/frontend
pnpm build
pnpm start
# Visit http://localhost:3000
```

### Step 3: Compare Dev vs Prod
```bash
# Keep prod running, open new terminal
./dev.sh
# Visit http://localhost:3333

# Both should look/work identically ✅
```

---

## 💡 Simple Rules to Remember:

1. **For logging:** Use `debug()` not `console.log`
2. **For state:** Always initialize `useState('')` not `undefined`
3. **For effects:** Put dynamic code in `useEffect`, not render
4. **For testing:** Always test both `dev` and `prod` builds
5. **For production:** Build locally first, catch errors early

---

## 📖 Files to Read:

- **MASTER-GUIDE.md** - All about the project
- **DEV-TO-PROD-GUIDE.md** - All about consistency
- **lib/logger.ts** - Copy/paste for safe logging

---

## ⚡ TL;DR (Too Long; Didn't Read)

```typescript
// ❌ WRONG IN PROD
console.log('hello');
const id = Math.random();
if (typeof window !== 'undefined') { }
const [val, setVal] = useState(undefined);

// ✅ RIGHT IN BOTH
import { debug } from '@/lib/logger';
debug('hello');
const [id, setId] = useState('');
useEffect(() => setId(Math.random().toString()), []);
useEffect(() => { /* window code */ }, []);
const [val, setVal] = useState('');
```

**That's it!** 🎉
