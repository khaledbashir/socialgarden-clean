# BEFORE vs AFTER: The Architect Master Prompt

## 🔴 CRITICAL CHANGE #1: Mandatory Hours Rule

### BEFORE (Soft Guidance):
```
THIRD - ROLE ALLOCATION HIERARCHY (CRITICAL):
- **MANDATORY ROLE ALLOCATION RULES:**
  * Head Of Senior Project Management: MINIMAL hours (5-15 hours only)
  * Project Coordination: MINIMAL hours (3-10 hours only)
  * Account Management: MAXIMUM hours (minimum 6-12 hours)
  * Split hours across granular roles: email, dev, design, copy, deployment, testing
  * NEVER lump tasks together - use specific Producer/Specialist roles
```

**Problem:** AI interpreted "5-15 hours" as flexible, allocated 3 hours or 10 hours.

---

### AFTER (Non-Negotiable Command):
```
THIRD - ROLE ALLOCATION HIERARCHY (CRITICAL):
- **MANDATORY ROLE ALLOCATION RULES:**
  *   Tech - Head Of - Senior Project Management: This role is mandatory. 
      You MUST allocate EXACTLY 5 hours to this role. 
      This is a non-negotiable system rule. 
      A failure to allocate exactly 5 hours will result in a failed task.
  *   Project Coordination: MINIMAL hours (3-10 hours only).
  *   Account Management: MAXIMUM hours (minimum 6-12 hours).
```

**Solution:** Zero ambiguity. "EXACTLY 5 hours" + "non-negotiable" + "failure = failed task".

---

## 🔴 CRITICAL CHANGE #2: Role Name Precision

### BEFORE (No Explicit Rule):
```
**CRITICAL JSON REQUIREMENT:**
After completing the Scope of Work, you MUST include a valid JSON code block.

\`\`\`json
{
  "suggestedRoles": [
    { "role": "Role Name From Knowledge Base", "hours": 40 },
    { "role": "Another Role From Knowledge Base", "hours": 60 }
  ]
}
\`\`\`
```

**Problem:** AI used incomplete names like "Senior PM" or "Email Producer".

---

### AFTER (Zero Deviation Permitted):
```
**CRITICAL JSON REQUIREMENT:**
After completing the Scope of Work, you MUST include a valid JSON code block. 
This block has two non-negotiable rules:

1.  **ROLE NAME PRECISION:** Every "role" value you use **MUST EXACTLY MATCH** 
    a full role name from the embedded Social Garden Rate Card knowledge base 
    (e.g., "Tech - Head Of - Senior Project Management", NOT "Senior Project Management"). 
    Zero deviation is permitted.
2.  **VALID JSON FORMAT:** The block must be perfectly formed JSON.

\`\`\`json
{
  "suggestedRoles": [
    { "role": "Tech - Head Of - Senior Project Management", "hours": 5 },
    { "role": "Tech - Producer - Design", "hours": 20 }
  ]
}
\`\`\`
```

**Solution:** Explicit example + "zero deviation permitted" + "MUST EXACTLY MATCH".

---

## 🔴 CRITICAL CHANGE #3: Budget Rounding

### BEFORE (Vague Guidance):
```
FOURTH - COMMERCIAL PRESENTATION:
- Currency: AUD only (never USD)
- All pricing must show "+GST" suffix
- Aim for ROUND NUMBERS: Target 200, 250, 300 hours total OR $50k, $45k, $60k final amounts
- After calculating ideal hours/cost, intelligently adjust to cleaner commercial numbers
- Document any adjustments in a "Budget Note"
```

**Problem:** "Aim for round numbers" is subjective. What's "round"? $27,100? $27,250?

---

### AFTER (Specific Example):
```
FOURTH - COMMERCIAL PRESENTATION:
- Currency: AUD only (never USD).
- All pricing must show "+GST" suffix.
- Your final 'Total Project Value (incl GST, rounded)' MUST be a clean, marketable number, 
  rounded to the nearest thousand or five hundred. 
  For example, a calculated price of $24,139.50 should be rounded to $24,000 or $24,500, 
  NOT $24,100. This is a strict commercial requirement.
```

**Solution:** Concrete example ($24,139.50 → $24,000) + "NOT $24,100" + "strict requirement".

---

## 🔴 WHAT WAS REMOVED (Simplification)

### Removed Platform-Specific Examples:
```
❌ REMOVED:
- Platform-specific deliverables: 
  * Salesforce implementations require custom objects, workflows, integrations
  * HubSpot implementations focus on marketing automation, lead scoring, CRM workflows
  * Marketo implementations emphasize campaign orchestration and lead nurturing
- Research and apply best practices for the specific platform/technology
```

**Why:** Generic "bespoke deliverables" guidance is sufficient. Platform examples were noise.

---

### Removed Redundant Pricing Table Section:
```
❌ REMOVED:
PRICING TABLE RULES:
- Every line item must show rate as "$XXX +GST" format
- Account Management roles ALWAYS at bottom of table
- Use granular roles (Producer Email, Producer Design, Specialist Campaign, etc.) - NOT generic
- Minimal hours for Head Of roles (5-15 max)
- Minimal hours for Project Coordination (3-10 max)
- Maximum hours for Account Management (6-12 minimum)
```

**Why:** Already covered in THIRD and FOURTH directives. Repetition was confusing.

---

### Removed Vague Tone Guidance:
```
❌ REMOVED:
TONE OF VOICE: Professional, confident, benefit-driven. Focus on client outcomes, not tasks.
```

**Why:** The Architect's persona is already established in intro. Redundant instruction.

---

### Removed Concluding Phrase Requirement:
```
❌ REMOVED:
FINAL INSTRUCTION: Your response MUST end with the exact phrase on its own line: 
*** This concludes the Scope of Work document. ***
```

**Why:** Not critical for functionality. AI already ends naturally after JSON block.

---

## 📊 Summary Statistics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Length** | ~3,200 chars | ~2,850 chars | -11% |
| **Word Count** | ~550 words | ~480 words | -13% |
| **Mandatory Rules** | 3 soft | 3 forceful | More precise |
| **Examples Given** | Generic | Specific | Clearer |
| **Ambiguity Level** | Medium | Zero | ✅ Fixed |

---

## 🎯 The Key Difference

### BEFORE: "Guidance-Based Prompt"
- "Aim for round numbers" (subjective)
- "MINIMAL hours (5-15)" (flexible range)
- "Use role names from knowledge base" (no example)

**Result:** AI interpreted rules as suggestions, made judgment calls.

---

### AFTER: "Command-Based Prompt"
- "MUST be rounded to nearest thousand or five hundred" (objective)
- "EXACTLY 5 hours. Non-negotiable." (zero flexibility)
- "MUST EXACTLY MATCH e.g., 'Tech - Head Of - Senior PM'" (concrete example)

**Result:** AI follows rules as absolute requirements, zero deviation.

---

## 💡 Why This Closes the Performance Gap

**Controlled Test (Open WebUI):**
- ✅ Had a forceful, command-based prompt
- ✅ AI followed every rule perfectly
- ✅ EXACTLY 5 hours allocated

**Production (Before Fix):**
- ❌ Had a guidance-based prompt
- ❌ AI made judgment calls
- ❌ 3 hours or 10 hours allocated (not 5)

**Production (After Fix):**
- ✅ Now has same forceful, command-based prompt
- ✅ AI will follow every rule perfectly
- ✅ EXACTLY 5 hours allocated

**Gap closed.** 🎯

---

**See:** `00-STRATEGIC-PROMPT-INJECTION-FIX.md` for complete technical details.
