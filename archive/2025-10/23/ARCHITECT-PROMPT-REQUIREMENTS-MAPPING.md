# THE_ARCHITECT_SYSTEM_PROMPT - Requirements Mapping

**Location:** `frontend/lib/knowledge-base.ts`  
**Export:** `THE_ARCHITECT_SYSTEM_PROMPT`  
**Last Updated:** October 23, 2025 (Commit 34f721c)

---

## Quick Reference: Where Each Requirement Lives

### Requirement 1: Mandatory 3-Role Team Composition
**Section:** 9 - REQUIRED ELEMENTS  
**Line Range:** ~260-275

```typescript
**MANDATORY TEAM COMPOSITION (SAM GOSSAGE REQUIREMENT):**
EVERY scope MUST include these THREE roles in pricing table:
1. **Account Management** (Senior Account Manager or Account Manager) - 6-12 hours minimum
2. **Project Coordination** (Tech - Delivery - Project Coordination) - 3-10 hours minimum
3. **Senior Management** (Head Of Senior Project Management or equivalent "Head Of" role) - 5-15 hours minimum

If these three roles are NOT present, the SOW is INCOMPLETE and INVALID.
Position Account Management at the BOTTOM of the pricing table (just before TOTAL).
```

---

### Requirement 2: Account Manager at BOTTOM
**Section:** 8 - FORMATTING RULES  
**Line Range:** ~254-260

```typescript
**CRITICAL ROLE ORDERING:**
- Account Manager hours MUST ALWAYS appear at the BOTTOM of the role list (just before TOTAL line)
- Standard order: Strategic/Tech roles first → Delivery/Implementation → Project Coordination → Account Management (LAST)
- This applies to all SOW types: Standard Projects, Audits, and Retainers
- Exception: If retainer shows role breakdown by support level (L1, L2, Strategic), Account Management still goes at the bottom after all support tiers
```

---

### Requirement 3: Split Roles (Specialist/Producer)
**Section 1:** 2 - UNDERSTAND SOCIAL GARDEN RATE CARD  
**Line Range:** ~206-215

```typescript
**ROLE ALLOCATION STRATEGY (SAM GOSSAGE METHOD):**
- For production work, ALWAYS split across seniority levels: Use mix of Producer/Specialist roles (lower cost) + Senior roles (oversight)
- AVOID allocating 100% senior hours to routine execution
- Example for HubSpot build: 
  * Architects/Consultants: Strategic design, integration architecture (5-10 hrs)
  * Specialists: Complex workflow setup, data validation (15-20 hrs)
  * Producers: Routine configuration, template build, testing (30-40 hrs)
- Result: Realistic team, correct budget tier, client confidence in execution quality
```

**Section 2:** 9 - REQUIRED ELEMENTS (ROLE ALLOCATION DISCIPLINE)  
**Line Range:** ~276-283

```typescript
**ROLE ALLOCATION DISCIPLINE (SAM GOSSAGE REQUIREMENT):**
- Split production work across SPECIALIST and PRODUCER roles (NOT just Senior roles)
- Example: Instead of "Senior Developer 50hrs", use: "Developer 30hrs + Senior Developer 10hrs + Specialist 10hrs"
- Use granular roles: Email Production, Design, Dev, Copy, Testing (appropriate seniority level for each task)
- Minimize Senior/Head Of roles - use only for strategy, architecture, oversight (NOT routine execution)
- Result: More realistic team composition, better budget allocation, client confidence
```

---

### Requirement 4: Round Totals to Nearest $5,000
**Section:** 4 - DOCUMENT BUDGET ADJUSTMENTS & ROUNDING  
**Line Range:** ~218-230

```typescript
**PRICING ROUNDING (SAM GOSSAGE REQUIREMENT):**
- Round final investment totals to nearest $5,000 (e.g., $45k, $50k, $55k, $60k - NOT $47,310)
- Why: Clients expect clean numbers for budgeting and negotiations
- Method: Calculate exact total, then round up/down to nearest $5k. Adjust hours or roles slightly if needed to match rounded figure
- Document rounding: "Investment rounded to $50k for budget alignment"
- Include optional discount field: "Available discount for annual commitment: -10% = $45k/year"
```

---

### Requirement 5: Include Discount Mechanism
**Section:** 4 - DOCUMENT BUDGET ADJUSTMENTS & ROUNDING  
**Line Range:** ~226-230

```typescript
- Include optional discount field: "Available discount for annual commitment: -10% = $45k/year"
```

**Section:** 9 - PRICING VALIDATION CHECKLIST  
**Line Range:** ~295

```typescript
- ✓ Discount mechanism included if multi-phase or retainer (optional discount field for future negotiations)
```

---

## Full Validation Checklist (Section 9)

**Location:** `frontend/lib/knowledge-base.ts` - PRICING VALIDATION CHECKLIST  
**Line Range:** ~284-296

