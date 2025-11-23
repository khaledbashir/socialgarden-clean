# JSON Extraction Diagnostic Enhancement

**Date:** October 28, 2025  
**Issue:** "Insert to Editor" failing with "❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON or scopeItems"

## Problem Analysis

### Symptoms
User console logs show:
```
✅ [Accordion] JSON block extracted: Object
```
But then clicking "Insert to Editor" results in:
```
❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON or scopeItems
```

### Root Cause Investigation

The flow is:
1. **AnythingLLM AI generates response** with `<think>` tags and ```json block
2. **StreamingThoughtAccordion** successfully extracts the JSON
3. **buildInsertPayload** creates cleaned content that PRESERVES the JSON block
4. **handleInsertContent** receives this content and should extract pricing data
5. **ERROR OCCURS** - extraction fails silently

### Probable Causes

1. **Malformed JSON structure**: AI may be generating JSON that doesn't match expected format:
   - Expected: `{ "suggestedRoles": [{ "role": "...", "hours": ... }] }`
   - Or: `{ "roles": [{ "role": "...", "hours": ... }] }`
   - Or: `{ "scopeItems": [{ "roles": [{ "role": "...", "hours": ... }] }] }`
   
2. **Empty or invalid roles arrays**: JSON exists but roles array is empty or contains invalid entries that get filtered out

3. **Missing `hours` field**: Roles exist but don't have `hours` property, causing them to be filtered by `buildSuggestedRolesFromArchitectSOW`

## Enhanced Diagnostics Added

### File: `frontend/app/page.tsx`

#### 1. JSON Block Detection Logging (Line ~3140)
```typescript
console.log(`🔍 [JSON Extraction] Found ${jsonBlocks.length} JSON blocks in content`);
```

#### 2. Detailed JSON Structure Logging (Line ~3154)
```typescript
console.log('📦 [JSON Block] Parsed object:', { 
  hasRoles: Array.isArray(obj?.roles),
  hasSuggestedRoles: Array.isArray(obj?.suggestedRoles),
  hasScopeItems: Array.isArray(obj?.scopeItems),
  rolesLength: obj?.roles?.length,
  suggestedRolesLength: obj?.suggestedRoles?.length,
  scopeItemsLength: obj?.scopeItems?.length,
  keys: Object.keys(obj)
});
```

#### 3. Path-Specific Logging (Lines ~3166-3175)
```typescript
if (Array.isArray(obj?.roles)) {
  rolesArr = obj.roles;
  console.log(`✅ Using ${rolesArr.length} roles from obj.roles`);
} else if (Array.isArray(obj?.suggestedRoles)) {
  rolesArr = obj.suggestedRoles;
  console.log(`✅ Using ${rolesArr.length} roles from obj.suggestedRoles`);
} else if (Array.isArray(obj?.scopeItems)) {
  const derived = buildSuggestedRolesFromArchitectSOW(obj as ArchitectSOW);
  rolesArr = derived;
  console.log(`✅ Derived ${rolesArr.length} roles from obj.scopeItems`);
} else {
  console.warn('⚠️ JSON block has no roles, suggestedRoles, or scopeItems arrays');
}
```

#### 4. Empty Roles Warning (Line ~3189)
```typescript
if (rolesArr.length > 0) {
  console.log(`✅ Adding ${rolesArr.length} roles to queue`);
  // ...
} else {
  console.warn(`⚠️ JSON block found but rolesArr is empty - keeping original JSON in content`);
  // ...
}
```

#### 5. Parse Error Logging (Line ~3194)
```typescript
} catch (e) {
  console.error('❌ Failed to parse JSON block:', e);
  // ...
}
```

#### 6. Validation State Logging (Line ~3287)
```typescript
console.log(`🔍 [Validation] hasValidSuggestedRoles=${hasValidSuggestedRoles}, tablesRolesQueue.length=${tablesRolesQueue.length}`);
```

#### 7. Fallback Extraction Logging (Lines ~3289-3295)
```typescript
console.log('⚠️ No valid suggested roles from JSON blocks, attempting fallback extraction...');
// ...
console.log('🔍 Attempting to extract structured JSON from markdownPart...');
structured = extractSOWStructuredJson(markdownPart);
console.log('📊 Extracted structured JSON:', structured ? 'Found' : 'Not found');
```

#### 8. Enhanced Error Context (Lines ~3312-3321)
```typescript
console.error('❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON or scopeItems. The application requires one of these.');
console.error('📊 Debug info:', { 
  hasValidSuggestedRoles, 
  tablesRolesQueueLength: tablesRolesQueue.length,
  parsedStructured: !!parsedStructured,
  structured: !!structured,
  derivedLength: derived?.length || 0,
  structuredSow: !!structuredSow
});
```

## Expected Log Output (Success Case)

When working correctly, you should see:
```
🔍 [JSON Extraction] Found 1 JSON blocks in content
📦 [JSON Block] Parsed object: { hasSuggestedRoles: true, suggestedRolesLength: 5, keys: ["suggestedRoles", "discount"] }
✅ Using 5 roles from obj.suggestedRoles
✅ Adding 5 roles to queue
✅ Detected 1 pricing JSON block(s); will insert same number of pricing tables.
🔍 [Validation] hasValidSuggestedRoles=true, tablesRolesQueue.length=1
```

## Expected Log Output (Failure Case - Now with Diagnosis)

If the issue persists, you'll now see:
```
🔍 [JSON Extraction] Found 1 JSON blocks in content
📦 [JSON Block] Parsed object: { hasRoles: false, hasSuggestedRoles: false, hasScopeItems: true, scopeItemsLength: 3, keys: ["scopeItems"] }
✅ Derived 0 roles from obj.scopeItems
⚠️ JSON block found but rolesArr is empty - keeping original JSON in content
🔍 [Validation] hasValidSuggestedRoles=false, tablesRolesQueue.length=0
⚠️ No valid suggested roles from JSON blocks, attempting fallback extraction...
🔍 Attempting to extract structured JSON from markdownPart...
📊 Extracted structured JSON: Found
📊 Derived 0 roles from structured JSON
❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON or scopeItems. The application requires one of these.
📊 Debug info: { hasValidSuggestedRoles: false, tablesRolesQueueLength: 0, parsedStructured: false, structured: true, derivedLength: 0, structuredSow: false }
```

## Next Steps for User

1. **Test the insertion again** - The enhanced logging will now show exactly what's happening
2. **Share the console output** - We'll be able to see:
   - Whether JSON is being found
   - What structure the JSON has
   - Why roles extraction is failing
   - Whether fallback mechanisms are working

3. **Based on the logs, we can:**
   - Fix the AI prompt if it's generating wrong structure
   - Fix the extraction logic if the structure is correct but not being parsed
   - Add additional fallback mechanisms if needed

## Testing Instructions

1. Open the SOW page
2. Open browser console (F12)
3. Generate a new SOW with AI
4. Click "Insert to Editor"
5. **Capture and share ALL console output** from the insertion attempt
6. Look specifically for lines starting with:
   - `🔍 [JSON Extraction]`
   - `📦 [JSON Block]`
   - `✅ Using X roles from`
   - `⚠️ JSON block found but rolesArr is empty`
   - `🔍 [Validation]`
   - `❌ CRITICAL ERROR`

## Files Modified

- `/root/the11-dev/frontend/app/page.tsx` - Enhanced logging in `handleInsertContent` function

## Status

✅ Diagnostic logging added  
⏳ Waiting for user testing to identify root cause  
🔜 Will implement fix once diagnostic data is available
