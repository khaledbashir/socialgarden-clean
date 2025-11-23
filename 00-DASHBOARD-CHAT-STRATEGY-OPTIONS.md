# Dashboard Chat Strategy: Three Options

## Current Situation
You asked: *"Should we chat with the workspace on AnythingLLM or create a SQL connector through the AnythingLLM data connector?"*

After researching AnythingLLM documentation, here's what I found:
- ❌ **No native SQL/database connector exists** in AnythingLLM
- ✅ **Custom Agent Skills** can be built to query MySQL directly (NodeJS-based)
- ✅ **Workspace embeddings** already implemented (sow-master-dashboard)

---

## Option 1: Workspace-Only (Current Implementation)

### How It Works
- SOWs are embedded into `sow-master-dashboard` workspace when created/updated
- AI reads from vector database (embeddings) stored in AnythingLLM
- Dashboard stats embedded as context documents

### ✅ Pros
- **Already implemented** - no additional coding needed
- **Works immediately** - just chat with sow-master-dashboard workspace
- **Rich context** - AI can understand full SOW content, deliverables, pricing
- **Simple architecture** - no custom code to maintain

### ❌ Cons
- **Stale data** - only updates when SOWs are embedded (not real-time)
- **Limited analytics** - can't do complex SQL queries like:
  - "Show me top 5 clients by revenue this month"
  - "What's the average SOW value in Q4?"
  - "Which roles are most commonly used?"
- **No aggregations** - can't SUM(), COUNT(), AVG() across all SOWs efficiently

### Best For
- **Content questions**: "Tell me about the Australian Gold Growers SOW"
- **Strategy review**: "What deliverables are in the ABC Corp proposal?"
- **Single SOW analysis**: "Summarize the pricing structure for XYZ Ltd"

---

## Option 2: Custom SQL Agent Skill (Build Required)

### How It Works
- Build a custom NodeJS agent skill that queries MySQL database directly
- Skill uses `mysql2` package to execute SELECT queries
- Returns real-time data from `sows`, `sow_activities`, `sow_comments` tables

### ✅ Pros
- **Real-time data** - queries MySQL directly, always up-to-date
- **Complex analytics** - supports aggregations, filters, JOINs
- **Flexible queries** - can answer questions like:
  - "What's total revenue across all accepted SOWs?"
  - "Show me SOWs created this month"
  - "Which client has the most rejected proposals?"
- **Dashboard-style insights** - replicate dashboard stats via AI chat

### ❌ Cons
- **Custom development required** - need to build the agent skill
- **Maintenance** - must update if database schema changes
- **Limited context** - returns raw data, not full SOW content understanding
- **Docker deployment** - must place in `/storage/plugins/agent-skills/` directory

### Implementation Steps
1. Create `/storage/plugins/agent-skills/mysql-dashboard-query/` folder
2. Build `plugin.json`:
   ```json
   {
     "name": "mysql-dashboard-query",
     "hubId": "mysql-dashboard-query",
     "active": true,
     "schema": "skill-1.0.0",
     "setup_args": {
       "DB_HOST": { "type": "string", "required": true, "input": { "default": "mysql", "type": "text" } },
       "DB_USER": { "type": "string", "required": true, "input": { "default": "root", "type": "text" } },
       "DB_PASS": { "type": "string", "required": true, "input": { "type": "password" } },
       "DB_NAME": { "type": "string", "required": true, "input": { "default": "the11", "type": "text" } }
     },
     "entrypoint": {
       "file": "handler.js",
       "params": {
         "query": {
           "description": "SQL query to execute (SELECT only)",
           "type": "string"
         }
       }
     }
   }
   ```

3. Build `handler.js`:
   ```javascript
   const mysql = require('mysql2/promise');

   module.exports.runtime = {
     handler: async function ({ query }, { config }) {
       try {
         const connection = await mysql.createConnection({
           host: config.DB_HOST,
           user: config.DB_USER,
           password: config.DB_PASS,
           database: config.DB_NAME
         });

         // Security: only allow SELECT queries
         if (!query.trim().toLowerCase().startsWith('select')) {
           return 'Error: Only SELECT queries allowed';
         }

         const [rows] = await connection.execute(query);
         await connection.end();

         return JSON.stringify(rows, null, 2);
       } catch (error) {
         return `Error: ${error.message}`;
       }
     }
   };
   ```

4. Install dependencies (in skill folder):
   ```bash
   npm install mysql2
   ```

