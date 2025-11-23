# 🤖 AI Development Guide - Social Garden SOW Generator

**For AI Assistants Working on This Project**

This document teaches any AI how to navigate, edit, and deploy this codebase. Read this first before making changes!

---

## 🎯 PROJECT OVERVIEW

**What is this?**
A Next.js 15 + FastAPI application for creating beautiful Statements of Work with AI assistance and PDF export.

**Architecture:**
- **Frontend**: Next.js 15.1.4 with Novel editor (TipTap/ProseMirror) on port 3333
- **Backend**: Python 3.11 FastAPI with weasyprint for PDF generation on port 8000
- **Deployment**: Docker Compose with two services
- **Storage**: localStorage (Phase 1), PostgreSQL planned (Phase 2)
- **API**: OpenRouter for AI features (Claude, GPT, etc.)

---

## 📂 PROJECT STRUCTURE - CRITICAL PATHS

```
/root/the11/                              # Project root on VPS
│
├── docker-compose.yml                    # START HERE for ports/services
├── .env                                  # API keys (NEVER commit!)
├── .env.example                          # Template for setup
│
├── novel-editor-demo/                    # Frontend (Next.js)
│   ├── apps/web/                         # Main web application
│   │   ├── app/                          # Next.js app directory
│   │   ├── components/
│   │   │   └── tailwind/
│   │   │       ├── slash-command.tsx     # ⭐ SLASH COMMANDS (/table, /heading, etc.)
│   │   │       ├── generative/
│   │   │       │   ├── generative-menu-switch.tsx  # ⭐ AI POPUP (ask AI button)
│   │   │       │   ├── ai-selector.tsx             # ⭐ AI FEATURES (improve, fix, etc.)
│   │   │       │   └── ai-completion-command.tsx   # ⭐ AI API CALLS
│   │   │       ├── extensions/
│   │   │       │   └── slash-command.tsx  # Extension config for slash menu
│   │   │       └── advanced-editor.tsx    # Main editor component
│   │   ├── styles/
│   │   │   └── globals.css               # ⭐ COLORS, DARK MODE, BRANDING
│   │   ├── public/
│   │   │   ├── social-garden-logo.png    # ⭐ LOGO (366x44)
│   │   │   └── assets/
│   │   ├── package.json                  # Dependencies
│   │   └── Dockerfile                    # Frontend container
│   └── package.json                      # Workspace root
│
└── pdf-service/                          # Backend (Python)
    ├── main.py                           # ⭐ PDF GENERATION API
    ├── social-garden-logo-dark.png       # ⭐ LOGO for PDFs (366x44)
    ├── requirements.txt                  # Python dependencies
    └── Dockerfile                        # Backend container
```

---

## 🔧 HOW TO ACCESS & EDIT FILES

### Method 1: Direct File Editing (Recommended)

```bash
# Navigate to project
cd /root/the11

# Edit any file
nano path/to/file.tsx
# or
vim path/to/file.py
```

### Method 2: Using AI Tools

When you (AI assistant) need to edit files, you have these tools:

1. **read_file** - Read file contents
   ```
   filePath: "/root/the11/novel-editor-demo/apps/web/components/tailwind/slash-command.tsx"
   startLine: 1
   endLine: 100
   ```

2. **replace_string_in_file** - Edit files (MOST COMMON)
   ```
   filePath: "/root/the11/path/to/file"
   oldString: "exact text to replace (include 3+ lines context)"
   newString: "new text"
   ```

3. **create_file** - Create new files
   ```
   filePath: "/root/the11/new-file.ts"
   content: "file contents"
   ```

---

## 🎨 COMMON EDITING TASKS

### ✏️ Task 1: Add a New Slash Command

**File**: `/root/the11/novel-editor-demo/apps/web/components/tailwind/slash-command.tsx`

**Steps:**
1. Add icon import at top:
```typescript
import { YourIcon } from "lucide-react";
```

