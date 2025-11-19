# Handover Document - SOW Generator Application
**Date:** November 19, 2025  
**Repository:** `the11-dev-clean` (clean version)  
**Branch:** `sow-latest`  
**Easypanel Service:** `sow-qandu-me`

---

## 🎯 Current Status

### ✅ **Application is Deployed and Building Successfully**
- **Repository:** `https://github.com/khaledbashir/the11-dev-clean`
- **Branch:** `sow-latest` (default branch)
- **Build Path:** `/`
- **Latest Commit:** `3304b2a` (as of last fix)

### 📦 **Recent Fixes Applied**
1. ✅ Fixed TypeScript errors (vertical/service_line type alignment)
2. ✅ Replaced "Create Document" button with "Create Workspace" button
3. ✅ Fixed DialogContent accessibility warning
4. ✅ Fixed file structure issues (moved incorrectly placed files)
5. ✅ Added missing dependencies (@radix-ui/react-visually-hidden)

---

## 🏗️ Architecture Overview

### **Repository Structure**
- **Main Repo:** `/root/the11-dev-clean` (clean, production-ready)
- **Backup Repo:** `/root/the11-dev` (original, kept as backup)
- **Only 2 Branches:** `sow-latest` (main) and `backend-service`

### **AnythingLLM Integration (CRITICAL)**
The application follows strict architectural mirroring:

- **Each Client = Dedicated AnythingLLM Workspace**
  - Workspace created via `/api/v1/workspace/new`
  - System prompt set during creation (not injected at runtime)
  - System prompt contains: Rate Card, Financial Rules, JSON Structure

- **Each SOW = Dedicated AnythingLLM Thread**
  - Thread created via `/api/v1/workspace/{slug}/thread/new`
  - `threadSlug` stored in database (`sow.thread_slug`)
  - Used for all conversational interactions

**Key Files:**
- `frontend/lib/anythingllm.ts` - Main AnythingLLM service
- `frontend/lib/social-garden-knowledge-base.ts` - Knowledge base
- `frontend/hooks/useDocumentState.ts` - Document/workspace state management

---

## 📋 Sam's Requirements Compliance

### ✅ **All Requirements Met**

#### **I. SOW Structure & Content**
- ✅ Standard SOW structure (Overview, Deliverables, Phases, Assumptions)
- ✅ Bespoke deliverables from client briefs
- ✅ Detailed bullet-point deliverables format
- ✅ Deliverables placed after Overview, before phases
- ✅ Context-appropriate phases
- ✅ Comprehensive assumptions (standard + project-specific)
- ✅ Versatile for all service types
- ✅ Client brief upload functionality

#### **II. Pricing, Roles & Hour Allocation**
- ✅ Correct Rate Card usage (enforced programmatically)
- ✅ Granular role assignment (most specific role)
- ✅ Balanced hour distribution
- ✅ Mandatory management roles (Head Of, Delivery, Account Mgmt)
- ✅ **Account Management at bottom** (enforced in `mandatory-roles-enforcer.ts`)
- ✅ Budget adherence with financial reasoning protocol
- ✅ AUD currency with rounding
- ✅ Discount functionality (percentage-based)
- ✅ **GST display (+GST)** in pricing table

#### **III. Application Functionality**
- ✅ Editable pricing table (manual role/hours/tasks updates)
- ✅ **Drag & drop role reordering** (HTML5 drag-drop in `editable-pricing-table.tsx`)
- ✅ Total price toggle (`showTotal` state)
- ✅ **Professional PDF export** (Plus Jakarta Sans font, logo support, colored sections)
- ✅ CSV/Excel export (`/api/sow/[id]/export-excel`)
- ✅ Data persistence (all SOWs saved to database)

**Key Implementation Files:**
- `frontend/lib/mandatory-roles-enforcer.ts` - Enforces role requirements
- `frontend/components/tailwind/extensions/editable-pricing-table.tsx` - Pricing table with drag-drop
- `frontend/components/sow/SOWPdfExport.tsx` - PDF generation
- `frontend/lib/rateCard.ts` - Official rate card (single source of truth)

