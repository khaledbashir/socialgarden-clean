# Pricing Table Architect Prompt v2: Complete System Analysis

## Executive Summary

The Pricing Table Architect Prompt v2 is a sophisticated AI-powered document generation system that creates professional SOW (Scope of Work) documents with integrated, editable pricing tables. The system combines natural language processing, deterministic pricing algorithms, and interactive UI components to deliver a seamless proposal generation experience.

## System Architecture Overview

### Core Components

1. **Enhanced Architect v2 AI Prompt** - Structured content generation
2. **Pricing Calculator Engine** - Deterministic role distribution
3. **Editable Pricing Table Component** - Interactive UI layer
4. **Knowledge Base & Rate Card** - Data foundation
5. **Integration Layer** - Seamless workflow orchestration

## Detailed Component Analysis

### 1. Enhanced Architect v2 AI Prompt

**Purpose**: Generates structured SOW documents based on client requirements

**Key Features**:
- **Work Type Classification**: Automatically categorizes requests into:
  - Standard Project (defined delivery with start/end)
  - Audit/Strategy (analysis and recommendations)
  - Retainer Agreement (ongoing services)

- **Document Structure**: Enforces specific ordering:
  1. Project Overview
  2. Project Objectives  
  3. **Deliverables** (mandatory positioning)
  4. Detailed phase breakdown
  5. Investment Breakdown (pricing table)

- **Role Suggestion System**: Outputs JSON format with recommended roles:
  ```json
  {
    "suggestedRoles": [
      "Tech - Head Of- Senior Project Management",
      "Tech - Delivery - Project Management", 
      "Account Management - (Account Manager)"
    ]
  }
  ```

**Pricing Logic Separation**: The AI explicitly does NOT calculate hours, totals, or budgets - this is handled entirely by the application logic to ensure consistency and accuracy.

### 2. Pricing Calculator Engine

**Purpose**: Converts role suggestions into structured pricing tables with deterministic hour allocation

**Algorithm Logic**:

```typescript
calculatePricingTable(
  suggestedRoleNames: string[],
  totalBudgetExGst: number,
  opts: CalcOptions = {}
): PricingRow[]
```

**Core Rules Implementation**:

1. **Mandatory Governance Roles**:
   - **Project Management**: 
     - Budget > $15,000 → Head Of ($365/hr, 5 hours)
     - Budget ≤ $15,000 → Delivery PM ($150/hr, 5 hours)
   - **Account Management**: Always included ($180/hr, 8 hours minimum)
   - **Project Coordination**: Always included ($110/hr, 6 hours)

2. **Budget Distribution Algorithm**:
   - Calculate remaining budget after mandatory governance costs
   - Distribute remaining budget evenly across suggested roles
   - Calculate hours: `budget_share / role_rate`
   - Apply granularity rounding (default: 0.5 hours)

3. **Budget Tightening Process**:
   - Scale non-governance hours to approach target budget
   - Use iterative adjustment with 3% tolerance
   - Prioritize reducing higher-rate roles first
   - Round to commercial numbers (nearest $100 final total)

**Output Structure**:
```typescript
interface PricingRow {
  role: string;           // Exact role name from rate card
  description?: string;   // Optional role description  
  hours: number;          // Calculated hours
  rate: number;           // Rate from rate card
}
```

### 3. Editable Pricing Table Component

**Technology**: TipTap.js React extension for rich text editing

**Features**:

1. **Interactive Table Management**:
   - Add/remove rows dynamically
   - Drag-and-drop row reordering
   - Real-time validation against rate card
   - Duplicate role detection and auto-fix

2. **Real-time Calculations**:
   - Subtotal: Sum of (hours × rate)
   - Discount: Percentage-based reduction
   - GST: 10% Australian tax
   - Total: Subtotal after discount + GST
   - Commercial Rounding: Final total rounded to nearest $100

3. **Display Controls**:
   - Show/hide pricing toggle for presentation mode
   - Visual feedback for drag operations
   - Responsive design for various screen sizes

4. **Data Persistence**:
   - Syncs with TipTap document structure
   - Maintains state across re-renders
   - Prevents render cycle violations

**Component Architecture**:
```typescript
EditablePricingTable.create({
  name: 'editablePricingTable',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      rows: { default: [] },
      discount: { default: 0 },
      showTotal: { default: true },
    };
  },
  // React node view for editing
  addNodeView() {
    return ReactNodeViewRenderer(EditablePricingTableComponent);
  }
});
```

### 4. Data Layer

**Rate Card Structure**: 91 roles across multiple categories

**Major Role Categories**:
- **Account Management** (5 roles): $120-$365/hr
- **Project Management** (3 roles): $180-$295/hr
- **Tech - Delivery** (2 roles): $110-$150/hr
- **Tech - Head Of** (4 roles): $365/hr
- **Tech - Producer** (21 roles): $120/hr
- **Tech - Specialist** (14 roles): $180-$190/hr
- **Tech - Sr. Architect** (4 roles): $365/hr
- **Tech - Sr. Consultant** (10 roles): $295/hr
- **Content & Design** (25+ roles): $120-$295/hr