2. Add command to `suggestionItems` array:
```typescript
{
  title: "Your Command",
  description: "What it does",
  searchTerms: ["keyword1", "keyword2"],
  icon: <YourIcon size={18} />,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).yourAction().run();
  },
},
```

3. Rebuild frontend:
```bash
cd /root/the11
docker-compose build frontend
docker-compose up -d frontend
```

**Real Example - Adding Table Command:**
```typescript
{
  title: "Table",
  description: "Insert a table",
  searchTerms: ["table", "grid", "spreadsheet"],
  icon: <Table size={18} />,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range)
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  },
},
```

---

### 🎨 Task 2: Change Colors / Dark Mode

**File**: `/root/the11/novel-editor-demo/apps/web/styles/globals.css`

**Brand Colors (Use as accents only!):**
```css
:root {
  --sg-dark: 185 56% 13%;    /* #0e2e33 */
  --sg-green: 158 78% 46%;   /* #20e28f */
}
```

**Dark Mode Example:**
```css
.dark {
  --background: 0 0% 0%;        /* Pitch black */
  --foreground: 0 0% 98%;       /* White text */
  --card: 0 0% 4%;              /* Near black cards */
  --primary: var(--sg-green);   /* Brand green for buttons */
  --accent: var(--sg-green);    /* Brand green for highlights */
  --border: 0 0% 15%;           /* Subtle borders */
}
```

**After editing:**
```bash
docker-compose build frontend
docker-compose up -d frontend
```

---

### 🤖 Task 3: Fix/Change AI Features

**Files to edit:**
- `/root/the11/novel-editor-demo/apps/web/components/tailwind/generative/ai-selector.tsx`
- `/root/the11/novel-editor-demo/apps/web/components/tailwind/generative/ai-completion-command.tsx`

**Switch from OpenAI to OpenRouter:**

1. Find API endpoint (usually in ai-completion-command.tsx):
```typescript
// OLD
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  }
});

// NEW
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'http://localhost:3333',
    'X-Title': 'Social Garden SOW',
  }
});
```

2. Update model names:
```typescript
// OLD
model: "gpt-4"

// NEW
model: "anthropic/claude-3.5-sonnet"
```

---

### 📄 Task 4: Edit PDF Generation

**File**: `/root/the11/pdf-service/main.py`

**Change PDF styling:**
```python
# Find the CSS section (around line 100-200)
css = """
    body {
        font-family: 'Jakarta Sans', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
    }
    /* Add your styles here */
"""
```

**Change header/footer:**
```python
# Find generate_header() and generate_footer() functions
def generate_header():
    return """
        <div style="text-align: center;">
            <img src="social-garden-logo-dark.png" width="183" height="22">
        </div>
    """
```

**After editing:**
```bash
docker-compose build pdf-service
docker-compose up -d pdf-service
```

---

### 🖼️ Task 5: Change Logos

**Frontend Logo:**
```bash
# Replace this file:
/root/the11/novel-editor-demo/apps/web/public/social-garden-logo.png

# Must be 366x44 pixels (horizontal)
# Then rebuild:
docker-compose build frontend
docker-compose up -d frontend
```

**PDF Logo:**
```bash
# Replace this file:
/root/the11/pdf-service/social-garden-logo-dark.png

# Must be 366x44 pixels (horizontal)
# Then rebuild:
docker-compose build pdf-service
docker-compose up -d pdf-service
```

**Source logos available at:**
```bash
/root/thespace11/Logo Dark-Green.png  # 366x44 horizontal (CORRECT)
```

---

## 🐳 DOCKER WORKFLOW - ESSENTIAL

### When to Rebuild?

**Always rebuild after editing:**
- Frontend code (tsx, jsx, css, etc.) → `docker-compose build frontend`
- Backend code (Python files) → `docker-compose build pdf-service`
- Docker configs → `docker-compose build`

### Standard Workflow:

