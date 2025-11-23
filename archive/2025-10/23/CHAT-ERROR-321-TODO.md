# Chat Issue - Oct 23, 2025: Messages Disappearing & React Error #321

## Problem
When user sends a chat message in SOW editor:
1. Message appears briefly
2. Component crashes with React error #321
3. Page refreshes automatically
4. Chat history is lost

## Root Cause
React error #321 = "Invalid hook call. Hooks can only be called inside the body of a function component"

This happens when:
- A component with hooks is rendered conditionally BEFORE other hooks are called
- OR a hook is called inside a callback or event handler (not at component top level)
- OR a component with hooks is unmounted/remounted during render

## Affected Code
- `frontend/app/portal/sow/[id]/page.tsx` line 1317
- `frontend/components/tailwind/floating-ai-bar.tsx` (uses `useEditor()` without proper context)

## Diagnosis
The error occurs immediately after:
```
page.tsx:734 💾 Auto-saved SOW
page.tsx:2302  🏢 Detected client name in prompt
page.tsx:1317 ❌ Uncaught Error: Minified React error #321
```

This suggests the component state/context is being lost during a re-render or the chat component is being mounted outside valid React context.

## Solution (TODO)
1. Wrap chat message handling with proper error boundary
2. Ensure chat state updates don't cause full component remount
3. Add useCallback to stabilize function references in chat handlers
4. Verify all hooks are at component top level (not in conditions/callbacks)
5. Test with console.error logging to catch state updates causing remount

## Quick Test
- Try sending a chat message
- Check browser DevTools console for React error details
- Search for "useContext" or "useEditor" being called outside component body

## Files to Review
- `frontend/app/portal/sow/[id]/page.tsx` (line 320-380 chat handler + all uses of state)
- `frontend/components/tailwind/floating-ai-bar.tsx` (hook usage)
- `frontend/app/providers.tsx` (ensure all context providers are in place)

## For Next AI Session
If error persists after message send:
1. Add try-catch around setChatMessages calls
2. Check if parent component is re-rendering unexpectedly
3. Verify FloatingAIBar isn't being rendered outside NovelProvider
4. Check for memory leaks or circular dependency in fetch calls
