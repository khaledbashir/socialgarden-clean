# 🎯 VISUAL GUIDE: Where Your Shit Actually Is

## 🗺️ THE BIG PICTURE

Think of it like this:

```
YOUR VPS SERVER (srv848342.hstgr.cloud)
│
├── /root/the11/  ← THIS IS YOUR GITHUB REPO (like cloning to your laptop)
│   │
│   ├── README.md, package.json, etc.  ← Root files
│   │
│   ├── novel-editor-demo/  ← Your Next.js app (React code)
│   │   └── apps/web/  ← The actual web app
│   │       ├── components/  ← YOUR REACT COMPONENTS (THIS IS YOUR CODE!)
│   │       │   └── tailwind/
│   │       │       ├── advanced-editor.tsx  ← Main editor
│   │       │       ├── slash-command.tsx  ← /table, /heading commands
│   │       │       └── generative/  ← AI FEATURES FOLDER
│   │       │           ├── ai-selector.tsx  ← AI menu (improve, fix, etc.)
│   │       │           └── generative-menu-switch.tsx  ← THE BROKEN POPUP!
│   │       │
│   │       ├── styles/
│   │       │   └── globals.css  ← Dark mode colors
│   │       │
│   │       └── public/
│   │           └── social-garden-logo.png  ← Your logo
│   │
│   └── pdf-service/  ← Python API for PDFs
│       ├── main.py  ← PDF generation code
│       └── social-garden-logo-dark.png  ← Logo for PDFs
│
└── /root/thespace11/  ← TEMPORARY FIXES/LOGOS FOLDER
    ├── Logo Dark-Green.png  ← Original logo source
    └── generative-menu-switch.tsx  ← THE FIX WE NEED TO COPY!
```

---

## 🐳 WHAT THE FUCK IS DOCKER?

