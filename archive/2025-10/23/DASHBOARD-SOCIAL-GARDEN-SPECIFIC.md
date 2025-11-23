# Social Garden Strategic Dashboard: The RevOps Command Center

**Mission**: Transform SOW generator into Social Garden's Growth Command Center - the single source of truth for HubSpot partnership health, vertical pipeline analysis, and RevOps lifecycle management.

**Date**: October 23, 2025
**Status**: Research Complete, Implementation Ready

---

## 🎯 Social Garden Context (Research-Driven)

### Company Profile
- **Type**: High-level Revenue Operations (RevOps) and Performance Marketing agency
- **Crown Jewel**: HubSpot Diamond Partner (top-tier in Australia)
- **Specialization**: CRM implementations, migrations, marketing automation, managed services
- **Key Verticals**: Property (Mirvac, Simonds Homes), Higher Education (ANU), Finance
- **Business Model**: Align sales, marketing, service to drive measurable revenue growth
- **Core Services**: 
  - CRM Implementation (HubSpot-focused)
  - Marketing Automation
  - RevOps Strategy & Consulting
  - ATL Media & Performance Marketing
  - Managed Services (retainers)

### Strategic Priorities
1. **HubSpot Partnership Growth**: Progress toward Elite tier, increase tech ARR
2. **Vertical Dominance**: Strengthen Property & Education leadership
3. **Service Mix Optimization**: Balance project work vs. recurring revenue (retainers)
4. **Client Lifecycle Management**: Move from one-off projects to ongoing partnerships
5. **RevOps Philosophy**: Break down sales/marketing/success silos

---

## 🚀 Social Garden-Specific Features (HIGH IMPACT)

### Feature 1: HubSpot Partnership Health Widget ⭐⭐⭐⭐⭐

**WHY THIS IS CRITICAL**: Diamond Partner status is their competitive moat. This widget makes the dashboard essential to CEO, Head of Partnerships, AND their HubSpot Channel Manager.

**What to Track**:

1. **HubSpot-Sourced Pipeline**
   - Total value of SOWs where lead source = "HubSpot Referral"
   - Shows ROI of partnership relationship
   - Target: 30% of total pipeline from HubSpot referrals

2. **HubSpot Tech ARR** (Annual Recurring Revenue)
   - Sum of HubSpot licenses sold/managed in all active SOWs
   - Formula: Count "HubSpot Professional" mentions × $800/month × 12
   - Critical for partnership tier progression

3. **Progress to Elite Tier**
   - Current tier requirements vs. actual performance
   - Diamond requires: $X in managed ARR, Y implementations/year
   - Visual progress bar: "73% to Elite Partner Status"

4. **HubSpot Service Mix**
   - Breakdown: Implementation (45%), Migration (20%), Managed Services (35%)
   - Target: Increase recurring Managed Services to 50%

**Implementation**:

```typescript
// /api/dashboard/hubspot-health/route.ts

interface HubSpotMetrics {
  hubspotSourcedPipeline: number;  // Total $ where lead_source = 'HubSpot'
  hubspotTechARR: number;          // Sum of recurring HubSpot licenses
  progressToElite: number;          // % toward next tier
  serviceBreakdown: {
    implementation: number;
    migration: number;
    managedServices: number;
  };
}

async function getHubSpotHealth(): Promise<HubSpotMetrics> {
  // 1. HubSpot-Sourced Pipeline
  const [pipelineResult] = await pool.query(`
    SELECT SUM(total_investment) as hubspotPipeline
    FROM sows 
    WHERE lead_source = 'HubSpot Referral'
    AND status IN ('draft', 'sent', 'viewed')
  `);

  // 2. HubSpot Tech ARR (parse content for HubSpot licenses)
  const [sowsResult] = await pool.query(`
    SELECT content FROM sows WHERE status IN ('accepted', 'sent')
  `);
  
  let techARR = 0;
  sowsResult.forEach(sow => {
    // Parse TipTap JSON for HubSpot Professional/Enterprise mentions
    const hubspotMatches = extractHubSpotLicenses(sow.content);
    techARR += hubspotMatches.reduce((sum, license) => {
      return sum + (license.monthlyFee * 12);
    }, 0);
  });

  // 3. Service Mix (parse content for service types)
  const serviceBreakdown = await pool.query(`
    SELECT 
      SUM(CASE WHEN content LIKE '%Implementation%' THEN total_investment ELSE 0 END) as implementation,
      SUM(CASE WHEN content LIKE '%Migration%' THEN total_investment ELSE 0 END) as migration,
      SUM(CASE WHEN content LIKE '%Managed Services%' OR content LIKE '%Retainer%' THEN total_investment ELSE 0 END) as managedServices
    FROM sows
    WHERE content LIKE '%HubSpot%'
  `);

  // 4. Progress to Elite (hardcoded targets for now)
  const ELITE_TIER_REQUIREMENTS = {
    minARR: 500000,  // $500k annual recurring
    minImplementations: 12
  };
  const progressToElite = Math.min(100, (techARR / ELITE_TIER_REQUIREMENTS.minARR) * 100);

  return {
    hubspotSourcedPipeline: pipelineResult[0]?.hubspotPipeline || 0,
    hubspotTechARR: techARR,
    progressToElite,
    serviceBreakdown: serviceBreakdown[0]
  };
}
```