```bash
# 1. Navigate
cd /root/the11

# 2. Edit files
nano novel-editor-demo/apps/web/components/tailwind/slash-command.tsx

# 3. Rebuild affected service
docker-compose build frontend

# 4. Restart service
docker-compose up -d frontend

# 5. Check logs
docker-compose logs -f frontend

# 6. Test in browser
# Visit http://srv848342.hstgr.cloud:3333
```

### Quick Commands:

```bash
# Rebuild everything
docker-compose build

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (live)
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f pdf-service

# Restart specific service
docker-compose restart frontend

# Check status
docker-compose ps

# Rebuild from scratch (if cache issues)
docker-compose build --no-cache
```

---

## 🚨 CRITICAL RULES - READ THIS!

### ❌ NEVER DO THIS:

1. **NEVER commit `.env` file** - Contains API keys!
2. **NEVER edit files directly in containers** - Changes lost on rebuild
3. **NEVER use port 3000, 3001, 3002** - Already in use on VPS
4. **NEVER change brand colors without asking** - Client requirement
5. **NEVER delete localStorage code** - No database yet (Phase 2)

### ✅ ALWAYS DO THIS:

1. **ALWAYS edit source files**, then rebuild containers
2. **ALWAYS test after rebuilding** - Check logs and browser
3. **ALWAYS include 3+ lines context** when using replace_string_in_file
4. **ALWAYS rebuild affected service** after code changes
5. **ALWAYS commit to git** after successful changes
6. **ALWAYS check logs** if something doesn't work

---

## 🔍 DEBUGGING GUIDE

### Frontend Not Working?

```bash
# Check if running
docker-compose ps

# View logs
docker-compose logs frontend

# Common issues:
# - Port 3333 in use? Change FRONTEND_PORT in .env
# - Build failed? Check for TypeScript errors in logs
# - Can't reach? Check if VPS firewall allows port 3333

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### PDF Service Not Working?

```bash
# Check logs
docker-compose logs pdf-service

# Test directly
curl http://localhost:8000/health

# Common issues:
# - Python syntax error? Check indentation in main.py
# - Missing logo? Verify social-garden-logo-dark.png exists
# - Weasyprint error? Check CSS syntax in main.py

# Rebuild
docker-compose build pdf-service
docker-compose up -d pdf-service
```

### Find Specific Code:

```bash
# Search for text in all files
cd /root/the11
grep -r "searchterm" novel-editor-demo/apps/web/

# Find files by name
find . -name "*.tsx" | grep slash

# Search in specific file type
grep -r "OpenAI" --include="*.tsx" .
```

---

## 📝 GIT WORKFLOW

### Standard Process:

```bash
# 1. Check status
cd /root/the11
git status

# 2. Add changes
git add -A

# 3. Commit with message
git commit -m "Add table command to slash menu"

# 4. Push to GitHub (requires auth)
git push origin production-ready
```

### Branch Strategy:

- **main** - Old development branch
- **production-ready** - Current stable branch (USE THIS!)
- Create feature branches if needed:
  ```bash
  git checkout -b feature/new-ai-model
  # Make changes
  git commit -m "Add reasoning model support"
  git push origin feature/new-ai-model
  ```

---

## 🎯 COMMON FEATURE REQUESTS

### "Add a new AI command"

**Files**: `ai-selector.tsx`

Find the `items` array:
```typescript
{
  name: "Your Command",
  icon: YourIcon,
  description: "What it does",
  isConversationCommand: false,
  command: (editor) => complete("your prompt here", editor)
}
```

### "Change the popup behavior"

**Files**: `generative-menu-switch.tsx`

Look for Tippy configuration:
```typescript
<Tippy
  delay={[500, 0]}
  interactive={true}
  // Add more Tippy options
>
```

### "Add new table options"

**Files**: `slash-command.tsx`

Modify the table command:
```typescript
.insertTable({ 
  rows: 5,              // Change rows
  cols: 4,              // Change columns
  withHeaderRow: true   // Toggle header
})
```

### "Change PDF layout"

**Files**: `pdf-service/main.py`

Edit CSS in the `css` variable or modify `generate_header()`/`generate_footer()` functions.

---

## 🌐 ENVIRONMENT VARIABLES

**File**: `/root/the11/.env`

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxx    # OpenRouter API key

# Optional
FRONTEND_PORT=3333                    # Change if port in use
```