```typescript
**PRICING VALIDATION CHECKLIST:**
- ✓ Account Management present (bottom of table)
- ✓ Project Coordination present
- ✓ Head Of / Senior Management present
- ✓ Every role in pricing table identified (standard or custom)
- ✓ All hours in retainers add up to stated commitment
- ✓ Rates match role seniority level
- ✓ If ANY custom rate used, footnote explains why
- ✓ Annual projections accurate (monthly × 12 for retainers)
- ✓ **Total investment rounded to nearest $5,000 (e.g., $45k, $50k, $60k - NOT $47,310)**
- ✓ Discount mechanism included if multi-phase or retainer (optional discount field for future negotiations)
```

---

## Mandatory Roles (Data Structure)

**Location:** `frontend/lib/knowledge-base.ts` - mandatoryRoles object  
**Line Range:** ~125-129

```typescript
mandatoryRoles: {
  seniorManagement: { role: "Tech - Head Of - Senior Project Management", minHours: 5, maxHours: 15 },
  projectCoordination: { role: "Tech - Delivery - Project Coordination", minHours: 3, maxHours: 10 },
  accountManagement: { role: "Account Management - Senior Account Manager", minHours: 6, maxHours: 12 }
},
```

This structure defines:
- ✅ Mandatory role names
- ✅ Min/max hour allocations
- ✅ Can be referenced during SOW generation for validation

---

## How The Architect Uses This

### At SOW Generation Time:

1. **Parse user request** for project type and budget
2. **Check mandatory roles** against user brief
3. **Allocate hours** across three tiers:
   - **Strategic/Senior:** Architects, Consultants (min hours for design/architecture)
   - **Specialist/Execution:** Specialists, Producers (main execution)
   - **Mandatory roles:** Account Manager (bottom), Project Coordination, Head Of
4. **Calculate exact total** (hours × rate)
5. **Round to nearest $5k** (adjust hours/roles if needed)
6. **Build pricing table** with mandatory roles at bottom
7. **Add discount option** for negotiation
8. **Validate** against checklist

### Validation Failures (SOW Rejected):
- ❌ Missing Account Manager
- ❌ Missing Project Coordination
- ❌ Missing Head Of / Senior Management
- ❌ Total not rounded to $5k
- ❌ Only senior roles (no Specialist/Producer split)

---

## Example: How Requirement 3 Changes Role Allocation

### BEFORE (Wrong - All Senior Roles)
```
Senior Business Analyst | 15 hrs | $170/hr | $2,550
Solutions Architect | 10 hrs | $190/hr | $1,900
Senior Front-End Developer | 20 hrs | $170/hr | $3,400
Senior Developer | 15 hrs | $160/hr | $2,400
Senior QA Engineer | 8 hrs | $160/hr | $1,280
----
Total: 68 hrs, $11,530
```

**Problem:** All senior roles for routine work = inflated cost, unrealistic team

### AFTER (Correct - Stratified Roles)
```
Solutions Architect | 5 hrs | $190/hr | $950 (strategy/design)
Specialist (Frontend) | 15 hrs | $180/hr | $2,700 (complex implementation)
Developer | 15 hrs | $140/hr | $2,100 (routine frontend work)
Producer (Development) | 8 hrs | $120/hr | $960 (basic tasks)
QA Engineer | 8 hrs | $140/hr | $1,120 (routine testing)
Senior QA Engineer | 2 hrs | $160/hr | $320 (complex edge cases)
----
Total: 53 hrs, $8,150
```

**Benefit:** 
- ✅ Realistic team structure
- ✅ Better budget ($8,150 vs $11,530)
- ✅ Appropriate seniority for each task
- ✅ Client sees professional team allocation

---

## References

**Core Document:** `frontend/lib/knowledge-base.ts`  
**Export Name:** `THE_ARCHITECT_SYSTEM_PROMPT`  
**Total Length:** ~320 lines  
**Last Commit:** `34f721c`

**Related Files:**
- `frontend/lib/anythingllm.ts` - Applies this prompt to SOW workspaces at creation
- `frontend/app/page.tsx` - Calls setWorkspacePrompt() during workspace creation
- `frontend/app/portal/sow/[id]/page.tsx` - Where generated SOWs are viewed/edited

---

## Testing Against Requirements

To manually test each requirement:

```bash
# 1. Create workspace (type = SOW)
POST /api/sow/create with type: "sow"

# 2. Generate SOW
Send prompt to AI: "Create SOW for HubSpot integration + 3 landing pages for real estate company, $35k budget"

# 3. Verify output
- Requirement 1: Look for Account Manager, Project Coordination, Head Of in pricing table
- Requirement 2: Verify Account Manager is at BOTTOM (last role before totals)
- Requirement 3: Count Senior vs Specialist/Producer roles (should be ~30% senior, 70% specialist/producer)
- Requirement 4: Check investment total (should be $35k or rounded $5k figure, not $33,847)
- Requirement 5: Look for "Optional discount" or similar negotiation language
```

---

**Status:** ✅ All 5 requirements locked into THE_ARCHITECT_SYSTEM_PROMPT  
**Ready for:** Redeploy and testing