**UI Component**:

```tsx
<div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-lg p-6 border-2 border-orange-400">
  <div className="flex items-center gap-3 mb-4">
    <img src="/hubspot-logo.svg" alt="HubSpot" className="w-10 h-10" />
    <h2 className="text-2xl font-bold text-orange-800">HubSpot Partnership Health</h2>
  </div>

  <div className="grid grid-cols-2 gap-4 mb-6">
    <div className="bg-white rounded p-4">
      <div className="text-sm text-gray-600">HubSpot-Sourced Pipeline</div>
      <div className="text-3xl font-bold text-orange-600">${hubspotPipeline.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">
        {((hubspotPipeline / totalPipeline) * 100).toFixed(0)}% of total pipeline
      </div>
    </div>

    <div className="bg-white rounded p-4">
      <div className="text-sm text-gray-600">HubSpot Tech ARR</div>
      <div className="text-3xl font-bold text-orange-600">${hubspotARR.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">
        Annual recurring revenue
      </div>
    </div>
  </div>

  <div className="bg-white rounded p-4 mb-4">
    <div className="flex justify-between items-center mb-2">
      <div className="text-sm font-semibold">Progress to Elite Partner</div>
      <div className="text-sm text-orange-600 font-bold">{progressToElite}%</div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div 
        className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500"
        style={{ width: `${progressToElite}%` }}
      ></div>
    </div>
    <div className="text-xs text-gray-500 mt-2">
      ${(500000 - hubspotARR).toLocaleString()} to Elite tier
    </div>
  </div>

  <div className="bg-white rounded p-4">
    <div className="text-sm font-semibold mb-3">Service Mix</div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Implementation</span>
        <span className="font-semibold">{serviceBreakdown.implementation}%</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Migration</span>
        <span className="font-semibold">{serviceBreakdown.migration}%</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Managed Services ⭐</span>
        <span className="font-semibold text-green-600">{serviceBreakdown.managedServices}%</span>
      </div>
    </div>
  </div>
</div>
```

---

### Feature 2: Pipeline by Vertical & Service Line ⭐⭐⭐⭐⭐

**WHY THIS IS CRITICAL**: Social Garden leadership needs to see WHERE the money is coming from (vertical) and WHAT they're selling (service line). This drives hiring, marketing, and strategic planning.

**Key Verticals**:
- Property (Mirvac, Simonds Homes)
- Higher Education (ANU)
- Finance
- Other

**Key Service Lines**:
- CRM Implementation
- Marketing Automation
- RevOps Strategy
- ATL Media (Above-the-line advertising)
- Managed Services (retainers)

**Implementation**:

```typescript
// Add vertical field to sows table
ALTER TABLE sows ADD COLUMN vertical ENUM('Property', 'Higher Education', 'Finance', 'Other') DEFAULT 'Other';
ALTER TABLE sows ADD COLUMN service_line ENUM('CRM Implementation', 'Marketing Automation', 'RevOps Strategy', 'ATL Media', 'Managed Services', 'Other') DEFAULT 'Other';

// API endpoint: /api/dashboard/vertical-analysis/route.ts
async function getVerticalBreakdown() {
  const [verticalData] = await pool.query(`
    SELECT 
      vertical,
      COUNT(*) as sowCount,
      SUM(total_investment) as totalValue,
      SUM(CASE WHEN status = 'accepted' THEN total_investment ELSE 0 END) as wonValue
    FROM sows
    WHERE status IN ('draft', 'sent', 'viewed', 'accepted')
    GROUP BY vertical
    ORDER BY totalValue DESC
  `);

  const [serviceLineData] = await pool.query(`
    SELECT 
      service_line,
      COUNT(*) as sowCount,
      SUM(total_investment) as totalValue,
      AVG(total_investment) as avgDealSize
    FROM sows
    WHERE status IN ('draft', 'sent', 'viewed', 'accepted')
    GROUP BY service_line
    ORDER BY totalValue DESC
  `);

  return { verticalData, serviceLineData };
}
```

