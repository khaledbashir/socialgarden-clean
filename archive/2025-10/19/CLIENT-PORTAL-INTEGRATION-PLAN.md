# 🚀 Client Portal Integration Plan

## Current State Analysis

### ✅ What's Working (Novel Editor - Port 3333)
- **Drag-and-drop pricing table** with 82 roles
- **Professional PDF export** with Social Garden branding (#0e2e33)
- **Dark theme support** throughout
- **AI-powered writing assistant** for SOW generation
- **Real-time editing** with TipTap/ProseMirror
- **Automatic calculations** (subtotals, GST, discounts)

### 🔧 What Needs Integration (Client Portal Concept)
- **Public SOW viewing** (read-only for clients)
- **Comment system** on SOW sections
- **Digital acceptance** with e-signatures
- **Read receipts** and notifications
- **Client-facing landing pages**

## 🎯 Integration Strategy

### Phase 1: Fix & Merge (This Session)
1. **Fix syntax errors** in `/root/the11/app/` files
2. **Create dual-mode system**:
   - `/` → Novel Editor (agency internal use)
   - `/portal/sow/:id` → Client Portal (public viewing)
3. **Share components** between editor and portal
4. **Add read-only mode** to existing SOW viewer

### Phase 2: MVP Features (Your Vision)
1. **Beautiful SOW Landing Page** ✨
   - Use existing SOW components in read-only mode
   - Add hero section with project details
   - Add "Accept" / "Request Changes" / "Download PDF" buttons
   
2. **Comment System** 💬
   - Simple threaded comments on each section
   - Store in MySQL database
   - Email notifications via SendGrid/Mailgun
   
3. **Digital Acceptance** ✍️
   - E-signature canvas (react-signature-canvas)
   - Terms checkbox
   - Status tracking (Draft → Sent → Accepted)
   
4. **Real-Time Notifications** 🔔
   - Read receipts when client opens SOW
   - Activity feed showing client engagement
   - Expiration countdown

## 🛠️ Technical Implementation

### Architecture
```
/root/the11/
├── novel-editor-demo/        # Existing SOW editor (port 3333)
│   ├── apps/web/             # Internal agency tool
│   └── packages/             # Shared components
├── client-portal/            # NEW: Client-facing portal
│   ├── app/
│   │   ├── portal/
│   │   │   └── sow/[id]/     # Public SOW viewer
│   │   ├── api/
│   │   │   ├── sow/          # SOW fetching
│   │   │   ├── comments/     # Comment CRUD
│   │   │   └── signatures/   # E-signature handling
│   └── components/
│       ├── SOWViewer/        # Read-only SOW display
│       ├── CommentThread/    # Comment UI
│       └── SignatureModal/   # E-signature capture
```

### Database Schema (MySQL)
```sql
-- SOW documents
CREATE TABLE sows (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255),
  client_name VARCHAR(255),
  agency_content JSON,           -- Full SOW from Novel editor
  total_investment DECIMAL(10,2),
  status ENUM('draft', 'sent', 'accepted', 'rejected'),
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Comments
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sow_id VARCHAR(36),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  content TEXT,
  section_id VARCHAR(255),
  parent_id INT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (sow_id) REFERENCES sows(id)
);

-- Signatures
CREATE TABLE signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sow_id VARCHAR(36),
  signer_name VARCHAR(255),
  signer_email VARCHAR(255),
  signature_data TEXT,           -- Base64 signature image
  ip_address VARCHAR(45),
  signed_at TIMESTAMP,
  FOREIGN KEY (sow_id) REFERENCES sows(id)
);

-- Activity tracking
CREATE TABLE activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sow_id VARCHAR(36),
  event_type VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP,
  FOREIGN KEY (sow_id) REFERENCES sows(id)
);
```

### API Endpoints
```
POST   /api/sow/create              # Create new SOW from editor
GET    /api/sow/:id                 # Fetch SOW data
POST   /api/sow/:id/comments        # Add comment
GET    /api/sow/:id/comments        # Get all comments
POST   /api/sow/:id/signature       # Submit signature
POST   /api/sow/:id/accept          # Accept SOW
POST   /api/sow/:id/track           # Track view/activity
GET    /api/sow/:id/pdf             # Download PDF
```

## 🎨 UI/UX Flow

### Client Experience
1. **Email notification**: "Your proposal from Social Garden is ready"
2. **Click link**: `https://clientportal.socialgarden.com.au/portal/sow/abc123`
3. **Beautiful landing page**:
   - Hero: Project title, total investment, expiration countdown
   - Full SOW with Social Garden branding
   - Sticky action bar: Accept | Comment | Download PDF
4. **Interactive elements**:
   - Click section → Add comment
   - Click "Accept" → Signature modal → Confirmation
   - Click "PDF" → Downloads branded PDF

### Agency Experience
1. **Create SOW** in Novel Editor (existing tool)
2. **Click "Send to Client"** → Generates unique link
3. **Copy link** or auto-send email
4. **Track engagement** in dashboard:
   - Has client viewed? ✓
   - Comments received: 3
   - Status: Pending acceptance

## 📦 Dependencies to Add
```json
{
  "dependencies": {
    "mysql2": "^3.6.0",           // Database
    "react-signature-canvas": "^1.0.6",  // E-signatures
    "nodemailer": "^6.9.7",       // Email notifications
    "socket.io": "^4.6.0",        // Real-time updates
    "socket.io-client": "^4.6.0",
    "dayjs": "^1.11.10",          // Date handling
    "nanoid": "^5.0.0",           // ID generation
    "bcryptjs": "^2.4.3",         // Optional: Basic auth
    "jsonwebtoken": "^9.0.2"      // Optional: JWT tokens
  }
}
```

## 🚀 Implementation Steps (This Session)

### Step 1: Fix Existing Client Portal Files
- Remove escaped quotes from app/layout.js, app/page.js
- Create proper structure

### Step 2: Create Shared SOW Component
- Extract pricing table from Novel Editor
- Make it render in read-only mode
- Preserve all styling (#0e2e33, dark theme)

### Step 3: Build Public SOW Viewer
- Route: `/portal/sow/[id]`
- Fetch SOW from API
- Display in read-only mode
- Add "Download PDF" button

### Step 4: Add Comment System (Basic)
- Comment box on each section
- Store in JSON file initially (MySQL later)
- Display threaded comments

### Step 5: Add E-Signature Modal
- React Signature Canvas
- "Accept SOW" button → Signature modal
- Store signature as base64
- Update SOW status

## 💰 Cost & Timeline
- **This Session**: Fix + basic integration (1-2 hours)
- **Week 1**: Polish UI, add MySQL, email notifications
- **Week 2**: Real-time features, analytics dashboard
- **Total**: 2 weeks for MVP vs 7 weeks in original plan

## 🎯 Success Metrics
- Client can view beautiful SOW at unique URL ✓
- Client can comment on sections ✓
- Client can digitally accept with signature ✓
- Agency sees read receipts and activity ✓
- PDF download works perfectly ✓

---

**Ready to build this? Let's start by fixing the syntax errors and creating the integration.**
