# Social Garden Development Shortcuts Guide

## 🚀 Quick Start

This guide shows you all the shortcuts available for your Social Garden project. These make development much faster and easier.

## 📋 Setup

**If you haven't set up the shortcuts yet:**

```bash
# Run the setup script
./setup-shortcuts.sh

# Or manually add to your shell
source ~/.bashrc
```

**Test it works:**
```bash
dev
```
You should see your development server start.

## 🎯 Available Shortcuts

### Development Commands

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `dev` | Start development server | `dev` → Starts Next.js on port 3001 |
| `build` | Build for production | `build` → Creates optimized build |
| `test` | Run tests | `test` → Runs test suite |
| `lint` | Check code quality | `lint` → Shows code issues |

### Database Commands

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `db` | Connect to database | `db` → Opens MySQL shell |
| `db-status` | Check database health | `db-status` → Shows current DB and table count |

**What to expect with `db`:**
- Prompts for password (use: `sg_sow_2025_SecurePass!`)
- Shows `mysql>` prompt
- Type `SHOW TABLES;` to see tables
- Type `exit;` to quit

### Navigation Commands

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `cd-project` | Go to project root | `cd-project` → Takes you to `/root/the11-dev-clean` |
| `cd-frontend` | Go to frontend | `cd-frontend` → Takes you to frontend directory |
| `cd-backend` | Go to backend | `cd-backend` → Takes you to backend directory |
| `cd-db` | Go to database | `cd-db` → Takes you to database directory |

### Status & Monitoring

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `status` | Check system status | `status` → Shows if services are running |
| `logs` | View server logs | `logs` → Shows live server output |
| `health` | Full system check | `health` → Comprehensive health report |

### Maintenance Commands

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `restart` | Clean restart | `restart` → Cleans cache and restarts dev server |
| `deploy` | Deploy to production | `deploy` → Runs deployment script |
| `backup` | Backup database | `backup` → Creates database backup |

### Git Commands

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `gs` | Git status | `gs` → Shows changed files |
| `ga` | Git add all | `ga` → Stages all changes |
| `gc` | Git commit | `gc "fixed bug"` → Commits with message |
| `gp` | Git push | `gp` → Pushes to remote |
| `gl` | Git log | `gl` → Shows last 10 commits |

### File Editing

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `edit-config` | Edit config | `edit-config` → Opens .env.local in nano |
| `edit-db` | Edit database | `edit-db` → Opens init.sql in nano |

### Utilities

| Shortcut | What it does | Example |
|----------|-------------|---------|
| `cls` | Clear screen | `cls` → Clears terminal |
| `ll` | List files | `ll` → Shows detailed file list |
| `..` | Go up one dir | `..` → cd .. |
| `...` | Go up two dirs | `...` → cd ../.. |

## 💡 Common Workflows

### Starting Development
```bash
dev          # Start the server
# Server starts on http://localhost:3001
```

### Checking Database
```bash
db-status    # See if DB is connected
db           # Open MySQL shell
# In MySQL: SELECT * FROM sows LIMIT 5;
```

### Making Changes
```bash
gs           # Check what changed
ga           # Stage all changes
gc "added new feature"  # Commit
gp           # Push to GitHub
```

### Troubleshooting
```bash
status       # Check if everything is running
logs         # See server errors
restart      # Clean restart if issues
```

## 🔧 Troubleshooting

**Shortcuts not working?**
```bash
source ~/.bashrc  # Reload configuration
```

**Command not found?**
- Make sure you're in a new terminal
- Or run: `source ~/.bashrc`

**Database connection fails?**
- Check if MySQL is running: `sudo service mysql status`
- Verify password in the alias

**Permission denied?**
- Some scripts need: `chmod +x filename.sh`

## 📝 Adding More Shortcuts

Want to add your own shortcuts? Edit `~/.bashrc`:

```bash
nano ~/.bashrc
# Add: alias myshortcut="command here"
source ~/.bashrc
```

## 🎯 Most Useful Shortcuts

**Daily use:**
- `dev` - Start working
- `gs` - Check changes
- `db` - Check database
- `status` - System health

**When stuck:**
- `restart` - Clean restart
- `logs` - Debug issues
- `cls` - Clear confusion

Remember: These shortcuts save you typing `cd ~/the11-dev-clean/frontend && pnpm dev` every time! 🚀