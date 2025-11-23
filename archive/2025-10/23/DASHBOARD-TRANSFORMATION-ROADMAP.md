# Dashboard Transformation: From SOW List to Strategic Command Center

**Mission**: Transform the dashboard from a document repository into an indispensable strategic asset for sales and delivery operations.

**Date**: October 23, 2025
**Status**: Foundation Complete, Phase 1 Ready to Implement

---

## 🎯 Strategic Vision

**Current State**: Dashboard shows list of SOWs with basic stats
**Target State**: Intelligent command center providing actionable insights, risk warnings, and pipeline forecasting

**The "Holy Shit" Moment**: Sales manager opens dashboard at 9am, instantly sees:
- $847,500 in active pipeline
- 3 SOWs needing follow-up (sent 7+ days ago)
- AI warning: "Senior Developer overbooked - 340 hours committed across 5 projects"
- Upsell opportunity: "Client X requested 3 landing pages - suggest retainer"

---

## 📊 Current Implementation Status

### ✅ Already Working (Foundation)
1. **Database Schema**:
   - `sows` table with: id, title, client_name, content, total_investment, status, created_at, updated_at
   - Status enum: `draft`, `sent`, `viewed`, `accepted`, `declined`
   - `sow_activities` table for event tracking
   - `service_catalog` table (14 services) for Popular Services analysis

2. **Backend API** (Commit 0554662):
   - `/api/dashboard/stats` endpoint with no-cache headers
   - Recent Activity query (last 5 SOWs)
   - Top Clients query (GROUP BY client_name, SUM total_investment)
   - Active SOWs count (status IN 'draft','sent')
   - This Month count

3. **Auto-Calculation** (Commit 4e61d9f):
   - Every SOW save triggers `extractPricingFromContent()`
   - `total_investment` auto-calculated from pricing table
   - Supports both TipTap tables AND markdown pricing

4. **UI Components**:
   - `enhanced-dashboard.tsx` with widget grid
   - Cache-busting query params
   - Real-time data fetching

### ⚠️ Current Issues
- Total Value widget shows $0.00 (all existing SOWs created before auto-calc feature)
- Top Clients widget shows $0 (same reason)
- Popular Services widget empty (not implemented)
- No filtering by status
- No clickable widgets
- No AI insights

---

## 🚀 Phase 1: Low-Hanging Fruit (NEXT 2 HOURS)

### 1.1 Fix Total Value Widget ⏱️ 15 min

**Current**: Shows $0.00
**Target**: Sum of all `total_investment` WHERE status IN ('draft', 'sent', 'viewed')

**Implementation**:
```typescript
// In /api/dashboard/stats/route.ts
const [totalValueResult] = await pool.query(
  `SELECT SUM(total_investment) as totalValue 
   FROM sows 
   WHERE status IN ('draft', 'sent', 'viewed')`
);
const totalValue = totalValueResult[0]?.totalValue || 0;
```

**Quick Fix for Existing SOWs**: Run migration to recalculate
```sql
-- Trigger recalculation by updating updated_at
UPDATE sows SET updated_at = NOW() WHERE total_investment = 0;
```

---

### 1.2 Fix Top Clients Widget ⏱️ 10 min

**Current**: Shows clients with $0
**Target**: Clients ranked by total SOW value

**Already Implemented** (Commit 0554662), just need to verify data:
```sql
SELECT client_name, 
       SUM(total_investment) as totalValue,
       COUNT(*) as sowCount
FROM sows 
WHERE client_name IS NOT NULL
GROUP BY client_name 
ORDER BY totalValue DESC 
LIMIT 5
```

**Issue**: Existing SOWs have $0 - need recalculation

---

### 1.3 Popular Services Widget ⏱️ 45 min

**What**: Analyze roles across all pricing tables, show top 5 most used

**Data Source**: Parse `content` field (TipTap JSON), extract role names from pricing tables

**Implementation Options**:

**Option A - Quick (Parse from content field)**:
```typescript
// New endpoint: /api/dashboard/popular-services
// 1. Fetch all SOW content
// 2. Parse TipTap JSON for pricingTable nodes
// 3. Extract roles from each table
// 4. Count frequency
// 5. Return top 5
```

