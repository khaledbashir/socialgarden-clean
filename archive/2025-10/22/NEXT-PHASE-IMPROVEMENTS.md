# 🚀 Next Phase Improvements - Deployment & UI Enhancements

## ✅ COMPLETED: Chat Persistence Fix
**Status:** ✅ Pushed to GitHub (commit `38043b8`)
**What:** Fixed threadSlug persistence in documents so chat history survives document switching
**Result:** When you create a SOW, chat with the AI, and switch to another document, then switch back - the chat history is now persistent

---

## 📋 NEXT TASKS

### 1. 🎯 Set "GEN - The Architect" as Default Agent (PRIORITY)
**File:** `frontend/app/page.tsx`
**Current:** Line 2221 forces workspace to 'gen-the-architect' but the dropdown still shows last selected agent
**Fix:** Need to default the agent dropdown to "GEN - The Architect" on load

**Current Code (Line 708):**
```typescript
const genArchitect = gardnerAgents.find(a => 
  a.name === 'GEN - The Architect' || a.id === 'gen-the-architect'
);
const defaultAgentId = genArchitect?.id || anyGenGardner?.id || gardnerAgents[0]?.id || 'gen-the-architect';
```

**What's Happening:**
- ✅ Logic correctly identifies "GEN - The Architect"
- ✅ Sets it as defaultAgentId
- ❌ BUT: Need to ensure the state `currentAgentId` is set to this on mount

**Required Fix:**
- Set `setCurrentAgentId(defaultAgentId)` on mount
- Ensure the agent dropdown UI reflects this selection

---

### 2. 🏆 The Architect's 3 Work Types - Visual Categorization

**The Architect determines 3 types:**
1. **🔨 Standard Project** - Build/Delivery with fixed timeline
   - Examples: HubSpot setup, Email template, Landing page
   - Characteristics: Start date, End date, Phases, Deliverables

2. **📊 Audit/Strategy** - Analysis & Recommendations
   - Examples: Marketing Automation audit, CRM audit, Customer journey mapping
   - Characteristics: Assessment, Findings, Recommendations, Implementation plan

3. **📅 Retainer Agreement** - Ongoing Monthly Support
   - Examples: Monthly CRM support, Ongoing optimization, Ad management
   - Characteristics: Monthly fee, Recurring deliverables, Rolling contract

**Visual Categorization Options:**

#### Option A: 🎨 Color-Coded Badges (RECOMMENDED)
```
When SOW is created, show badge:
- 🔨 [STANDARD PROJECT] - Blue badge, "sow-mh2aqusn-d8wdq"
- 📊 [AUDIT/STRATEGY] - Purple badge, "sow-mh2aqusn-d8wdq"  
- 📅 [RETAINER] - Green badge, "sow-mh2aqusn-d8wdq"
```
**Where to show:**
- In the left sidebar folder list (next to SOW name)
- In the document title/header
- In the SOW listing view

#### Option B: 📂 Visual Icons in Sidebar
```
Folder structure:
📁 Workspace Name
  ├─ 🔨 SOW Title (Standard Project)
  ├─ 📊 SOW Title (Audit)
  └─ 📅 SOW Title (Retainer)
```

#### Option C: 🔖 Inline Type Tags
```
Each SOW shows:
"SOW Title" [Standard Project] 
"SOW Title" [Audit/Strategy]
"SOW Title" [Retainer]
```

**IMPLEMENTATION STRATEGY:**

The AI needs to include this metadata. Two approaches:

**Approach 1: AI Decides & Reports**
- The Architect analyzes the brief internally
- At the end of generation, includes: `🔨 TYPE: Standard Project` or similar
- Frontend regex extracts this
- Frontend stores it in SOW metadata

**Approach 2: Store in Database**
- Add `sow_type` column to `sows` table
- Values: 'project' | 'audit' | 'retainer'
- When SOW is created, extract from AI response
- Display in UI with color/icon

---

## 🛠️ Implementation Priority

### Immediate (This Deploy):
1. **Make "GEN - The Architect" default agent** ✅
2. **Extract work_type from AI response** ✅
3. **Add simple badge/tag display** ✅

### Next Deploy:
1. Store work_type in database
2. Enhanced visual categorization
3. Filter/sort by type in sidebar

---

## 📝 Technical Details

### Current Database Schema (sows table)
```sql
CREATE TABLE sows (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500),
  client_name VARCHAR(255),
  content LONGTEXT,
  workspace_slug VARCHAR(255),
  status ENUM('draft', 'sent', 'viewed', 'accepted', 'declined'),
  -- ADD THIS:
  sow_type ENUM('project', 'audit', 'retainer') DEFAULT 'project',
  -- ... rest of columns
);
```

### How The Architect decides work type:
**From system prompt (line 163 in lib/gardner-templates.ts):**
```
FIRST - ANALYZE THE WORK TYPE: Before writing, SILENTLY classify the user's brief into one of these categories:
1. Standard Project: A defined build/delivery with a start and end 
2. Audit/Strategy: An analysis and recommendation engagement 
3. Support Retainer: Ongoing monthly support services with recurring deliverables
```

### Extraction Pattern
Extract from AI response using regex:
```typescript
const typeMatch = response.match(/TYPE:\s*(Standard Project|Audit\/Strategy|Support Retainer)/i);
const workType = typeMatch?.[1] || 'project';
```

---

## 🎨 Recommended UI Component

```tsx
// Badge component for SOW type
interface SOWTypeBadge {
  type: 'project' | 'audit' | 'retainer';
}

const colors = {
  project: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   // 🔨
  audit: 'bg-purple-500/20 text-purple-300 border-purple-500/30', // 📊
  retainer: 'bg-green-500/20 text-green-300 border-green-500/30'   // 📅
};

const icons = {
  project: '🔨',
  audit: '📊',
  retainer: '📅'
};

const labels = {
  project: 'Standard Project',
  audit: 'Audit/Strategy',
  retainer: 'Retainer'
};
```

---

## 🚀 Deployment Checklist

- [ ] Git push to GitHub (DONE ✅ - commit `38043b8`)
- [ ] Easypanel redeploy from GitHub
- [ ] Test chat persistence (create SOW → chat → switch docs → switch back)
- [ ] Set Architect as default agent
- [ ] Extract and display work type
- [ ] Test all 3 work type scenarios

---

## 💡 My Opinion on Visual Categorization

**I recommend Option A (Color-Coded Badges) because:**

1. **Immediate Visual Clarity** - Users see at a glance what type of project it is
2. **Professional Appearance** - Clean, minimal design that doesn't clutter the UI
3. **Easy Implementation** - Just add a badge component next to SOW name
4. **Actionable** - Each type might need different next steps:
   - 🔨 **Standard Project** → Next: Create timeline
   - 📊 **Audit** → Next: Set assessment scope
   - 📅 **Retainer** → Next: Set monthly fee

**Visual Placement:**
```
📁 Workspace: TTT
  ├─ DDD realestate budget 5k [🔨 Standard Project]
  ├─ hiiitest [📊 Audit/Strategy]
  └─ Project Name [📅 Retainer]
```

This makes the sidebar more informative without being overwhelming.

---

## 📞 Next Steps

Ready to implement:
1. Make Architect default ✅
2. Extract work types ✅
3. Display with badges ✅

Just say "Go" and I'll push the UI enhancements!
