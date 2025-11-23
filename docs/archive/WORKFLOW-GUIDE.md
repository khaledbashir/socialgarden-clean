# Social Garden SOW Workflow - Complete User Journey

## 🔐 Authentication & Hub (AnythingLLM)

### Login Portal
- **URL:** https://ahmad-anything-llm.840tjq.easypanel.host
- **Users:**
  - **Sam** (Admin) - Can create/manage users
  - Additional users managed by Sam
- **Features:**
  - Single Sign-On for all tools
  - User management dashboard
  - Access control
  - Custom navigation icons

### Navigation
From AnythingLLM, users can access:
1. **SOW Generator** (http://168.231.115.219:3333) - Click custom icon
2. **Workspaces** - AI chat with client SOWs
3. **Admin Panel** - User management (Sam only)

---

## ✍️ SOW Creation (SOW Generator)

### Access
- Users click "SOW Generator" icon in AnythingLLM
- Opens: http://168.231.115.219:3333
- No additional login required (trusted from AnythingLLM)

### Features
1. **Document Creation**
   - Create new SOWs
   - Organize in folders
   - Drag & drop functionality
   - Auto-save to localStorage

2. **AI-Powered Editing**
   - TipTap rich text editor
   - Interactive pricing table (82 roles)
   - GST calculations
   - Professional formatting

3. **Agent Sidebar**
   - "The Architect" - AI assistant for SOW creation
   - Trained on Social Garden knowledge base
   - Helps with pricing, scope, deliverables

4. **Embed to AI**
   - Click "Embed to AI" button
   - Automatically creates client workspace in AnythingLLM
   - Embeds SOW + Social Garden knowledge base
   - Sets client-facing system prompt

5. **Share Portal Link**
   - Click "Share Portal Link" button
   - Copies URL to clipboard: `http://168.231.115.219:3333/portal/sow/{id}`
   - Ready to send to client

6. **Export Options**
   - PDF export (WeasyPrint)
   - CSV export (pricing data)
   - Excel export (pricing breakdown)

### Workflow Banner
```
[1. AnythingLLM Login] → [2. SOW Generator (You are here)] → [3. Share Portal Link]
```

### Navigation Buttons
- **← Back to AI Hub** - Return to AnythingLLM
- **Embed to AI** - Sync SOW to client workspace
- **Ask AI** - Open workspace chat
- **🔗 Share Portal Link** - Copy client portal URL

---

## 👥 Client Portal (Client-Facing)

### Access
- **URL Format:** http://168.231.115.219:3333/portal/sow/{id}
- **No login required** - Public link for clients
- **Mobile responsive** - Works on all devices

### Features

#### 1. Hero Section
- Client name extracted from SOW
- Total investment display (AUD with GST)
- "Social Garden" branding (#0e2e33, #20e28f)
- Accepted/Pending status badge

#### 2. SOW Viewer
- Read-only HTML content
- Professional prose styling
- Interactive pricing table (view-only)
- All deliverables and scope visible

#### 3. Social Garden AI Assistant
- **Embedded chat widget** (no AnythingLLM branding!)
- Rebranded as "Social Garden AI Assistant"
- Sparkles icon, brand colors
- Pre-loaded with:
  - Client's specific SOW(s)
  - Social Garden company knowledge base
  - Case studies, services, leadership

#### 4. Suggested Questions
Built-in prompts clients can click:
- "What's my total investment?"
- "How many hours for social media?"
- "What deliverables are included?"
- "When does the project start?"
- "What other clients has Social Garden worked with?"
- "Tell me about Social Garden's CRM services"

#### 5. Action Buttons
- **Download PDF** - Download signed SOW
- **Accept SOW** - Digital signature (Phase 2)
- **Ask AI** - Toggle chat sidebar

#### 6. Footer
- Social Garden contact info
- 1800 771 396
- marketing@socialgarden.com.au
- Confidentiality notice

---

## 🤖 AI Knowledge Base (Behind the Scenes)

### Automatic Injection
When "Embed to AI" is clicked:

1. **Extract Client Name** from SOW title
2. **Create Workspace** (or use existing)
3. **Embed Social Garden KB** automatically
   - $2B attributed sales track record
   - 70+ employees, 4 countries
   - All services, case studies
   - Leadership bios
   - Technology partnerships
4. **Embed Client SOW** with metadata
5. **Set Client-Facing Prompt** personalized with client name
6. **Generate Embed ID** for portal widget

### Workspace Structure
```
Client: AGGF
├── Social Garden - Company Knowledge Base (auto-injected)
├── SOW: AGGF - HubSpot Integration
├── SOW: AGGF - Social Media Retainer
└── SOW: AGGF - Website Redesign
```

### AI Capabilities
The AI can answer questions about:
- **Client-Specific:** Pricing, hours, deliverables, timelines
- **Company-Wide:** Case studies, services, team, awards
- **Cross-Reference:** Compare across multiple SOWs for same client

---

## 📊 Complete User Journey

### Internal User (Sam - Admin)

```
1. Login to AnythingLLM
   └─ https://ahmad-anything-llm.840tjq.easypanel.host
   
2. Click "SOW Generator" icon
   └─ Opens http://168.231.115.219:3333
   
3. Create new SOW
   ├─ Use AI assistant for help
   ├─ Build pricing table
   └─ Format professionally
   
4. Click "Embed to AI"
   ├─ Workspace created automatically
   ├─ KB embedded
   └─ Toast: "SOW embedded! AGGF's AI assistant ready"
   
5. Click "Share Portal Link"
   ├─ URL copied: http://168.231.115.219:3333/portal/sow/doc_123456
   └─ Toast: "Portal link copied to clipboard!"
   
6. Send link to client via email/Slack
   
7. Optional: Click "← Back to AI Hub"
   └─ Returns to AnythingLLM dashboard
```

### External Client (Receives Link)

```
1. Receive portal link from Social Garden
   └─ http://168.231.115.219:3333/portal/sow/doc_123456
   
2. Open in browser (no login required)
   ├─ See hero with client name + investment
   ├─ Read full SOW content
   └─ View pricing breakdown
   
3. Have questions? Click "Ask AI"
   ├─ Chat sidebar opens
   ├─ "Social Garden AI Assistant" greets them
   └─ Personalized: "Hi! I'm the Social Garden AI assistant for AGGF"
   
4. Ask questions
   ├─ "What's included in the social media hours?"
   ├─ "Can you break down the HubSpot integration?"
   └─ "What other property clients has Social Garden worked with?"
   
5. Get instant AI answers
   ├─ From their specific SOW
   └─ From Social Garden knowledge base
   
6. Ready to proceed? Click "Accept SOW"
   └─ (Phase 2: E-signature capture)
   
7. Download PDF
   └─ Professional branded document
```

---

## 🏗️ Technical Architecture

### Frontend
- **SOW Generator:** Next.js 15.1.4, React 18.2.0, TipTap
- **Port:** 3333 (to avoid Easypanel conflict on 3000)
- **Container:** `the11_frontend_1`

### Backend Services
- **PDF Service:** FastAPI + WeasyPrint, Port 8000
- **Container:** `the11_pdf-service_1`

### AI Integration
- **AnythingLLM Instance:** https://ahmad-anything-llm.840tjq.easypanel.host
- **Embed Widget:** socialgarden-anything-llm.vo0egb.easypanel.host
- **API Key:** (secured in environment)

### Storage
- **Current:** localStorage (React state persistence)
- **Phase 2:** AnythingLLM Documents API (cloud sync)
- **Phase 3:** Full cloud storage with multi-device

### Networking
```
the11_sow-network (bridge)
├─ the11_frontend_1 (ports 3333:3000)
└─ the11_pdf-service_1 (ports 8000:8000)
```

---

## 🎯 Key URLs

### Internal Access
- **AnythingLLM Hub:** https://ahmad-anything-llm.840tjq.easypanel.host
- **SOW Generator:** http://168.231.115.219:3333
- **PDF Service:** http://168.231.115.219:8000/health

### Client Portal
- **Format:** http://168.231.115.219:3333/portal/sow/{docId}
- **Example:** http://168.231.115.219:3333/portal/sow/doc_1729012345

### API Endpoints
- **Generate PDF:** POST /api/generate-pdf
- **AI Chat:** POST /api/chat (agents)

---

## 🔐 Security & Access Control

### Internal Users (AnythingLLM)
- **Authentication Required**
- **User Management:** Sam (admin) creates users
- **Role-Based Access**
- **Session Management**

### SOW Generator
- **Trusted Access:** From AnythingLLM only
- **No public access to editor**
- **localStorage per browser**

### Client Portal
- **Public URLs** (obscure doc IDs)
- **No authentication required**
- **Read-only access**
- **AI chat limited to embedded workspace**

---

## 📈 Future Enhancements

### Phase 2
- [ ] E-signature capture with react-signature-canvas
- [ ] Email notifications on signature
- [ ] Terms & conditions checkbox
- [ ] Signature timestamp and IP logging

### Phase 3
- [ ] Full AnythingLLM storage migration
- [ ] Multi-device sync
- [ ] Real-time collaboration
- [ ] Version history

### Phase 4
- [ ] Client dashboard (multiple SOWs)
- [ ] Progress tracking
- [ ] Milestone approvals
- [ ] Payment integration

---

## 🎨 Brand Guidelines

### Colors
- **Primary:** #0e2e33 (Dark Teal)
- **Accent:** #20e28f (Bright Green)
- **Text:** Slate colors (Tailwind)

### Typography
- **Headings:** Bold, Inter font
- **Body:** Regular, Inter font
- **Monospace:** Code blocks

### Icons
- **Sparkles:** AI features
- **FileText:** Documents
- **Folder:** Organization
- **Edit3:** Rename
- **Trash2:** Delete
- **Download:** Export
- **CheckCircle:** Approval

---

## 📞 Support

### Technical Issues
- Check Docker containers: `docker ps --filter "name=the11"`
- View logs: `docker logs the11_frontend_1`
- Restart: `docker-compose -f docker-compose.prod.yml restart`

### Access Issues
- **AnythingLLM:** Contact Sam (admin)
- **SOW Generator:** Ensure logged into AnythingLLM first
- **Client Portal:** Check doc ID in URL

### Questions
- **Email:** marketing@socialgarden.com.au
- **Phone:** 1800 771 396
- **Website:** socialgarden.com.au

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Status:** Production Ready 🚀
