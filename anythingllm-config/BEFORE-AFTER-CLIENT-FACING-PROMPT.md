# Before/After: Client-Facing Prompt Transformation

## Problem Statement

The original prompt was generating **non-client-facing content** with internal labels like "### STEP 1: SOW PROSE ASSEMBLY", "### STEP 2: INVESTMENT OVERVIEW", etc. When users clicked "Insert to Editor", they would see these internal instructions mixed with the actual SOW content.

## Visual Comparison

### ❌ BEFORE (What Users Were Seeing)

```
### STEP 1: SOW PROSE ASSEMBLY

**Client:** Client Name

**Project Overview**

This project encompasses the technical integration of the HubSpot platform...

**Project Objectives**

- Successfully integrate HubSpot with existing client systems...
- Design and launch three high-converting, mobile-responsive landing pages...

**Scope 1:** HubSpot Integration & Configuration

This scope covers the end-to-end technical setup...

**Scope 2:** Landing Page Design & Development

This scope focuses on the creative and technical production...

### STEP 2: INVESTMENT OVERVIEW (SUMMARY TABLE)

### STEP 3: FINAL JSON BLOCK (CRITICAL - MULTI-SCOPE FORMAT)

---

## Investment Breakdown

[editablePricingTable]

[editablePricingTable]
```

**Issues:**
- ❌ "STEP 1", "STEP 2", "STEP 3" labels visible to client
- ❌ Meta-commentary like "(CRITICAL - MULTI-SCOPE FORMAT)"
- ❌ Placeholder text like "[editablePricingTable]"
- ❌ Internal instructions mixed with client content
- ❌ Not professional or presentation-ready

---

### ✅ AFTER (Clean, Client-Ready Output)

```
**Client:** BBUBU

## HubSpot Integration and Custom Landing Page Development

### Project Overview

This project will establish a robust marketing automation foundation for BBUBU through comprehensive HubSpot CRM integration and the development of three high-converting landing pages. Our approach combines strategic platform configuration with conversion-focused design to create a seamless lead generation and nurturing system.

We will configure HubSpot for optimal CRM functionality, integrate it directly with the new landing pages for real-time data syncing, and ensure all elements are mobile-responsive and SEO-optimized. The scope focuses on efficient execution to launch a robust marketing foundation within the allocated budget.

### Project Objectives

- Successfully integrate HubSpot with existing systems to enable seamless data flow and marketing automation
- Design and launch three mobile-responsive landing pages aligned with brand guidelines and campaign goals
- Provide the BBUBU team with a configured HubSpot instance and training for ongoing management
- Establish measurable conversion tracking and analytics framework

### HubSpot Integration & Configuration

This scope covers the end-to-end technical setup and integration of the HubSpot platform. Our senior integration specialist will define the integration strategy and execute the technical implementation, including mapping data fields, configuring APIs, and setting up core HubSpot objects (contacts, companies, deals) to align with your business processes.

A dedicated project manager will oversee the technical delivery and ensure strategic alignment with your goals. The final deliverable is a fully functional and tested HubSpot instance, complete with documentation for your technical team and training materials for ongoing management.

### Landing Page Design & Development

This scope focuses on the creative and technical production of three distinct landing pages. Our onshore development team will create visually compelling and user-friendly designs based on your brand guidelines and campaign objectives. Following design approval, the pages will be built to be fully responsive, optimized for performance, and connected to the appropriate marketing workflows.

Each landing page will include HubSpot form integration, conversion tracking, and analytics setup. We'll conduct comprehensive testing across browsers and devices to ensure flawless user experience before launch.

---

## Investment Breakdown

| Scope | Estimated Hours | Investment (AUD) |
|-------|----------------|------------------|
| **HubSpot Integration & Configuration** | 32 | $5,760 |
| **Landing Page Design & Development** | 24 | $4,770 |
| **Total (ex GST)** | 56 | $10,530 |
| **GST (10%)** | - | $1,053 |
| **Total Investment** | 56 | $11,583 |

---

### Budget Context

This scope has been carefully structured to deliver maximum value within your budget parameters, focusing on essential integration capabilities and high-impact landing page development. The 6-8 week timeline ensures thorough testing and optimization while maintaining momentum toward your marketing goals.

```json
{
  "currency": "AUD",
  "gst_rate": 10,
  "scopes": [...]
}
```
```