**Option B - Better (New table for analytics)**:
```sql
CREATE TABLE sow_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sow_id INT,
  role_name VARCHAR(255),
  hours DECIMAL(10,2),
  rate DECIMAL(10,2),
  total DECIMAL(10,2),
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE
);

-- Populate on save via trigger or app logic
```

**Recommendation**: Start with Option A (no schema changes), migrate to Option B later

---

### 1.4 Clickable Widgets (Filtering) ⏱️ 30 min

**What**: Click widget → filter SOW list

**Implementation**:
```typescript
// In enhanced-dashboard.tsx
const [activeFilter, setActiveFilter] = useState<string | null>(null);

// Widget onClick handlers
<div onClick={() => setActiveFilter('active')} className="cursor-pointer hover:bg-gray-50">
  Total Value: ${totalValue}
</div>

<div onClick={() => setActiveFilter(`client:${clientName}`)} className="cursor-pointer">
  {clientName} - ${clientValue}
</div>

// Filter SOW list
const filteredSOWs = useMemo(() => {
  if (!activeFilter) return documents;
  if (activeFilter === 'active') return documents.filter(d => ['draft','sent','viewed'].includes(d.status));
  if (activeFilter.startsWith('client:')) {
    const clientName = activeFilter.replace('client:', '');
    return documents.filter(d => d.client_name === clientName);
  }
  return documents;
}, [documents, activeFilter]);
```

---

## 🎯 Phase 2: Strategic Enhancements (WEEK 1)

### 2.1 Advanced Status Filtering ⏱️ 2 hours

**What**: Filter bar with status buttons

**Statuses** (Already in DB):
- Draft (yellow dot)
- Sent to Client (blue dot)
- Viewed (purple dot) 
- Accepted/Signed (green dot)
- Declined/Lost (red dot)

**UI Enhancement**:
```tsx
<div className="flex gap-2 mb-4">
  {['all', 'draft', 'sent', 'viewed', 'accepted', 'declined'].map(status => (
    <button 
      onClick={() => setStatusFilter(status)}
      className={`px-4 py-2 rounded ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
    >
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusColors[status]}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
      <span className="ml-2 text-sm">({counts[status]})</span>
    </button>
  ))}
</div>
```

**Status Dots in SOW List**:
```tsx
<div className="flex items-center gap-2">
  <span className={`w-3 h-3 rounded-full ${statusColors[sow.status]}`}></span>
  <h3>{sow.title}</h3>
