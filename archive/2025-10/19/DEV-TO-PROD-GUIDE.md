# 🏗️ DEV-TO-PROD GUIDE: Best Practices for Consistent Builds

**GOAL:** What works in `dev` should work identically in `prod`.

---

## 🎯 CORE PRINCIPLE: SSR (Server-Side Rendering) Hydration

### The Problem
```
A tree hydrated but some attributes of the server rendered HTML 
didn't match the client properties.
```

**Why it happens:**
- Server renders static HTML
- Client renders dynamic React
- **Mismatch** = hydration error

### The Solution: Rules for Next.js

---

## ✅ 5 BEST PRACTICES

### 1️⃣ **NO `if (typeof window !== 'undefined')`**

❌ **WRONG:**
```typescript
const MyComponent = () => {
  const [value, setValue] = useState('');
  
  // DON'T DO THIS!
  if (typeof window !== 'undefined') {
    console.log('Client side');
  }
  
  return <div>{value}</div>;
};
```

✅ **CORRECT:**
```typescript
import { useEffect } from 'react';

const MyComponent = () => {
  const [value, setValue] = useState('');
  
  // Use useEffect instead
  useEffect(() => {
    console.log('Client side only');
  }, []);
  
  return <div>{value}</div>;
};
```

**Rule:** Put client-only code in `useEffect`, not in render function.

---

### 2️⃣ **NO `Date.now()` or `Math.random()` in Render**

❌ **WRONG:**
```typescript
const MyComponent = () => {
  // This changes every render!
  const id = Math.random();
  const time = Date.now();
  
  return <div key={id}>{time}</div>;
};
```

✅ **CORRECT:**
```typescript
const MyComponent = () => {
  const [id, setId] = useState('');
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    setId(Math.random().toString());
    setTime(Date.now());
  }, []);
  
  return <div key={id}>{time}</div>;
};
```

**Rule:** Use `useState` + `useEffect` for dynamic values.

---

### 3️⃣ **NO Console.logs in Production Build**

❌ **WRONG (what you have now):**
```typescript
// page.tsx - 20+ console.logs
console.log('🔍 useEffect running, mounted:', mounted);
console.log('📂 Starting to load folders from database...');
console.log('✅ Loaded folders from database:', dbFolders.length);
```

✅ **CORRECT:**
```typescript
// Option A: Environment-based logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Debug info only in dev');
}

// Option B: Use a logger utility
import { debug } from '@/lib/logger';
debug('This only shows in dev');

// Option C: Remove all console.logs from production code
// (Just delete them!)
```

**Rule:** Strip console.logs in production build.

---

### 4️⃣ **NO Uncontrolled → Controlled Component Switch**

❌ **WRONG:**
```typescript
const [value, setValue] = useState(undefined);

return (
  <select value={value} onChange={e => setValue(e.target.value)}>
    {/* This switches from uncontrolled to controlled */}
  </select>
);
```

✅ **CORRECT:**
```typescript
const [value, setValue] = useState(''); // Initialize with default

return (
  <select value={value} onChange={e => setValue(e.target.value)}>
    <option value="">Select...</option>
  </select>
);
```

**Rule:** Always initialize state, never switch between controlled/uncontrolled.

---

### 5️⃣ **NO Browser Extensions Affecting HTML**

⚠️ **This is the hardest to control.**

Browser extensions can inject HTML/CSS. Disable extensions for testing:

```bash
# Test in incognito mode (extensions disabled)
# Or use a different browser profile
```

---

## 🔧 HOW TO BUILD FOR PRODUCTION

### Step 1: Remove All Console.logs
```bash
# Find all console.logs
grep -rn "console\." frontend/app/ frontend/components/ frontend/lib/ \
  | grep -v node_modules | grep -v ".next"

# Bulk remove (be careful!)
# For each file, manually remove or use sed
sed -i '/console\./d' frontend/app/page.tsx
```

### Step 2: Use Environment Variables
```typescript
// lib/logger.ts
export const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Usage:
import { debug } from '@/lib/logger';
debug('Only shows in dev'); // ✅ Removed in prod build
```

### Step 3: Build Locally (Catch Errors Early)
```bash
cd /root/the11/frontend

# Build for production
pnpm build

# Start production build locally
pnpm start

# Test at http://localhost:3000
```

### Step 4: Check for Hydration Errors
```bash
# During pnpm build, look for:
- ✓ Type checking
- ✓ Linting  
- ✓ Compiling ✅ (No hydration warnings)
```

### Step 5: Compare Dev vs Prod
```bash
# Run in dev mode
pnpm dev

# Take screenshot / test feature X

# Stop dev (Ctrl+C)

# Build prod
pnpm build

# Run prod mode
pnpm start

# Compare side-by-side
# Both should look & work identically
```

---

## 📋 DEV-TO-PROD CHECKLIST

Before building for production:

- [ ] **Remove ALL console.logs** → Use `debug()` utility instead
- [ ] **Fix hydration mismatches** → Use `useEffect` for dynamic values
- [ ] **Initialize all state** → No undefined defaults for controlled components
- [ ] **No `if (typeof window !== 'undefined')`** → Use `useEffect` instead
- [ ] **Test in incognito/private mode** → Disables browser extensions
- [ ] **Build locally** → `pnpm build`
- [ ] **Test locally** → `pnpm start`
- [ ] **Compare dev vs prod** → Features work the same
- [ ] **Check performance** → No console spam = faster

---

## 🚀 PRODUCTION BUILD STEPS

### Step 1: Build
```bash
cd /root/the11/frontend
pnpm build
```

### Step 2: Test Locally
```bash
pnpm start
# Test at http://localhost:3000
```

### Step 3: Deploy with Docker
```bash
cd /root/the11
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Verify
```bash
# Check running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs frontend
```

---

## 🧪 TEST BOTH MODES

### Dev Mode (Current)
```bash
cd /root/the11
./dev.sh

# ✅ Hot reload works
# ✅ Console.logs visible (for debugging)
# ✅ Slow but useful
```

### Prod Mode (What customers see)
```bash
cd /root/the11/frontend
pnpm build
pnpm start

# ✅ No console.logs
# ✅ Optimized & fast
# ✅ No hot reload
```

**Both should work identically!**

---

## 🎯 YOUR ACTION ITEMS

### Immediate (Fix Current Issues)
1. Remove all console.logs (20 in page.tsx, 9 in agent-sidebar-clean.tsx, 20 in anythingllm.ts)
2. Fix hydration mismatch (suppressHydrationWarning or fix root cause)
3. Create `/frontend/lib/logger.ts` for safe logging
4. Fix uncontrolled component warnings

### Before Production
1. Build locally: `pnpm build`
2. Test locally: `pnpm start`
3. Compare with dev: `./dev.sh`
4. Deploy with Docker

---

## 📚 KEY LINKS

- [Next.js Hydration Mismatch](https://react.dev/link/hydration-mismatch)
- [React useEffect Hook](https://react.dev/reference/react/useEffect)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Next.js Production Build](https://nextjs.org/docs/advanced-features/production-build)

---

**Remember:** Dev and Prod should be identical. If they're not, you have a hydration or environment issue. Find it early, fix it early.