**Get API keys:**
- OpenRouter: https://openrouter.ai/keys (free tier available)

---

## 📊 TESTING CHECKLIST

After making changes, test:

- [ ] Frontend builds: `docker-compose build frontend`
- [ ] Frontend starts: `docker-compose up -d frontend`
- [ ] No errors in logs: `docker-compose logs frontend`
- [ ] App loads: http://srv848342.hstgr.cloud:3333
- [ ] Feature works in browser
- [ ] PDF export works (if changed backend)
- [ ] Dark mode looks correct
- [ ] AI features work (if changed AI code)
- [ ] Changes committed: `git commit`

---

## 💡 PRO TIPS FOR AI ASSISTANTS

1. **Read files before editing** - Use `read_file` to understand context
2. **Search before adding** - Feature might already exist
3. **Test incrementally** - Small changes, rebuild, test, repeat
4. **Check logs always** - They show exact errors
5. **Use exact strings** - When using replace_string_in_file, copy exact text
6. **Include context** - 3-5 lines before/after for replace operations
7. **Rebuild after every edit** - Containers don't auto-update
8. **Commit frequently** - Git is your safety net

---

## 🆘 EMERGENCY COMMANDS

### Container Won't Start?

```bash
# Nuclear option - rebuild everything
cd /root/the11
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Lost Changes?

```bash
# Check git history
git log

# Restore from commit
git checkout <commit-hash> -- path/to/file
```

### Port Conflict?

```bash
# Find what's using port
netstat -tulpn | grep 3333

# Change port in .env
echo "FRONTEND_PORT=3334" >> .env
docker-compose up -d
```

### Out of Space?

```bash
# Clean Docker cache
docker system prune -a

# Remove unused images
docker image prune -a
```

---

## 📚 QUICK REFERENCE

### File Paths Cheatsheet:

```bash
# Slash commands
/root/the11/novel-editor-demo/apps/web/components/tailwind/slash-command.tsx

# AI features
/root/the11/novel-editor-demo/apps/web/components/tailwind/generative/ai-selector.tsx

# Styling/colors
/root/the11/novel-editor-demo/apps/web/styles/globals.css

# PDF generation
/root/the11/pdf-service/main.py

# Docker config
/root/the11/docker-compose.yml

# Environment
/root/the11/.env
```

### Port Reference:

- **3333** - Frontend (Next.js)
- **8000** - PDF Service (FastAPI)
- **3000-3002** - TAKEN, don't use!

### Rebuild Reference:

| Changed File Type | Rebuild Command |
|-------------------|-----------------|
| `.tsx`, `.ts`, `.jsx`, `.js` | `docker-compose build frontend` |
| `.css` | `docker-compose build frontend` |
| `.py` | `docker-compose build pdf-service` |
| `package.json` | `docker-compose build frontend` |
| `requirements.txt` | `docker-compose build pdf-service` |
| `Dockerfile` | `docker-compose build` |
| `docker-compose.yml` | `docker-compose up -d` |

---

## 🎓 LEARNING RESOURCES

- **Novel Editor**: https://novel.sh/
- **TipTap**: https://tiptap.dev/
- **OpenRouter**: https://openrouter.ai/docs
- **Next.js 15**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **WeasyPrint**: https://weasyprint.org/

---

## ✅ YOU'RE READY!

You now know:
- ✅ How to find and edit files
- ✅ How to rebuild and test changes
- ✅ How to add features (commands, AI, styling)
- ✅ How to debug issues
- ✅ How to commit to git

**Start small, test often, read logs always!** 🚀

---

**Last Updated**: October 14, 2025
**VPS**: srv848342.hstgr.cloud
**Project**: Social Garden SOW Generator