---

## 🔧 Technical Details

### **File Structure (Critical)**
```
frontend/
  app/
    page.tsx                    # Main application page
  components/
    tailwind/
      sidebar-nav.tsx          # Sidebar with workspace management
      editable-pricing-table.tsx # Pricing table with drag-drop
    sow/
      SOWPdfExport.tsx         # PDF export (Plus Jakarta Sans font)
      utils.ts                 # PDF utilities
      types.ts                 # PDF types
  lib/
    anythingllm.ts             # AnythingLLM integration service
    social-garden-knowledge-base.ts # Knowledge base
    mandatory-roles-enforcer.ts # Role enforcement engine
    rateCard.ts                # Official rate card
  hooks/
    useDocumentState.ts        # Document/workspace state
```

### **Database Schema**
- `sows` table: `id`, `title`, `content`, `folder_id`, `workspace_slug`, `thread_slug`, `vertical`, `service_line`
- `folders` table: `id`, `name`, `workspace_slug`, `workspace_id`, `embed_id`
- **Note:** Folders and Workspaces are the same thing (for backward compatibility)

### **Environment Variables (Easypanel)**
- `NEXT_PUBLIC_ANYTHINGLLM_URL` - AnythingLLM instance URL
- `NEXT_PUBLIC_ANYTHINGLLM_API_KEY` - API key for AnythingLLM
- `NEXT_PUBLIC_PDF_SERVICE_URL` - Backend service for PDF generation
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` - Database connection

---

## 🐛 Known Issues & Recent Fixes

### **Fixed Issues**
1. ✅ **TypeScript Build Errors** - Fixed vertical/service_line type mismatches
2. ✅ **Runtime Error** - Fixed undefined folders/workspaces in SidebarNav
3. ✅ **File Structure** - Removed incorrectly placed files:
   - `frontend/SOWPdfExport.tsx` → moved to `frontend/components/sow/`
   - `frontend/anythingllm.ts` → removed (correct file is `frontend/lib/anythingllm.ts`)
   - `frontend/page.tsx` → removed (correct file is `frontend/app/page.tsx`)
4. ✅ **Missing Dependencies** - Added `@radix-ui/react-visually-hidden`
5. ✅ **PDF Font** - Changed from Helvetica to Plus Jakarta Sans

### **Potential Issues to Monitor**
1. **SOW Embedding Error** - Sometimes fails with "Failed to embed document in workspace"
   - **Location:** `frontend/lib/anythingllm.ts:897`
   - **Status:** Error handling improved, but API issues may still occur
   - **Action:** Monitor logs for actual API errors

2. **Document Not Found** - Rarely occurs after workspace creation
   - **Location:** `frontend/app/page.tsx:534`
   - **Status:** Fixed by ensuring document added to state immediately
   - **Action:** Monitor if issue persists

---

## 🚀 Deployment Process

### **Easypanel Configuration**
- **Source:** GitHub
- **Owner:** `khaledbashir`
- **Repository:** `the11-dev-clean`
- **Branch:** `sow-latest`
- **Build Path:** `/`
- **Auto-deploy:** Enabled (triggers on push to `sow-latest`)

### **Build Process**
1. Easypanel downloads GitHub archive
2. Docker build using `node:18-alpine`
3. Installs dependencies with `pnpm install --no-frozen-lockfile`
4. Builds with `pnpm build`
5. Type checks with TypeScript
6. Deploys to service

### **Manual Deployment Trigger**
If needed, Easypanel provides a webhook URL to trigger deployments manually.

---

## 📝 Development Workflow

### **Making Changes**
1. Work in `/root/the11-dev-clean` (clean repo)
2. Make changes and test locally
3. Commit with descriptive messages
4. Push to `origin sow-latest`
5. Easypanel auto-deploys

### **Backup Strategy**
- Original repo `/root/the11-dev` kept as backup
- All branches preserved in original repo
- Clean repo has only 2 branches: `sow-latest` and `backend-service`

### **Branch Strategy**
- **`sow-latest`** - Main production branch (default)
- **`backend-service`** - Backend-specific changes
- **No other branches** - Clean structure to avoid conflicts

---

## 🔍 Key Code Locations

### **Workspace Creation Flow**
- **Entry Point:** `frontend/app/page.tsx:930` - `handleCreateWorkspace()`
- **AnythingLLM:** `frontend/lib/anythingllm.ts:248` - `createWorkspaceWithPrompt()`
- **System Prompt:** `frontend/lib/anythingllm.ts:312` - `setArchitectPrompt()`

### **SOW Generation**
- **System Prompt:** Contains Rate Card, Financial Rules, JSON Structure
- **Role Enforcement:** `frontend/lib/mandatory-roles-enforcer.ts`
- **Pricing Table:** `frontend/components/tailwind/extensions/editable-pricing-table.tsx`

### **Thread Management**
- **Thread Creation:** `frontend/lib/anythingllm.ts:1322` - `createThread()`
- **Thread Storage:** `sow.thread_slug` in database
- **Thread Usage:** All chat interactions use thread slug

---

## 🎨 UI/UX Features

### **Sidebar Navigation**
- **Create Workspace** button (replaced old "Create Document" button)
- Workspace list with SOWs
- Drag-drop reordering (workspaces and SOWs)
- Search functionality

### **Pricing Table**
- Editable rows (role, description, hours, rate)
- Drag-drop reordering of roles
- Discount percentage input
- GST calculation and display
- Account Management roles automatically placed at bottom

### **PDF Export**
- Plus Jakarta Sans font
- Social Garden logo support
- Colored section bars
- Professional formatting

---

## 🔐 Security & Configuration

### **API Keys & Secrets**
- Stored as Easypanel build arguments (not in code)
- AnythingLLM API key required
- Database credentials from Easypanel environment

### **Rate Card**
- **Location:** `frontend/lib/rateCard.ts`
- **Single Source of Truth** - All rates must match exactly
- **Enforcement:** `mandatory-roles-enforcer.ts` validates all roles

---

## 📚 Important Documentation

### **Architecture Guide**
- **Location:** Provided in conversation (workspace/thread mirroring)
- **Key Principle:** Each Client = Workspace, Each SOW = Thread
- **System Prompt:** Set once during workspace creation, not at runtime

### **Sam's Requirements Checklist**
- All 23 requirements verified and implemented
- See "Sam's Requirements Compliance" section above

---

## 🆘 Troubleshooting

### **Build Fails**
1. Check TypeScript errors: `cd frontend && pnpm build`
2. Verify all imports resolve correctly
3. Check for missing dependencies in `package.json`
4. Ensure file structure is correct (no files in wrong locations)

### **Runtime Errors**
1. Check browser console for errors
2. Verify workspace/thread creation in AnythingLLM
3. Check database connection
4. Verify environment variables are set

### **SOW Generation Issues**
1. Check system prompt is set in workspace
2. Verify rate card is loaded
3. Check mandatory roles are enforced
4. Review AnythingLLM API responses

---

## 📞 Next Steps

1. **Monitor Deployment** - Ensure latest build succeeds
2. **Test Workspace Creation** - Verify new workspaces create correctly
3. **Test SOW Generation** - Ensure AI generates compliant SOWs
4. **Monitor Errors** - Watch for embedding errors or document not found issues
5. **Verify PDF Export** - Test that PDFs generate with correct font and logo

---

## 📋 Quick Reference

**Repository:** `https://github.com/khaledbashir/the11-dev-clean`  
**Branch:** `sow-latest`  
**Local Path:** `/root/the11-dev-clean`  
**Easypanel Service:** `sow-qandu-me`  
**Latest Commit:** Check with `git log -1`  

**Key Commands:**
```bash
cd /root/the11-dev-clean
git status
git log --oneline -5
git push origin sow-latest
```

---

**End of Handover Document**