**Without Docker** (normal way you're used to):
```
1. Clone repo
2. npm install
3. npm run dev
4. Edit files, see changes immediately
```

**With Docker** (what we're using):
```
1. Clone repo
2. docker-compose up -d  ← Builds and runs EVERYTHING
3. Edit files
4. docker-compose build frontend  ← REBUILD to see changes
5. docker-compose up -d frontend  ← RESTART to apply
```

### Why Docker?
- **Containers** = Like mini computers running your app
- **docker-compose.yml** = Recipe that says "run frontend on port 3333, PDF on port 8000"
- **Rebuilding** = Necessary because your code is COPIED INTO the container

Think of it like:
- Your code files = Recipe ingredients
- Docker build = Cooking the meal
- Docker up = Serving the meal
- You edit ingredients → Need to cook again!

---

## 📂 WHERE IS EACH PIECE?

### 1️⃣ Your Source Code (Edit Here!)
```bash
/root/the11/novel-editor-demo/apps/web/
```
This is like your `src/` folder in VS Code. When you edit these files, you need to rebuild.

### 2️⃣ The Running App (Don't Edit!)
```bash
Inside Docker containers
```
These are copies. Changes here disappear when you rebuild. ALWAYS edit source code!

### 3️⃣ The Fix File (Need to Copy)
```bash
/root/thespace11/generative-menu-switch.tsx
```
This is the fixed version. We need to copy it to replace the broken one.

---

## 🔧 THE FIX - STEP BY STEP

### Current Situation:
```
BROKEN FILE (in your project):
/root/the11/novel-editor-demo/apps/web/components/tailwind/generative/generative-menu-switch.tsx

FIXED FILE (needs to be copied):
/root/thespace11/generative-menu-switch.tsx
```

### What We'll Do:
1. **Backup** the broken file (just in case)
2. **Copy** the fixed file over it
3. **Rebuild** the Docker container
4. **Restart** the app
5. **Test** that it works!

---

## 🎬 THE ACTUAL COMMANDS

Run these ONE BY ONE and tell me what you see:

### Step 1: See what's currently broken
```bash
ls -la /root/the11/novel-editor-demo/apps/web/components/tailwind/generative/
```
You should see `generative-menu-switch.tsx` listed.

### Step 2: Backup the broken file
```bash
cd /root/the11/novel-editor-demo/apps/web/components/tailwind/generative/
cp generative-menu-switch.tsx generative-menu-switch.tsx.backup
echo "Backup created!"
```

### Step 3: Copy the fixed file
```bash
cp /root/thespace11/generative-menu-switch.tsx /root/the11/novel-editor-demo/apps/web/components/tailwind/generative/generative-menu-switch.tsx
echo "Fixed file copied!"
```

### Step 4: Check it was copied
```bash
ls -la /root/the11/novel-editor-demo/apps/web/components/tailwind/generative/
```
You should now see both files:
- `generative-menu-switch.tsx` (the new fixed one)
- `generative-menu-switch.tsx.backup` (the old broken one)

### Step 5: Rebuild the frontend
```bash
cd /root/the11
docker-compose build frontend
```
This will take 1-2 minutes. You'll see lots of output. Wait for "Successfully tagged..."

### Step 6: Restart the app
```bash
docker-compose up -d frontend
```
This should say "Recreating the11_frontend_1 ... done"

### Step 7: Test it!
Go to: http://srv848342.hstgr.cloud:3333
1. Type some text
2. Highlight it
3. Click "Ask AI"
4. **THE POPUP SHOULD STAY OPEN NOW!** 🎉

---

## 🤔 VS CODE vs VPS - The Difference

### What You're Used To (VS Code):
```
1. Open folder in VS Code
2. See all files in sidebar
3. Edit file
4. Press F5 or npm run dev
5. See changes immediately
```

### What We Have Now (VPS + Docker):
```
1. SSH into server (you're inside the computer remotely)
2. Files are at /root/the11/
3. Edit files with nano, vim, or AI tools
4. Run docker-compose build
5. Run docker-compose up -d
6. See changes in browser
```

**You CAN use VS Code though!**

Install "Remote - SSH" extension in VS Code:
1. Click green button bottom-left in VS Code
2. Choose "Connect to Host"
3. Enter: `root@srv848342.hstgr.cloud`
4. Enter your VPS password
5. Open folder: `/root/the11`
6. NOW YOU SEE ALL FILES LIKE NORMAL! 🎉

---

## 🚨 COMMON MISTAKES

### ❌ DON'T DO THIS:
```bash
# Editing files inside the container (changes lost!)
docker exec -it the11_frontend_1 bash
nano some-file.tsx  # ← This disappears on rebuild!
```

### ✅ DO THIS INSTEAD:
```bash
# Edit source files, then rebuild
nano /root/the11/novel-editor-demo/apps/web/components/tailwind/slash-command.tsx
docker-compose build frontend
docker-compose up -d frontend
```

---

## 📊 QUICK REFERENCE

### Where Is...?

| What | Path |
|------|------|
| Your GitHub repo | `/root/the11/` |
| React components | `/root/the11/novel-editor-demo/apps/web/components/` |
| Slash commands | `/root/the11/novel-editor-demo/apps/web/components/tailwind/slash-command.tsx` |
| AI features | `/root/the11/novel-editor-demo/apps/web/components/tailwind/generative/` |
| Colors/styling | `/root/the11/novel-editor-demo/apps/web/styles/globals.css` |
| PDF code | `/root/the11/pdf-service/main.py` |
| Docker config | `/root/the11/docker-compose.yml` |
| Environment vars | `/root/the11/.env` |

### Common Commands

| Task | Command |
|------|---------|
| Go to project | `cd /root/the11` |
| Edit a file | `nano path/to/file.tsx` |
| See file contents | `cat path/to/file.tsx` |
| Rebuild frontend | `docker-compose build frontend` |
| Restart app | `docker-compose up -d` |
| See logs | `docker-compose logs -f frontend` |
| Check if running | `docker-compose ps` |

---

## 🎓 NEXT STEPS

1. **Try the fix** (follow Step 1-7 above)
2. **Test that it works**
3. **Commit to git**: `git add -A && git commit -m "Fix Ask AI popup"`
4. **Optional**: Set up VS Code Remote SSH for easier editing

---

**Want me to run the fix commands for you right now?** Just say "yes do it" and I'll execute all steps! 🚀
