# React Component Import/Export Fix Guide

## New Error Identified: Invalid Component Type

**Error:** `React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: undefined`

**Location:** `components/tailwind/workspace-chat.tsx` line 740

## Root Cause

During your component refactor, you have:
1. **Missing component export** - Component defined but not exported
2. **Broken import statement** - Trying to import something that doesn't exist
3. **Mixed default/named imports** - Using wrong import syntax
4. **Circular dependency** - Components depending on each other incorrectly

## Quick Fix Steps

### Step 1: Check Export Statements

**Look for components that should be exported but aren't:**

```javascript
// ❌ Missing export
const MyComponent = () => {
  return <div>Content</div>;
}

// ✅ Correct export
export const MyComponent = () => {
  return <div>Content</div>;
}

// OR

const MyComponent = () => {
  return <div>Content</div>;
}

export default MyComponent;
```

### Step 2: Check Import Statements

**Verify imports match exports:**

```javascript
// ❌ Wrong import (trying to import non-existent export)
import { NonExistentComponent } from './ComponentFile';

// ✅ Correct import (matches export)
import { ActualComponent } from './ComponentFile';

// OR for default exports
import ActualComponent from './ComponentFile';
```

### Step 3: Check workspace-chat.tsx Line 740

**Find what's being rendered at line 740:**

```javascript
// Look for something like this that's undefined:
{messages.map(message => (
  <undefinedComponent key={message.id} /> // ❌ This component is undefined
))}

// Fix by ensuring the component is properly imported:
import { MessageComponent } from './message-component';

{messages.map(message => (
  <MessageComponent key={message.id} /> // ✅ Now it works
))}
```

### Step 4: Common Refactor Issues to Check

**1. Split Components Not Exported:**
```javascript
// In your new component files
export const NewComponent = () => {...} // ✅ Make sure to export
```

**2. Import Paths Broken:**
```javascript
// Check import paths after refactor
import { Component } from '../correct-path'; // ✅ Path should be correct
```

**3. Named vs Default Imports:**
```javascript
// If component is exported as default:
export default function MyComponent() {...}
// Import should be:
import MyComponent from './MyComponent';

// If component is exported as named:
export const MyComponent = () => {...}
// Import should be:
import { MyComponent } from './MyComponent';
```

### Step 5: Debug the Specific Error

**Add temporary debug to find the undefined component:**

```javascript
// In workspace-chat.tsx around line 740
{messages.map((message, index) => {
  console.log(`🔍 [DEBUG] Rendering message ${index}:`, typeof message.component);
  const ComponentToRender = message.component || 'div'; // Fallback
  return <ComponentToRender key={message.id} />;
})}
```

## Most Likely Causes in Your Refactor

1. **New Chat Components Not Exported** - You created new components but forgot to export them
2. **Message Rendering Components Missing** - Message display components not properly imported
3. **Import Paths Changed** - File structure changed, imports need updating
4. **Component Name Changes** - Components renamed but imports not updated

## Emergency Fix

**If you can't find the issue quickly, temporarily fix by adding fallbacks:**

```javascript
// In workspace-chat.tsx, replace problematic rendering with:
{messages.map(message => {
  const SafeComponent = message.component || 'div';
  return React.createElement(SafeComponent, { key: message.id });
})}
```

This will prevent the app from crashing while you fix the import/export issues.