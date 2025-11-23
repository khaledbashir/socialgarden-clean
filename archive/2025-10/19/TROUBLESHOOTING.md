# 🐛 Known Issues & Quick Fixes

## 1. Missing `postcss-import` Dependency ⚠️

**Issue:** The `postcss.config.js` file references `postcss-import` but it's not in `package.json`

**Location:** `novel-editor-demo/apps/web/postcss.config.js` line 3

**Fix:** Add to package.json devDependencies:
```bash
cd /root/the11/novel-editor-demo/apps/web
pnpm add -D postcss-import
```

**Impact:** May cause build errors if PostCSS tries to process imports

**Status:** Not critical (autoprefixer is already installed), but should be fixed

---

## 2. Duplicate TipTap Extension Warning ⚠️

**Issue:** Console shows: `[tiptap warn]: Duplicate extension names found: ['underline']`

**Cause:** StarterKit includes underline by default, and we also add it explicitly

**Fix Option 1 - Remove from StarterKit:**
```typescript
// In components/tailwind/extensions.ts
StarterKit.configure({
  bulletList: { keepMarks: true, keepAttributes: false },
  orderedList: { keepMarks: true, keepAttributes: false },
  strike: false,  // ← Add this
})
```

**Fix Option 2 - Remove explicit import:**
```typescript
// Remove this line:
import Underline from '@tiptap/extension-underline'
// And remove from extensions array
```

**Impact:** Just a warning, functionality works fine

**Status:** Low priority

---

## 3. Vercel Analytics 404 Errors ⚠️

**Issue:** Console shows: `Failed to load resource: /_vercel/insights/script.js (404)`

**Cause:** `@vercel/analytics` is imported in `app/providers.tsx` but not configured

**Fix Option 1 - Remove completely:**
```bash
cd /root/the11/novel-editor-demo/apps/web
pnpm remove @vercel/analytics
```
Then remove from `app/providers.tsx`:
```typescript
// Remove this import:
import { Analytics } from '@vercel/analytics/react'
// Remove from JSX:
<Analytics />
```

**Fix Option 2 - Configure properly** (if you want analytics):
- Add Vercel project ID to environment variables
- Configure analytics in Vercel dashboard

**Impact:** Just noise in console, no functional impact

**Status:** Low priority

---

## 4. OpenRouter API 401 Errors 🔴

**Issue:** `/api/chat` endpoint returns 500 (OpenRouter API returns 401)

**Cause:** Invalid or expired API key

**Current Key:** `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`

**Fix:**
1. Get new API key from https://openrouter.ai/
2. Update in `docker-compose.yml`:
```yaml
environment:
  - OPENROUTER_API_KEY=your-new-key-here
```
3. Rebuild containers:
```bash
cd /root/the11
docker compose down
docker compose up -d --build
```

**Impact:** HIGH - AI chat generation doesn't work

**Note:** User primarily uses AnythingLLM for AI features, so this may not be critical

**Status:** Fix if user needs OpenRouter AI generation

---

## 5. Nginx Container Failed (Port 80 Conflict) ℹ️

**Issue:** Nginx container fails to start (port 80 already in use)

**Cause:** Another service (probably system Nginx or Apache) is using port 80

**Fix:** Not needed! Frontend works fine on port 3333 without Nginx

**Impact:** None - ignored and working as intended

**Status:** Expected behavior

---

## Quick Fix Priority

1. **CRITICAL:** Fix OpenRouter API key (if needed)
2. **HIGH:** Add postcss-import to package.json
3. **MEDIUM:** Remove Vercel Analytics or configure it
4. **LOW:** Fix duplicate underline extension warning
5. **IGNORE:** Nginx port conflict

---

## Quick Command Reference

**Check Docker containers:**
```bash
docker ps -a --filter "name=the11" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**View frontend logs:**
```bash
docker logs the11_frontend_1 --tail 100
```

**Rebuild frontend:**
```bash
cd /root/the11
docker compose up -d --build frontend
```

**Test portal:**
```bash
curl -I http://168.231.115.219:3333/portal/sow/test-id
```

---

**Last Updated:** October 15, 2025  
**Session:** Ahmad + Sam (Social Garden)
