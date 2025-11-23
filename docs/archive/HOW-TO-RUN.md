# 🚀 Social Garden SOW Generator - How to Run

## Quick Start (Recommended)

From `/root/the11`:

```bash
./dev.sh
```

That's it! This starts the entire application stack.

---

## 🌐 Access the App

Once running, open your browser:

**Frontend:** http://localhost:3333 (Local development)

The app includes:
- ✅ Novel editor with Three.js visualization
- ✅ Sidebar with folders and SOWs  
- ✅ AI chat sidebar with The Architect agent
- ✅ Dashboard view for analytics
- ✅ Knowledge base view

---

## 📊 What Gets Started

When you run `./dev.sh`:

| Service | Port | Status |
|---------|------|--------|
| Frontend (Next.js) | 3333 | http://localhost:3333 |
| Backend (FastAPI) | 8000 | http://localhost:8000 |
| MySQL Database | 3306 | localhost:3306 (automatic) |
| AnythingLLM | 443 | ahmad-anything-llm.840tjq.easypanel.host |

---

## � Manual Start (If Needed)

### Terminal 1: Frontend
```bash
cd /root/the11/novel-editor-demo/apps/web
npm run dev
```

Expected: `▲ Next.js 15.1.4 - Local: http://localhost:3333`

### Terminal 2: Backend
```bash
cd /root/the11/pdf-service
python main.py
```

Expected: `INFO: Application startup complete - Uvicorn running on http://127.0.0.1:8000`

---

## ✅ Verify Everything Works

### Check Frontend
```bash
curl http://localhost:3333
```

### Check Backend API
```bash
curl http://localhost:8000/api/agents
```

### Check Database
```bash
mysql -u sg_sow_user -p -e "SELECT * FROM folders;" socialgarden_sow
```

### Check AnythingLLM
```bash
curl -H "Authorization: Bearer 0G0WTZ3-6ZX4D20-H35VBRG-9059WPA" \
  https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspaces
```
- **Port:** 3333
- **Location:** `/root/the11/novel-editor-demo/apps/web`
- **Status:** ✅ Running
- **Database:** MySQL (168.231.115.219:3306)
- **AnythingLLM:** https://ahmad-anything-llm.840tjq.easypanel.host

### PDF Service (Optional)
- **Port:** 8000
- **Location:** `/root/the11/pdf-service`
- **Status:** ⚠️ Needs dependencies
- **To install:**
  ```bash
  cd /root/the11/pdf-service
  pip3 install fastapi uvicorn weasyprint jinja2 pydantic
  python3 main.py &
  ```

## 📁 Key Locations

- **App Code:** `/root/the11/novel-editor-demo/apps/web`
- **Database Schema:** `/root/the11/database-schema.sql`
- **PDF Service:** `/root/the11/pdf-service`
- **Logs:** `/tmp/nextjs.log`

## 🎯 Features

### Left Sidebar - 2 Sections

**ACTIONS** (Top, Dark Green):
- 🎯 Dashboard - Opens master SOW dashboard
- 💡 Ask AI - Opens AI chat for current SOW
- 🔗 Share - Generates & copies shareable link
- 📄 Export PDF - Downloads SOW as PDF
- 📊 Export Excel - Downloads pricing as Excel

**DOCUMENTS** (Bottom):
- All folders and SOWs
- Drag & drop to organize
- Rename/Delete always visible

### Right Sidebar - AI Chat
- Multiple AI agents
- Streaming responses
- Insert SOW directly to editor

## 🔥 Recent Changes

1. ✅ **AI Insert to Editor** - Click "📝 Insert to Editor" on AI responses to add content with interactive pricing tables
2. ✅ **Debug Logging** - Console shows which AI model/provider is being used
3. ✅ **Sidebar Redesigned** - All actions moved to left sidebar
4. ✅ **Share Simplified** - One click to copy link
5. ✅ **Database Persistence** - Folders saved to MySQL
6. ✅ **Roles Auto-populate** - AI-generated roles match dropdown
7. ✅ **PDF Header Fixed** - Removed duplicate "Social Garden" text

## 🤖 Using the AI Chat

1. Click the **AI** button (bottom right)
2. Select **"The Architect (SOW Generator)"** agent
3. Ask for a complete SOW, e.g.:
   - "Create a HubSpot implementation SOW for $50k budget"
   - "Generate an email nurture program SOW"
   - "Create a retainer agreement for monthly support"
4. Wait for the AI to generate a complete SOW with pricing table
5. Click **"📝 Insert to Editor"** button on the AI response
6. The SOW will be inserted with **interactive pricing tables** automatically!

**Important:** If the SOW looks incomplete, ask the AI to "regenerate a complete SOW with all phases and pricing table"

## ⚠️ Troubleshooting

### Port already in use
```bash
# Kill existing processes
lsof -ti:3333 | xargs kill -9
# Then restart
./dev.sh
```

### App not loading
```bash
# Check logs
tail -f /tmp/nextjs.log
# Look for compilation errors
```

### Database errors
```bash
# Test connection
mysql -h 168.231.115.219 -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -e "SHOW TABLES;"
```

### Changes not showing
```bash
# Hard restart
kill $(ps aux | grep "PORT=3005" | grep -v grep | awk '{print $2}')
bash /root/the11/start-all.sh
# Wait 15 seconds for compilation
# Hard refresh browser: Ctrl+Shift+R
```

## 🎉 That's It!

Your app should now be running at:
- **Local:** http://localhost:3333
- **Production:** http://168.231.115.219:3333

Need help? Check the logs: `tail -f /tmp/nextjs.log`