**UI Component**:

```tsx
<div className="grid grid-cols-2 gap-6">
  {/* Pipeline by Vertical */}
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-bold mb-4">Pipeline by Vertical</h3>
    <div className="space-y-3">
      {verticalData.map(vertical => (
        <div 
          key={vertical.vertical}
          onClick={() => filterByVertical(vertical.vertical)}
          className="cursor-pointer hover:bg-gray-50 p-3 rounded transition"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold">{vertical.vertical}</span>
            <span className="text-lg font-bold text-green-600">
              ${vertical.totalValue.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${(vertical.totalValue / totalPipeline) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {vertical.sowCount} SOWs • Win rate: {((vertical.wonValue / vertical.totalValue) * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Pipeline by Service Line */}
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-bold mb-4">Pipeline by Service Line</h3>
    <div className="space-y-3">
      {serviceLineData.map(service => (
        <div 
          key={service.service_line}
          onClick={() => filterByService(service.service_line)}
          className="cursor-pointer hover:bg-gray-50 p-3 rounded transition"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold">{service.service_line}</span>
            <span className="text-lg font-bold text-purple-600">
              ${service.totalValue.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${(service.totalValue / totalPipeline) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {service.sowCount} SOWs • Avg deal: ${service.avgDealSize.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Strategic Insight Example**:
```
Pipeline by Vertical:
🏢 Property:         $1,240,000 (62% of pipeline, 8 SOWs, 75% win rate)
🎓 Higher Education:   $485,000 (24% of pipeline, 5 SOWs, 60% win rate)
💰 Finance:            $220,000 (11% of pipeline, 3 SOWs, 33% win rate)
🔹 Other:               $55,000 (3% of pipeline, 2 SOWs)

Pipeline by Service Line:
🔧 CRM Implementation:     $890,000 (45%, 6 SOWs, avg $148k)
⚙️  Marketing Automation:   $445,000 (22%, 4 SOWs, avg $111k)
📊 RevOps Strategy:         $335,000 (17%, 5 SOWs, avg $67k)
📺 ATL Media:               $220,000 (11%, 3 SOWs, avg $73k)
🔄 Managed Services:        $110,000 (5%, 2 SOWs, avg $55k)

👉 INSIGHT: Property dominates pipeline. CRM Implementation is biggest revenue driver. 
   Managed Services only 5% - opportunity to increase recurring revenue!
```

---

### Feature 3: RevOps Opportunity Radar (AI-Powered) ⭐⭐⭐⭐⭐

**WHY THIS IS CRITICAL**: This embodies Social Garden's RevOps philosophy - breaking down silos between sales, marketing, and success. The tool becomes a proactive lifecycle manager.

**AI Insight Types**:

1. **Cross-Sell Opportunities**
   - "Client 'Mirvac' has Marketing Hub SOW accepted. Opportunity to propose Sales Hub + Service Hub alignment for Q4."
   - "Client 'ANU' engaged for CRM Implementation. Flag for ATL Media upsell (student recruitment campaigns)."

2. **Consolidation Opportunities** (Move to Retainers)
   - "Client 'Simonds Homes' has 3 separate SOWs this year ($45k total). Recommend consolidating to Managed Services retainer ($5k/month)."
   - "4 clients have >2 SOWs this quarter. Retainer conversion could increase ARR by $240k."

3. **Lifecycle Triggers**
   - "SOW 'Mirvac CRM Migration' marked as 'Signed'. [Initiate Handoff] button active."
   - "Client 'ANU' hasn't had engagement in 4 months since last project completed. Flag for check-in call."

4. **Resource Optimization**
   - "3 SOWs require HubSpot Certified Developer. Current team capacity: 2. Consider contractor or new hire."
   - "RevOps Strategy SOWs have 90% win rate vs. 60% overall. Recommend creating dedicated RevOps service package."

**Implementation**:

```typescript
// /api/dashboard/revops-insights/route.ts

interface RevOpsInsight {
  type: 'cross-sell' | 'consolidation' | 'lifecycle' | 'resource';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  actionable: boolean;
  action?: string;  // e.g., "Create retainer proposal", "Initiate handoff"
  clientName?: string;
  sowId?: number;
}

