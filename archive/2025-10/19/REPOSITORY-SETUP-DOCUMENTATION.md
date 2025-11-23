# 📋 Repository Setup & Workflow Documentation

**Date:** October 19, 2025
**Project:** Social Garden SOW Generator
**Owner:** Khaled Bashir

---

## 🎯 Overview

This document outlines the dual-repository setup for the Social Garden SOW Generator project. We maintain two separate repositories to ensure production stability while enabling safe experimentation and development.

---

## 🏗️ Repository Structure

### **Production Repository** (`the11`)
- **GitHub URL:** `https://github.com/khaledbashir/the11.git`
- **Purpose:** Production-ready, stable codebase
- **Main Branch:** `main` - Contains all production-ready features
- **Status:** ✅ Production-ready with full feature set

### **Development Repository** (`the11-dev`)
- **GitHub URL:** `https://github.com/khaledbashir/the11-dev.git`
- **Purpose:** Experimental development and feature testing
- **Main Branch:** `production-latest` - Current production-ready branch
- **Status:** ✅ Ready for experimentation and new features

---

## 🔄 Workflow Guide

### **For Production Work:**
```bash
# Switch to main branch
git checkout main

# Set remote to production repo
git remote set-url origin https://github.com/khaledbashir/the11.git

# Push production changes
git push origin main
```

### **For Development/Experimentation:**
```bash
# Switch to dev branch
git checkout production-latest

# Set remote to dev repo
git remote set-url origin https://github.com/khaledbashir/the11-dev.git

# Push experimental changes
git push origin production-latest
```

### **Syncing Updates:**
```bash
# Get latest from production repo
git fetch upstream

# Merge production updates into dev
git merge upstream/main
```

---

## 📁 Remote Configuration

### **Current Remote Setup:**
```
origin    → https://github.com/khaledbashir/the11-dev.git (dev repo)
upstream  → https://github.com/khaledbashir/the11.git (production repo)
```

### **Switching Between Repositories:**
- **Dev Work:** `git remote set-url origin https://github.com/khaledbashir/the11-dev.git`
- **Prod Work:** `git remote set-url origin https://github.com/khaledbashir/the11.git`

---

## 🚀 Project Features (Production Ready)

### **Core Functionality:**
- ✅ **AI-Powered SOW Generator** - Rich text editor with AI writing assistance
- ✅ **Interactive Pricing Tables** - Drag-drop pricing with 82+ pre-loaded roles
- ✅ **Professional PDF Export** - WeasyPrint with Social Garden branding
- ✅ **Client Portal** - Interactive portals for client review/approval
- ✅ **AI Chat Integration** - AnythingLLM chat widgets for client support
- ✅ **Multi-Workspace Architecture** - Organize projects by client/agency
- ✅ **Database Persistence** - Full MySQL database with folders and documents

### **Business Model:**
- **Base Platform:** $1,200 (one-time setup)
- **Monthly Hosting:** $50/month
- **Add-on Services:** Client portals ($800), AI features ($400), etc.
- **White-label Ready:** Custom branding and domains

---

## 🛠️ Development Environment

### **Tech Stack:**
- **Frontend:** Next.js 15, React, Tailwind CSS, TipTap/ProseMirror
- **Backend:** FastAPI (Python) for PDF generation
- **Database:** MySQL
- **AI Integration:** OpenRouter API, AnythingLLM
- **Deployment:** Docker, PM2, VPS hosting

### **Key Dependencies:**
- Next.js 15 with App Router
- Tailwind CSS for styling
- TipTap for rich text editing
- MySQL for data persistence
- OpenRouter for AI models
- AnythingLLM for chat integration

---

## 📊 Current Status

### **Production Repository (`the11`):**
- ✅ **Main Branch:** Contains all production-ready features
- ✅ **Last Updated:** October 19, 2025
- ✅ **Features:** Complete SOW generator with all add-ons
- ✅ **Testing:** Production environment verified

### **Development Repository (`the11-dev`):**
- ✅ **Dev Branch:** `dev/ui-and-features` - Latest development
- ✅ **Last Updated:** October 19, 2025
- ✅ **Features:** All production features + experimental work
- ✅ **Status:** Ready for new feature development

---

## 🔧 Local Development Setup

### **Prerequisites:**
- Node.js 18+
- Python 3.8+
- MySQL 8.0+
- Docker (optional)

### **Quick Start:**
```bash
# Clone the repository
git clone https://github.com/khaledbashir/the11-dev.git
cd the11-dev

# Install dependencies
pnpm install

# Start development
./dev.sh
```

### **Environment Variables:**
```bash
# Database
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=socialgarden_sow

# AI Services
OPENROUTER_API_KEY=your_key
ANYTHINGLLM_URL=your_url
ANYTHINGLLM_API_KEY=your_key
```

---

## 📈 Business Value

### **Target Market:**
- Digital marketing agencies
- Professional services firms
- Consulting companies
- Any business creating proposals/SOWs

### **Key Differentiators:**
- **AI-Powered:** Automated content generation
- **Interactive:** Client portals vs static PDFs
- **White-Label:** Custom branding capability
- **Professional:** High-quality PDF output
- **Scalable:** Multi-workspace architecture

### **Revenue Streams:**
- Platform licensing ($1,200 base)
- Add-on features ($400-$800 each)
- Monthly hosting ($50/month)
- White-label customization (custom pricing)

---

## 🚨 Important Notes

### **Repository Management:**
- **Never push experimental code** to the production repository
- **Always test in dev repo first** before merging to production
- **Keep main branch stable** - only production-ready code
- **Use dev repo for:** new features, experiments, breaking changes

### **Branch Strategy:**
- `main` (production repo) → Stable, production-ready
- `production-latest` (dev repo) → Active development and latest production code
- Feature branches → For specific feature development

### **Backup & Recovery:**
- Production repo serves as stable backup
- Dev repo contains latest experimental work
- Regular commits to both repositories
- Use GitHub for version control and collaboration

---

## 📞 Support & Contact

**Project Owner:** Khaled Bashir
**Business:** Social Garden (socialgarden.com.au)
**Technical Issues:** Create issues in respective repositories
**Business Inquiries:** hello@socialgarden.com.au

---

## 📝 Change Log

### **October 19, 2025:**
- ✅ Established dual-repository setup
- ✅ Merged production-ready features into main branch
- ✅ Configured separate dev environment for experimentation
- ✅ Updated documentation and workflow guides
- ✅ Verified all features working in production

---

**This document should be updated whenever the repository structure or workflow changes.**</content>
<parameter name="filePath">/root/the11/REPOSITORY-SETUP-DOCUMENTATION.md