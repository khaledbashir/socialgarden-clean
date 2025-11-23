# Chat Disappearing Fix - Oct 23, 2025

## Issue Fixed
Chat messages were disappearing when sent and page was refreshing with React error #321.

## Root Cause
The `handleSendChatMessage` function was creating new function instances on every render, causing React's dependency system to be confused when the function was passed to callbacks. This led to stale closures and unexpected re-renders.

## Solution Applied
Wrapped `handleSendChatMessage` with `useCallback` hook:
```tsx
const handleSendChatMessage = useCallback(async () => {
  // ... function body ...
}, [chatInput, sow, chatMessages]);
```

This ensures:
1. Function reference is stable across renders
2. Dependencies are explicit (React warns if missing)
3. State updates don't cause closure-related issues
4. Prevents unnecessary re-renders of child components using this handler

## Changes Made
- Added `useCallback` to imports in `frontend/app/portal/sow/[id]/page.tsx`
- Wrapped chat handler with `useCallback` + added outer try-catch for robustness
- Dependency array includes: `[chatInput, sow, chatMessages]`

## Testing
1. Send a chat message
2. Message should appear and persist
3. AI should respond without page refresh
4. No React errors in console
5. Chat history should remain after response

## If Still Broken
If messages still disappear:
1. Check browser console for any new errors
2. Check if `/api/chat` endpoint is responding (check network tab)
3. Verify `sow` object is still valid during chat
4. Check if there's a parent component re-mounting (add console.log at component top)
