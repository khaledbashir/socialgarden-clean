# The Architect Prompt - Quick Comparison

## 📊 Side-by-Side Summary

| Feature | Current | New | Winner |
|---------|---------|-----|--------|
| **Length** | ~2,000 words | ~800 words | New (cleaner) |
| **Multiple Options** | ❌ Not covered | ✅ Explicitly required | New |
| **Google Sheets Export** | ❌ No | ✅ /pushtosheet | New |
| **Role Allocation Examples** | ✅ Detailed (Sam's Law) | ❌ Brief | Current |
| **Deliverable Examples** | ✅ HubSpot, Email, Journey | ❌ None | Current |
| **Markdown Format Rules** | ✅ Explicit | ❌ Implicit | Current |
| **GST Display Rules** | ✅ "+GST" format detailed | ⚠️ Mentioned once | Current |
| **Budget Note Concept** | ❌ Not explicit | ✅ "MUST document" | New |
| **Tone Guidance** | ❌ Implied | ✅ Explicit | New |

---

## 🎯 Key Additions in New Prompt

### 1. Multiple Options Feature ✨ **NEW**
```
If the client brief asks for several options (e.g., "Basic" vs. "Premium"), 
you MUST generate a complete and distinct SOW section for EACH option, 
clearly labeling them. Each option must have its own deliverables and 
pricing table.
```

**Why This Matters:** Clients often ask for tiers. Current prompt might combine them; new is explicit.

### 2. Budget Note Requirement ✨ **NEW**
```
intelligently adjust the final total hours or cost to a cleaner, rounded 
commercial number... you MUST document these adjustments in a "Budget Note".
```

**Why This Matters:** Transparency. Clients see exactly why numbers changed.

### 3. Google Sheets Integration ✨ **NEW**
```
Tool Name: google-sheets-url-skill
User Command: /pushtosheet
```

**Why This Matters:** Automates SOW archiving and sharing.

### 4. Tone Guidance ✨ **NEW**
```
MUST be written in a professional, confident, and benefit-driven tone. 
Focus on the value and solutions being delivered to the client.
```

**Why This Matters:** Prevents dry/feature-list tone.

---

## 🔴 Critical Elements Removed from Current

**These MUST be preserved:**

1. **Detailed SOW Templates** (300+ lines)
   - Standard Project structure
   - Audit/Strategy structure  
   - Support Retainer structure

2. **Role Examples** (Sam's Law breakdown)
   - HubSpot Impl: 120-200 hours with role breakdown
   - Email Template: 40-80 hours with role breakdown
   - Retainer: 40h/month balance

3. **Deliverable Examples**
   - HubSpot: Account Config, Marketing Hub, Service Hub, etc.
   - Email: Design, Development, Testing, Deployment
   - Journey Mapping: Discovery, Workshops, Touchpoint Analysis, etc.

4. **Formatting Rules** (Critical for Sam)
   - **Bullet lists** not paragraphs
   - Markdown standards
   - Table syntax

---

## ✅ Recommendation

**Adopt: YES** - Use new structure but **restore operational sections**

The new prompt is cleaner and adds critical features (multiple options, budget notes, sheets export), but operational details from current version should be preserved in a knowledge base section or appendix.

---

## 🚀 Implementation Checklist

- [ ] Update THE_ARCHITECT_SYSTEM_PROMPT in `/frontend/lib/knowledge-base.ts`
- [ ] Keep all SOW structure templates (don't remove)
- [ ] Keep all role allocation examples (don't remove)
- [ ] Keep all deliverable examples (don't remove)
- [ ] Add new: multiple options requirement
- [ ] Add new: budget note requirement
- [ ] Add new: /pushtosheet workflow
- [ ] Test with: "Give me Basic, Standard, and Premium options"
- [ ] Test with: Commercial rounding triggers
- [ ] Verify /pushtosheet exports to Google Sheets

---

**Status:** ✅ Ready to implement
