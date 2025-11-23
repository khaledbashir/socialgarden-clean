# Social Garden SOW Generator - Project Context

## Project Overview
I'm working on the **Social Garden SOW Generator** - a comprehensive web application for creating, managing, and generating Statement of Work (SOW) documents for Social Garden's client projects.

## Infrastructure & Hosting (EasyPanel)
**Everything runs on EasyPanel** - a modern hosting platform with Docker-based deployments and automatic GitHub integration:

- **Frontend**: Next.js 15.1 app at `https://sow.qandu.me`
- **Backend**: FastAPI service (port 8000) for PDF generation using WeasyPrint
- **Database**: MySQL 8.0 database (`socialgarden_sow`)
- **AI Integration**: AnythingLLM workspace for embeddings and chat (`https://ahmad-anything-llm.840tjq.easypanel.host`)
- **Auto-Deploy**: GitHub pushes to `enterprise-grade-ux` branch trigger automatic deployments

## Tech Stack
- **Frontend**: Next.js 15.1, React, TipTap rich editor, Tailwind CSS
- **Backend**: FastAPI (Python), WeasyPrint for PDF generation, Jinja2 templates
- **Database**: MySQL with connection pooling
- **AI**: AnythingLLM for workspace management + OpenRouter for inline AI
- **Deployment**: Docker containers on EasyPanel with GitHub auto-deploy

## Key Features & Workflows

### SOW Creation & Management
- **TipTap Editor**: Rich text editor with custom nodes (editable pricing tables)
- **AI Generation**: Architect system prompt with 82-role rate card
- **Dual Embedding**: SOWs embedded in both client workspace + master dashboard
- **PDF Export**: HTML → PDF via WeasyPrint with Social Garden branding

### AI System Architecture (3 distinct systems)
1. **Dashboard AI**: Query all SOWs (analytics) - `sow-master-dashboard` workspace
2. **Gen AI (Architect)**: Generate new SOWs - per-client workspaces
3. **Inline Editor AI**: Text generation in editor - OpenRouter direct API

### Database Schema
- `sows`: Documents with content, client info, workspace links
- `sow_activities`: Event tracking
- `sow_comments`: Client feedback
- `dashboard_conversations/messages`: Chat persistence (recently added)

## Current Status (October 2025)
- ✅ **Production Ready**: All core features working
- ✅ **Recent Fixes**: SOW generation issues resolved (Scope Assumptions, pricing tables)
- ✅ **QA Complete**: All mandatory requirements met per Sam's specifications
- ✅ **Auto-Deploy**: Working via GitHub → EasyPanel

## Development Workflow
- **Local Dev**: `./dev.sh` starts all services
- **Git Flow**: `enterprise-grade-ux` branch with auto-deploy
- **Testing**: Production testing at `https://sow.qandu.me`
- **Database**: Remote MySQL, use Docker exec for direct access

## Critical Integration Points
- **Workspace Creation**: Auto-creates AnythingLLM workspaces with Architect prompt
- **Document Sync**: SOW changes trigger dual embedding (client + master)
- **PDF Branding**: Base64-embedded Social Garden logo + Plus Jakarta Sans font
- **Rate Card**: 82 roles with AUD pricing, Account Management always at bottom

## Recent Major Changes
- Fixed SOW generation: Scope Assumptions auto-insertion, pricing table replacement
- Added dashboard chat persistence (conversations/messages tables)
- Enhanced Architect prompt with complete rate card integration
- Migrated backend to EasyPanel (from PM2 manual management)

## How to Help
When working on this project, consider:
- EasyPanel auto-deploys from GitHub pushes
- Test on production URL for real validation
- Database changes require schema updates + production migration
- AI prompts are stored in `frontend/lib/knowledge-base.ts`
- PDF styling in `backend/main.py` (WeasyPrint-safe CSS only)

This is a production system handling real client SOWs for Social Garden's business.