**Knowledge Base Integration**:
```typescript
SOCIAL_GARDEN_KNOWLEDGE_BASE = {
  rateCard: { /* All 91 roles with rates */ },
  mandatoryRoles: { /* Minimum hour requirements */ },
  projectTypes: { /* Standard configurations */ },
  serviceModules: { /* Predefined packages */ }
}
```

**Role Normalization**:
- Handles variations in role naming
- Maps to canonical role names
- Ensures consistent rate application

### 5. Complete System Flow

```
1. User Input
   ↓
2. Enhanced Architect v2 Processing
   ├─ Work type classification
   ├─ Deliverable generation  
   └─ Role suggestion (JSON output)
   ↓
3. AI Content Extraction
   ├─ Parse SOW document structure
   └─ Extract JSON role array
   ↓
4. Pricing Calculator Algorithm
   ├─ Apply Sam's Rule logic
   ├─ Calculate hour distribution
   └─ Generate pricing rows
   ↓
5. Editable Table Creation
   ├─ Initialize TipTap node
   ├─ Render interactive component
   └─ Enable real-time editing
   ↓
6. User Interaction Loop
   ├─ Modify roles/hours
   ├─ Add/remove rows
   ├─ Apply discounts
   └─ Real-time recalculation
   ↓
7. Export/Persistence
   ├─ PDF generation
   ├─ HTML rendering
   └─ Document storage
```

## Technical Innovation Points

### 1. Separation of Concerns
- **AI Focus**: Content generation, structure, and role suggestions
- **Application Logic**: All mathematical calculations and data consistency
- **UI Layer**: Interactive editing and real-time feedback

### 2. Deterministic Pricing Algorithm
- Produces consistent results regardless of input order
- Eliminates AI calculation errors
- Ensures commercial presentation standards

### 3. Real-time Data Integrity
- Validates all role selections against official rate card
- Maintains referential integrity across all calculations
- Provides immediate visual feedback

### 4. Commercial Presentation Logic
- Automatic rounding to professional numbers
- Budget tolerance handling (3% threshold)
- Strategic hour adjustments to meet targets

## Key Technical Patterns

### 1. State Management
```typescript
// Queue microtask to prevent render cycle violations
queueMicrotask(() => {
  updateAttributes({ rows: validRows, discount, showTotal });
});
```

### 2. Role Deduplication
```typescript
// Combine hours for duplicate roles, prefer canonical rates
const roleMap = new Map<string, PricingRow>();
for (const r of initialRows) {
  const key = normalize(r.role);
  const existing = roleMap.get(key);
  if (existing) {
    existing.hours += r.hours;
  } else {
    roleMap.set(key, r);
  }
}
```

### 3. Budget Tightening Algorithm
```typescript
// Scale hours to approach target without exceeding
const scale = targetNonGov / nonGovCost;
for (const r of nonGov) {
  r.hours = Math.round((r.hours * scale) / g) * g;
}
```

## System Benefits

### For Users
- **Speed**: Generate professional SOWs in minutes vs. hours
- **Consistency**: Standardized pricing logic across all proposals
- **Flexibility**: Real-time editing with immediate visual feedback
- **Accuracy**: Eliminates manual calculation errors

### For Business
- **Standardization**: Consistent proposal quality and pricing
- **Scalability**: Handle multiple proposals efficiently
- **Commercial Appeal**: Professional presentation with rounded totals
- **Compliance**: Exact role matching with official rate cards

## Technical Specifications

### Performance Characteristics
- **Deterministic**: Same input always produces same output
- **Fast**: Real-time calculations for pricing updates
- **Scalable**: Handles complex role combinations efficiently
- **Robust**: Comprehensive error handling and validation

### Data Flow
- **Input**: Role names + target budget
- **Processing**: Multi-step algorithm with budget constraints
- **Output**: Structured pricing rows with totals
- **Storage**: Persistent in TipTap document structure

### Integration Points
- **Frontend**: React components with TypeScript
- **AI Integration**: Workspace-level prompt management
- **Export**: PDF and HTML generation support
- **Validation**: Multi-layer role and calculation verification

## Conclusion

The Pricing Table Architect Prompt v2 represents a sophisticated synthesis of AI content generation, deterministic financial logic, and interactive user interfaces. The system's strength lies in its separation of concerns - allowing AI to focus on content generation while maintaining mathematical precision through application logic. The result is a powerful tool that consistently produces professional, accurate, and customizable SOW documents with integrated pricing tables.

The architecture demonstrates advanced software engineering principles including separation of concerns, deterministic algorithms, real-time data validation, and seamless user experience design. This system serves as an excellent example of how AI and traditional software development can be effectively combined to create powerful business tools.