</div>
```

---

### 2.2 Project Kickoff Automation ⏱️ 4 hours

**Trigger**: Status changed to `accepted`

**Actions**:
1. Show "Initiate Project Handoff" button
2. Generate handoff document (PDF with key details)
3. Email notification to delivery team
4. Optional: Create Jira/Asana project via API

**Implementation**:
```typescript
// New endpoint: /api/sow/[id]/handoff
async function initiateHandoff(sowId: number) {
  // 1. Update status to 'in_delivery'
  await pool.query('UPDATE sows SET status = ? WHERE id = ?', ['in_delivery', sowId]);
  
  // 2. Generate handoff PDF (reuse PDF service)
  const pdfUrl = await generateHandoffPDF(sowId);
  
  // 3. Send email (Resend API)
  await sendEmail({
    to: 'delivery@socialgarden.com.au',
    subject: `New Project Kickoff: ${sow.title}`,
    html: handoffEmailTemplate(sow),
    attachments: [{ filename: 'handoff.pdf', path: pdfUrl }]
  });
  
  // 4. Log activity
  await pool.query('INSERT INTO sow_activities (sow_id, action, details) VALUES (?, ?, ?)', 
    [sowId, 'handoff_initiated', 'Project handed off to delivery team']);
}
```

**UI**:
```tsx
{sow.status === 'accepted' && (
  <button onClick={() => handleHandoff(sow.id)} className="bg-green-600 text-white px-4 py-2 rounded">
    🚀 Initiate Project Handoff
  </button>
)}
```

---

### 2.3 AI-Powered Insights Panel ⏱️ 6 hours

**What**: AI analyzes all SOWs, provides strategic warnings and opportunities

**Types of Insights**:

1. **Risk Warnings**:
   - Low profit margin (total_investment / total_hours < $120/hr)
   - Resource bottlenecks (Senior Developer hours > team capacity)
   - Stale proposals (status='sent', updated_at > 7 days ago)

2. **Opportunities**:
   - Upsell patterns (client has 3+ similar SOWs → suggest retainer)
   - Service bundling (client needs multiple services → package deal)
   - Seasonal trends (Q4 spike in certain services)

3. **Pipeline Health**:
   - Conversion rate (accepted / sent)
   - Average deal size
   - Time to close (sent → accepted)

**Implementation**:

**Option A - Rule-Based (Fast)**:
```typescript
// /api/dashboard/insights/route.ts
async function generateInsights() {
  const insights = [];
  
  // Risk: Low margin
  const lowMargin = await pool.query(`
    SELECT id, title, total_investment, 
           (SELECT SUM(hours) FROM sow_roles WHERE sow_id = sows.id) as total_hours
    FROM sows 
    HAVING (total_investment / total_hours) < 120
  `);
  lowMargin.forEach(sow => {
    insights.push({
      type: 'risk',
      severity: 'high',
      title: 'Low Profit Margin',
      message: `${sow.title} has margin of $${sow.total_investment/sow.total_hours}/hr (target: $150/hr)`,
      sowId: sow.id
    });
  });
  
  // Opportunity: Multiple SOWs for same client
  const repeatClients = await pool.query(`
    SELECT client_name, COUNT(*) as sow_count
    FROM sows 
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 3 MONTH)
    GROUP BY client_name 
    HAVING sow_count >= 3
  `);
  repeatClients.forEach(client => {
    insights.push({
      type: 'opportunity',
      severity: 'medium',
      title: 'Retainer Opportunity',
      message: `${client.client_name} has ${client.sow_count} SOWs in 3 months. Consider proposing a retainer.`,
      clientName: client.client_name
    });
  });
  
  return insights;
}
```

**Option B - AI-Powered (Advanced)**:
```typescript
// Use AnythingLLM master dashboard workspace
async function getAIInsights() {
  const prompt = `Analyze all SOWs in the database and provide:
  1. Risk warnings (low margins, resource conflicts, stale proposals)
  2. Upsell opportunities (retainer suggestions, service bundles)
  3. Pipeline health summary
  
  Return as JSON array of insights.`;
  
  const response = await fetch('http://anythingllm/api/v1/workspace/sow-master-dashboard/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}` },
    body: JSON.stringify({ message: prompt, mode: 'query' })
  });
  
  return parseAIInsights(response);
}
```

**UI Component**:
```tsx
<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h2 className="text-xl font-bold mb-4">🤖 AI Insights</h2>
  {insights.map(insight => (
    <div className={`p-4 rounded mb-3 ${insightColors[insight.type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{insightIcons[insight.type]}</span>
        <div>
          <h3 className="font-semibold">{insight.title}</h3>
          <p className="text-sm mt-1">{insight.message}</p>
          {insight.sowId && (
            <button onClick={() => openSOW(insight.sowId)} className="text-blue-600 text-sm mt-2">
              View SOW →
            </button>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## 📅 Implementation Timeline

### **TODAY (Next 2 Hours) - Phase 1 Quick Wins**
- [ ] Fix Total Value calculation (15 min)
- [ ] Recalculate existing SOWs total_investment (10 min)
- [ ] Implement Popular Services widget (45 min)
- [ ] Add clickable widget filtering (30 min)
- [ ] Deploy + verify (20 min)

### **This Week - Phase 2 Foundation**
- [ ] Status filter bar with dots (2 hours)
- [ ] Project handoff button + email (4 hours)
- [ ] Basic insights (rule-based) (3 hours)
- [ ] Pipeline metrics dashboard (3 hours)

### **Next Week - Phase 2 Advanced**
- [ ] AI-powered insights (6 hours)
- [ ] Email integration (Resend) (2 hours)
- [ ] Export pipeline reports (Excel/PDF) (3 hours)
- [ ] Mobile-responsive redesign (4 hours)

### **Week 3 - Phase 2 Polish**
- [ ] Jira/Asana integration (6 hours)
- [ ] Historical trend analysis (4 hours)
- [ ] Custom report builder (6 hours)
- [ ] User permissions (admin vs sales) (4 hours)

---

## 🎨 UX/UI Enhancements

### Visual Status System
```typescript
const statusColors = {
  draft: 'bg-yellow-400',
  sent: 'bg-blue-400',
  viewed: 'bg-purple-400',
  accepted: 'bg-green-400',
  declined: 'bg-red-400'
};

const statusLabels = {
  draft: 'Draft',
  sent: 'Sent to Client',
  viewed: 'Client Viewed',
  accepted: 'Signed ✅',
  declined: 'Lost ❌'
};
```

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI Insights                                    [Refresh] │
│ ⚠️  Risk: Low margin on "Website Redesign" ($95/hr)        │
│ 💡 Opportunity: Client X - suggest retainer (3 SOWs/month) │
│ ⏰ Follow-up needed: 2 SOWs sent 7+ days ago               │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Value  │ Active SOWs  │ This Month   │ Win Rate     │
│ $847,500 ▲   │ 12 proposals │ 8 new SOWs   │ 67% ▲        │
│ [CLICKABLE]  │ [CLICKABLE]  │ [CLICKABLE]  │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Filter: [All] [Draft] [Sent] [Viewed] [Signed] [Lost]      │
│ Sort:   [Newest] [Highest Value] [Client Name]             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🟢 Website Redesign - Acme Corp          $125,000  Oct 20   │
│ 🔵 HubSpot Implementation - StartupX     $45,000   Oct 18   │
│ 🟡 Brand Refresh - ClientY (Draft)       $32,000   Oct 15   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Metrics

**How we measure "Holy Shit" moment achieved**:

1. **Time Savings**: Sales manager spends <5 min/day checking pipeline (vs 30 min in spreadsheets)
2. **Follow-up Rate**: 90% of "sent" SOWs followed up within 3 days (AI reminders)
3. **Win Rate**: Increase from current baseline by 15% (better proposal management)
4. **Upsell Rate**: 25% of flagged opportunities convert to retainers
5. **User Adoption**: Dashboard opened daily by 100% of sales team
6. **NPS Score**: "How likely are you to recommend this tool?" → 9/10

---

## 🔧 Technical Architecture

### New Database Tables
```sql
-- Analytics table for faster queries
CREATE TABLE dashboard_cache (
  metric_name VARCHAR(100) PRIMARY KEY,
  metric_value JSON,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Role tracking for Popular Services
CREATE TABLE sow_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sow_id INT,
  role_name VARCHAR(255),
  hours DECIMAL(10,2),
  rate DECIMAL(10,2),
  total DECIMAL(10,2),
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE
);

-- Insights log
CREATE TABLE dashboard_insights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  insight_type ENUM('risk', 'opportunity', 'warning'),
  severity ENUM('low', 'medium', 'high'),
  title VARCHAR(255),
  message TEXT,
  sow_id INT NULL,
  client_name VARCHAR(255) NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New API Endpoints
```
GET  /api/dashboard/stats          (existing, enhance)
GET  /api/dashboard/popular-services (NEW)
GET  /api/dashboard/insights       (NEW)
POST /api/sow/[id]/handoff         (NEW)
GET  /api/dashboard/pipeline-metrics (NEW)
POST /api/dashboard/filter         (NEW)
```

### Email Service Integration
```typescript
// Use Resend API for transactional emails
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'The Architect <sow@socialgarden.com.au>',
  to: 'delivery@socialgarden.com.au',
  subject: 'New Project Kickoff',
  react: ProjectHandoffEmail({ sow })
});
```

---

## 🚀 Ready to Start

**First Task**: Fix Total Value widget (15 min)
**Second Task**: Recalculate existing SOWs (10 min)
**Third Task**: Popular Services widget (45 min)

**Expected Outcome**: Within 2 hours, dashboard shows real financial data and service insights.

**Command to run**: Say "START PHASE 1" and I'll begin implementation.