5. Deploy to AnythingLLM:
   - Copy folder to `/storage/plugins/agent-skills/` in your Docker container
   - Restart AnythingLLM or use hot-reload
   - Enable skill in agent settings

### Best For
- **Real-time analytics**: "What's the current total pipeline value?"
- **Dashboard metrics**: "How many SOWs were created this week?"
- **Trend analysis**: "Show me monthly SOW counts for Q4"
- **Client insights**: "Which clients have the highest average SOW value?"

---

## Option 3: Hybrid Approach (RECOMMENDED)

### How It Works
- **Use workspace** for SOW content understanding
- **Use custom SQL skill** for real-time analytics/metrics
- Agent automatically chooses the right tool based on question

### ✅ Pros
- **Best of both worlds** - content understanding + real-time data
- **Flexible** - handles both content and analytics questions
- **Comprehensive** - can answer ANY dashboard-related question
- **Smart routing** - agent picks the right data source

### Example Queries
| Question | Tool Used | Why |
|----------|-----------|-----|
| "Summarize the ABC Corp SOW" | Workspace | Needs full content |
| "What's total revenue?" | SQL Skill | Needs SUM() aggregation |
| "Show deliverables in latest SOW" | Workspace | Needs content parsing |
| "How many SOWs this month?" | SQL Skill | Needs COUNT() with date filter |

### Implementation
1. Keep current workspace embeddings (no changes)
2. Build custom SQL agent skill (see Option 2 steps)
3. Enable both in agent settings
4. Agent automatically routes questions to appropriate tool

### Best For
- **Production use** - handles all question types
- **Executive dashboards** - "Show me pipeline and summarize top 3 SOWs"
- **Strategic analysis** - combines quantitative metrics with qualitative content

---

## Decision Matrix

| Criteria | Workspace-Only | Custom SQL Skill | Hybrid |
|----------|---------------|------------------|--------|
| **Development Time** | ✅ Zero (done) | ⚠️ 2-3 hours | ⚠️ 2-3 hours |
| **Real-time Data** | ❌ No | ✅ Yes | ✅ Yes |
| **Content Understanding** | ✅ Excellent | ❌ Limited | ✅ Excellent |
| **Analytics Queries** | ❌ Limited | ✅ Full SQL | ✅ Full SQL |
| **Maintenance** | ✅ Low | ⚠️ Medium | ⚠️ Medium |
| **Use Cases Covered** | 40% | 60% | 100% |

---

## Recommendation

### For Immediate Use
**Go with Option 1 (Workspace-Only)** - it's already working and covers basic content questions.

### For Production/Long-term
**Build Option 3 (Hybrid)** - invest 2-3 hours to build the SQL skill for comprehensive coverage.

### Quick Test
Try these queries on current workspace to see limitations:
- ✅ "Summarize the latest SOW" (will work)
- ❌ "What's the total value of all SOWs?" (won't work - needs SQL)
- ❌ "How many SOWs were created this month?" (won't work - needs SQL)

If those SQL-style questions are important, build the custom skill. If content questions are enough, stick with workspace-only.

---

## Next Steps

### If choosing Workspace-Only
1. No action needed - already implemented
2. Test by chatting with `sow-master-dashboard` workspace
3. Ask content-focused questions

### If choosing Custom SQL Skill or Hybrid
1. Create the agent skill folder structure
2. Write `plugin.json` and `handler.js` (templates above)
3. Install `mysql2` dependency
4. Deploy to `/storage/plugins/agent-skills/` in Docker
5. Configure DB credentials in AnythingLLM settings
6. Test with analytics queries

### Docker Deployment Path
Your EasyPanel setup uses Docker, so the skill should be placed at:
```
/storage/plugins/agent-skills/mysql-dashboard-query/
├── plugin.json
├── handler.js
└── package.json (with mysql2 dependency)
```

Mount this via Docker volume or copy into running container.

---

## Questions to Answer Before Deciding

1. **What questions do you want to ask the dashboard?**
   - Content-focused? → Workspace-Only
   - Metrics-focused? → SQL Skill
   - Both? → Hybrid

2. **How important is real-time data?**
   - Not critical? → Workspace-Only
   - Very important? → SQL Skill or Hybrid

3. **How much development time can you invest?**
   - None? → Workspace-Only
   - 2-3 hours? → Build SQL skill

Let me know which option you prefer and I can help implement it!