async function generateRevOpsInsights(): Promise<RevOpsInsight[]> {
  const insights: RevOpsInsight[] = [];

  // 1. Cross-sell opportunities (client has Marketing Hub, suggest Sales Hub)
  const [hubClients] = await pool.query(`
    SELECT client_name, GROUP_CONCAT(title) as sows
    FROM sows
    WHERE content LIKE '%Marketing Hub%'
    AND client_name NOT IN (
      SELECT client_name FROM sows WHERE content LIKE '%Sales Hub%'
    )
    GROUP BY client_name
  `);

  hubClients.forEach(client => {
    insights.push({
      type: 'cross-sell',
      severity: 'high',
      title: 'HubSpot Cross-Sell Opportunity',
      message: `Client '${client.client_name}' has Marketing Hub SOW. Opportunity to propose Sales Hub alignment project.`,
      actionable: true,
      action: 'Create Sales Hub proposal',
      clientName: client.client_name
    });
  });

  // 2. Retainer consolidation (3+ SOWs in 6 months)
  const [repeatClients] = await pool.query(`
    SELECT 
      client_name,
      COUNT(*) as sowCount,
      SUM(total_investment) as totalValue
    FROM sows
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY client_name
    HAVING sowCount >= 3
  `);

  repeatClients.forEach(client => {
    const monthlyRetainer = Math.round(client.totalValue / 6);
    insights.push({
      type: 'consolidation',
      severity: 'high',
      title: 'Retainer Conversion Opportunity',
      message: `Client '${client.client_name}' has ${client.sowCount} SOWs in 6 months ($${client.totalValue.toLocaleString()}). Recommend Managed Services retainer at $${monthlyRetainer.toLocaleString()}/month.`,
      actionable: true,
      action: 'Create retainer proposal',
      clientName: client.client_name
    });
  });

  // 3. Lifecycle triggers (signed SOWs ready for handoff)
  const [signedSOWs] = await pool.query(`
    SELECT id, title, client_name
    FROM sows
    WHERE status = 'accepted'
    AND id NOT IN (SELECT sow_id FROM sow_activities WHERE action = 'handoff_initiated')
  `);

  signedSOWs.forEach(sow => {
    insights.push({
      type: 'lifecycle',
      severity: 'high',
      title: 'Project Handoff Ready',
      message: `SOW '${sow.title}' for ${sow.client_name} is signed. Ready to initiate delivery handoff.`,
      actionable: true,
      action: 'Initiate handoff',
      sowId: sow.id,
      clientName: sow.client_name
    });
  });

  // 4. Resource bottlenecks (HubSpot Developer hours)
  const [resourceAnalysis] = await pool.query(`
    SELECT 
      SUM(JSON_EXTRACT(content, '$..hours')) as totalHours
    FROM sows
    WHERE content LIKE '%HubSpot Certified Developer%'
    AND status IN ('accepted', 'sent')
  `);

  const hubspotDevHours = resourceAnalysis[0]?.totalHours || 0;
  const TEAM_CAPACITY = 320; // 2 devs × 160 hours/month

  if (hubspotDevHours > TEAM_CAPACITY * 0.8) {
    insights.push({
      type: 'resource',
      severity: 'high',
      title: 'Resource Bottleneck Warning',
      message: `${hubspotDevHours} HubSpot Developer hours committed across active SOWs. Team capacity: ${TEAM_CAPACITY} hours/month. Consider contractor or new hire.`,
      actionable: false
    });
  }

  return insights;
}
```

**UI Component**:

```tsx
<div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-400">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <span className="text-3xl">🎯</span>
      <h2 className="text-2xl font-bold">RevOps Opportunity Radar</h2>
    </div>
    <button onClick={refreshInsights} className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
      Refresh
    </button>
  </div>

  {insights.length === 0 ? (
    <div className="text-center text-gray-500 py-8">
      ✅ All clear! No opportunities or warnings at this time.
    </div>
  ) : (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <div 
          key={idx}
          className={`p-4 rounded-lg border-l-4 ${insightStyles[insight.type]} transition hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{insightIcons[insight.type]}</span>
                <h3 className="font-bold text-gray-900">{insight.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${severityColors[insight.severity]}`}>
                  {insight.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{insight.message}</p>
              {insight.clientName && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Client: {insight.clientName}
                </span>
              )}
            </div>
            {insight.actionable && (
              <button 
                onClick={() => handleInsightAction(insight)}
                className="ml-4 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 whitespace-nowrap"
              >
                {insight.action} →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* Styles */}
const insightStyles = {
  'cross-sell': 'bg-green-50 border-green-500',
  'consolidation': 'bg-blue-50 border-blue-500',
  'lifecycle': 'bg-orange-50 border-orange-500',
  'resource': 'bg-red-50 border-red-500'
};

const insightIcons = {
  'cross-sell': '💰',
  'consolidation': '🔄',
  'lifecycle': '🚀',
  'resource': '⚠️'
};

const severityColors = {
  'low': 'bg-gray-200 text-gray-700',
  'medium': 'bg-yellow-200 text-yellow-800',
  'high': 'bg-red-200 text-red-800'
};
```

---

### Feature 4: Date Range Filtering (Critical UX)

**What**: Global date range selector at top of dashboard

**Options**:
- This Week
- This Month
- This Quarter
- Last Quarter
- This Year
- Custom Range

**Why**: Leadership needs to compare Q3 vs Q4 pipeline, analyze seasonal trends, prepare board reports.

**Implementation**:

```tsx
<div className="mb-6 flex items-center gap-4">
  <label className="font-semibold">Time Period:</label>
  <select 
    value={dateRange}
    onChange={(e) => setDateRange(e.target.value)}
    className="px-4 py-2 border rounded-lg"
  >
    <option value="this-week">This Week</option>
    <option value="this-month">This Month</option>
    <option value="this-quarter">This Quarter (Q4 2025)</option>
    <option value="last-quarter">Last Quarter (Q3 2025)</option>
    <option value="this-year">This Year (2025)</option>
    <option value="custom">Custom Range...</option>
  </select>

  {dateRange === 'custom' && (
    <div className="flex gap-2">
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <span>to</span>
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
    </div>
  )}

  <button onClick={applyDateFilter} className="bg-blue-600 text-white px-4 py-2 rounded">
    Apply
  </button>
</div>
```

---

## 📊 Complete Dashboard Layout (Social Garden Version)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 RevOps Opportunity Radar                                    [Refresh]    │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 💰 Cross-Sell: Mirvac has Marketing Hub - propose Sales Hub alignment      │
│                [Create Sales Hub Proposal →]                                │
│                                                                             │
│ 🔄 Retainer: Simonds Homes has 3 SOWs ($45k) - suggest $7.5k/month retainer│
│              [Create Retainer Proposal →]                                   │
│                                                                             │
│ 🚀 Handoff: ANU CRM Migration is signed - ready for delivery handoff       │
│             [Initiate Handoff →]                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 🔶 HubSpot Partnership Health                     [Diamond Partner Status]│
│ ───────────────────────────────────────────────────────────────────────── │
│  HubSpot-Sourced Pipeline        │  HubSpot Tech ARR                      │
│  $547,000 AUD (27% of pipeline)  │  $385,000 AUD/year                     │
│                                                                            │
│  Progress to Elite Partner: ████████████░░░░ 73% ($115k to Elite)         │
│                                                                            │
│  Service Mix: Implementation 45% | Migration 20% | Managed Services 35%   │
└───────────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Value  │ Active SOWs  │ This Quarter │ Win Rate     │ Avg Deal     │
│ $2,045,000 ▲ │ 18 proposals │ 12 new SOWs  │ 68% ▲        │ $113,611     │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ Time Period: [This Quarter ▼]  [This Week] [This Month] [This Year]      │
└───────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────────────┐
│ 📊 Pipeline by Vertical         │ 🔧 Pipeline by Service Line             │
│ ─────────────────────────────── │ ─────────────────────────────────────── │
│ 🏢 Property                      │ 🔧 CRM Implementation                   │
│    $1,240,000  ████████████ 62% │    $890,000  ████████████ 45%          │
│    8 SOWs • 75% win rate         │    6 SOWs • Avg $148k                   │
│                                  │                                         │
│ 🎓 Higher Education              │ ⚙️ Marketing Automation                 │
│    $485,000  ████░ 24%           │    $445,000  ████░ 22%                  │
│    5 SOWs • 60% win rate         │    4 SOWs • Avg $111k                   │
│                                  │                                         │
│ 💰 Finance                       │ 📊 RevOps Strategy                      │
│    $220,000  ██░ 11%             │    $335,000  ███░ 17%                   │
│    3 SOWs • 33% win rate         │    5 SOWs • Avg $67k                    │
└─────────────────────────────────┴─────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ Filter: [All] [Draft] [Sent] [Viewed] [Signed] [Lost]                    │
│ Sort:   [Newest] [Highest Value] [Client Name] [Vertical]                │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 🟢 Mirvac Property Marketing Hub - Property         $245,000  Oct 20      │
│ 🔵 ANU Student Recruitment CRM - Higher Ed          $125,000  Oct 18      │
│ 🟡 Simonds Homes Website - Property (Draft)          $89,000  Oct 15      │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Implementation Priority (Social Garden-Specific)

### Phase 1A: Foundation (IMMEDIATE - 3 hours)
1. ✅ Fix Total Value widget (already working, just need data)
2. ✅ Add `vertical` and `service_line` columns to database
3. ✅ Create dropdown in SOW creation form to tag vertical + service line
4. ✅ Create `/api/dashboard/vertical-analysis` endpoint
5. ✅ Build vertical/service line widgets

### Phase 1B: HubSpot Partnership (CRITICAL - 4 hours)
1. ✅ Add `lead_source` column to sows table
2. ✅ Create function to parse HubSpot licenses from content
3. ✅ Create `/api/dashboard/hubspot-health` endpoint
4. ✅ Build HubSpot Partnership Health widget
5. ✅ Integrate Elite tier progress bar

### Phase 2: RevOps Radar (HIGH IMPACT - 6 hours)
1. ✅ Create `/api/dashboard/revops-insights` endpoint
2. ✅ Implement 4 insight types (cross-sell, consolidation, lifecycle, resource)
3. ✅ Build RevOps Opportunity Radar UI
4. ✅ Add action buttons (Create proposal, Initiate handoff)
5. ✅ Test with real SOW data

### Phase 3: Polish (2 hours)
1. ✅ Add date range filtering
2. ✅ Clickable widgets → filter SOW list
3. ✅ Status dots in SOW list
4. ✅ Mobile-responsive layout

---

## 🚀 Database Schema Changes

```sql
-- Add Social Garden-specific fields
ALTER TABLE sows ADD COLUMN vertical ENUM('Property', 'Higher Education', 'Finance', 'Other') DEFAULT 'Other';
ALTER TABLE sows ADD COLUMN service_line ENUM('CRM Implementation', 'Marketing Automation', 'RevOps Strategy', 'ATL Media', 'Managed Services', 'Other') DEFAULT 'Other';
ALTER TABLE sows ADD COLUMN lead_source VARCHAR(255) DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX idx_vertical ON sows(vertical);
CREATE INDEX idx_service_line ON sows(service_line);
CREATE INDEX idx_status_created ON sows(status, created_at);
```

---

## 📈 Success Metrics (Social Garden-Specific)

1. **HubSpot Partnership Growth**
   - Target: Increase HubSpot-sourced pipeline from 27% to 40%
   - Target: Grow HubSpot Tech ARR by 25% per quarter
   - Target: Achieve Elite Partner status within 12 months

2. **Vertical Dominance**
   - Target: Property maintains >60% of pipeline
   - Target: Higher Education grows to 30% (currently 24%)
   - Target: Win rate in Property vertical >75%

3. **Service Mix Optimization**
   - Target: Managed Services grows from 5% to 25% of pipeline
   - Target: 50% of repeat clients convert to retainers
   - Target: Average deal size increases by 15%

4. **RevOps Efficiency**
   - Target: 90% of insights actioned within 7 days
   - Target: Handoff time reduced from 5 days to 1 day
   - Target: Resource bottlenecks identified 30 days in advance

---

## 🎯 Next Steps

**READY TO START**: Say "START SOCIAL GARDEN PHASE 1A" and I'll:

1. Add database columns (vertical, service_line, lead_source)
2. Create vertical analysis API endpoint
3. Build vertical/service line widgets
4. Deploy and test with real data

**Expected Time**: 3 hours
**Expected Outcome**: Dashboard shows Property ($1.2M), Education ($485k), Finance ($220k) breakdown

---

**The Transformation**: From "SOW generator" → "Social Garden Growth Command Center"

This becomes the ONLY tool that answers:
- "How's our HubSpot partnership performing?" ✅
- "Which vertical is strongest this quarter?" ✅
- "Who should we upsell to retainers?" ✅
- "Where are our resource bottlenecks?" ✅
- "What's our pipeline health?" ✅

**That's how you create a tool nobody can live without.**