**Improvements:**
- ✅ No internal "STEP" labels visible
- ✅ Professional, client-ready prose throughout
- ✅ Clean investment breakdown table
- ✅ Confident, expert tone
- ✅ Detailed scope descriptions (2-3 paragraphs each)
- ✅ Budget context section adds value
- ✅ JSON block at end for system parsing (hidden from client view)

---

## Key Changes Made

### 1. Removed All Internal Labels

**Before:**
```
### STEP 1: SOW PROSE ASSEMBLY
### STEP 2: INVESTMENT OVERVIEW (SUMMARY TABLE)
### STEP 3: FINAL JSON BLOCK (CRITICAL - MULTI-SCOPE FORMAT)
```

**After:**
```
(No step labels - just clean, professional headings)
```

### 2. Expanded Prose Sections

**Before:**
```
**Scope 1:** HubSpot Integration & Configuration

This scope covers the end-to-end technical setup and integration...
```

**After:**
```
### HubSpot Integration & Configuration

This scope covers the end-to-end technical setup and integration of the HubSpot platform. Our senior integration specialist will define the integration strategy and execute the technical implementation, including mapping data fields, configuring APIs, and setting up core HubSpot objects (contacts, companies, deals) to align with your business processes.

A dedicated project manager will oversee the technical delivery and ensure strategic alignment with your goals. The final deliverable is a fully functional and tested HubSpot instance, complete with documentation for your technical team and training materials for ongoing management.
```

### 3. Added Professional Investment Table

**Before:**
```
[editablePricingTable]
```

**After:**
```
| Scope | Estimated Hours | Investment (AUD) |
|-------|----------------|------------------|
| **HubSpot Integration & Configuration** | 32 | $5,760 |
| **Landing Page Design & Development** | 24 | $4,770 |
| **Total (ex GST)** | 56 | $10,530 |
| **GST (10%)** | - | $1,053 |
| **Total Investment** | 56 | $11,583 |
```

### 4. Improved Writing Style

**Before:**
- Procedural, instructional tone
- Brief, bullet-point style
- Internal references

**After:**
- Professional, consultative tone
- Flowing prose with detail
- Client-focused language
- Active voice ("We will..." instead of "This will...")

---

## Prompt Changes Summary

### New Instructions Added:

1. **"Your output must be 100% client-facing"** - Clear mandate at the top
2. **Client-Facing Output Structure** - Detailed section-by-section guide
3. **Writing Style Guidelines** - Explicit DO/DON'T lists
4. **Example Output Structure** - Full example showing desired format
5. **No Internal Labels** - Explicit prohibition on "STEP" labels

### Instructions Removed:

1. ❌ "STEP 1: SOW PROSE ASSEMBLY" heading
2. ❌ "STEP 2: INVESTMENT OVERVIEW" heading
3. ❌ "STEP 3: FINAL JSON BLOCK" heading
4. ❌ Instructions to "generate the complete, human-readable text"
5. ❌ Meta-commentary about the output structure

### Structure Maintained:

- ✅ JSON format requirements (still in prompt)
- ✅ Multi-scope guidelines
- ✅ Calculation rules
- ✅ Role allocation requirements
- ✅ Rate card adherence rules

---

## Expected Document Structure (Target Format)

Based on the JSON structure you provided, here's what the system should generate:

```
Page 1:
├── SectionHeader: "SOCIALGARDEN" (h1)
├── SectionHeader: Project title (h2)
├── SectionHeader: Subtitle (h3)
├── Text: "Client: [Name]"
├── Table: Detailed pricing with roles, hours, costs
│   ├── Scope 1 header
│   ├── Scope 1 description (italic)
│   ├── Scope 1 roles and pricing
│   ├── Deliverables section
│   ├── Assumptions section
│   ├── Scope 2 header
│   ├── Scope 2 description (italic)
│   ├── Scope 2 roles and pricing
│   ├── Deliverables section
│   └── Assumptions section
└── PageFooter

Page 2:
├── Table (continuation): Total row
├── SectionHeader: "Scope & Price Overview" (h2)
├── Table: Summary table (high-level totals)
├── SectionHeader: "Project Overview:" (h3)
├── Text: Overview paragraph
├── SectionHeader: "Budget Notes:" (h3)
├── Text: Budget explanation
└── PageFooter
```

The new prompt ensures:
1. Clean, professional headings
2. Client-ready prose sections
3. Proper table formatting
4. No internal labels or instructions
5. JSON block at end for backend parsing

---

## How to Update Your Workspace

1. **Go to your AnythingLLM workspace** (the one you use for SOW generation)

2. **Open Settings → Chat Settings**

3. **Copy the entire contents** of `READY-TO-COPY-CLIENT-FACING-PROMPT.txt`

4. **Paste it into the System Prompt field**, replacing the old prompt

5. **Save changes**

6. **Test with a sample request** like:
   ```
   Create SOW for HubSpot integration and 3 landing pages.
   Client: BBUBU
   Budget: $10,530 firm
   ```

7. **Verify the output** has:
   - ✅ No "STEP 1", "STEP 2" labels
   - ✅ Professional, client-ready prose
   - ✅ Clean investment table
   - ✅ JSON block at the end

---

## Testing Checklist

After updating the prompt, verify:

- [ ] No internal labels appear in the output
- [ ] Document starts with "**Client:** [Name]"
- [ ] Project Overview has 2-3 paragraphs
- [ ] Each scope has detailed prose (not just bullets)
- [ ] Investment Breakdown table is properly formatted
- [ ] Budget Context section is included (when appropriate)
- [ ] JSON block appears at the very end
- [ ] No text appears after the JSON closing backticks
- [ ] All role names match the rate card exactly
- [ ] Math adds up correctly (totals, GST, etc.)

---

## Benefits of the New Approach

### For Clients:
- 📄 **Professional presentation** - Looks like a real proposal
- 🎯 **Clear value communication** - Detailed scope descriptions
- 💰 **Transparent pricing** - Clean investment breakdown
- 📊 **Easy to understand** - No technical jargon or internal labels

### For Your Team:
- ⚡ **Faster SOW creation** - Less manual editing required
- ✅ **Consistent quality** - Every SOW follows the same professional format
- 🔧 **Backend compatibility** - JSON block still enables interactive tables
- 📈 **Better conversion** - More confident, professional proposals

---

## Questions & Troubleshooting

**Q: Will the interactive pricing tables still work?**  
A: Yes! The JSON block at the end is still parsed by the backend to generate interactive tables. Only the prose section is now client-facing.

**Q: What if I see "STEP" labels in the output?**  
A: Make sure you've copied the NEW prompt exactly. The old prompt had these labels; the new one explicitly prohibits them.

**Q: Can I still edit the output before sending to clients?**  
A: Absolutely! The AI generates a professional draft, but you can always refine it further.

**Q: Will this work with my existing rate card?**  
A: Yes! The prompt still uses the [CONTEXT: OFFICIAL_RATE_CARD] that gets injected with each request.

**Q: What about the investment table format?**  
A: The new prompt generates a clean Markdown table. Your frontend should render this as a professional HTML table.

---

**Result**: Clean, professional, client-ready SOW documents that require minimal editing before sending to prospects. 🎉