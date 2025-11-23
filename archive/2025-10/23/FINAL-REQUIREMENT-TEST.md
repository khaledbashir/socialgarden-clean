# FINAL REQUIREMENT TEST: Account Management Role Ordering

## 🎯 Test Objective
Verify that Account Management role:
1. ✅ Is automatically included in SOW pricing
2. ✅ Always appears at BOTTOM of pricing table
3. ✅ STAYS at bottom even after drag-and-drop reordering

## 📋 Test Plan

### Test Case 1: Multi-Month Project (Forces Account Management)
**Brief**: "Create SOW for Acme Corp for 6-month HubSpot implementation and ongoing support. Need account management for weekly client check-ins."

**Expected Result**:
- Account Management role present
- Account Management at BOTTOM of pricing table
- If user drags another role below it → Account Management auto-moves back to bottom

### Test Case 2: Retainer Agreement (Forces Account Management)
**Brief**: "Create retainer SOW for TechStart Inc - 40 hours/month ongoing support with dedicated account manager."

**Expected Result**:
- Account Management role present
- Account Management at BOTTOM of pricing table
- Minimum 6 hours allocated

### Test Case 3: Drag-and-Drop Persistence
**Action**: 
1. Generate SOW with Account Management
2. Drag Account Management to TOP of list
3. Verify it auto-moves back to BOTTOM

**Expected Result**:
- Account Management cannot stay at top
- Either: Automatically re-sorts to bottom, OR
- Shows warning: "Account Management must remain at bottom"

---

## 🔍 Current Implementation Status

### Prompt Enforcement (knowledge-base.ts)
**Location**: `frontend/lib/knowledge-base.ts` - THE_ARCHITECT_SYSTEM_PROMPT

**Current Text**:
```
CRITICAL ROLE ORDERING:
- Account Manager hours MUST ALWAYS appear at the BOTTOM of the role list (just before TOTAL line)
- Standard order: Strategic/Tech roles first → Delivery/Implementation → Project Coordination → Account Management (LAST)
```

**Status**: ✅ DOCUMENTED in prompt

---

### UI Enforcement (editable-pricing-table.tsx)
**Location**: `frontend/components/tailwind/extensions/editable-pricing-table.tsx`

**Current Code**: Line 103-130
```typescript
const EditablePricingTableComponent = ({ node, updateAttributes }: any) => {
  const [rows, setRows] = useState<PricingRow[]>(node.attrs.rows || []);
  const [discount, setDiscount] = useState(node.attrs.discount || 0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showTotal, setShowTotal] = useState(node.attrs.showTotal !== undefined ? node.attrs.showTotal : true);

  useEffect(() => {
    updateAttributes({ rows, discount, showTotal });
  }, [rows, discount, showTotal]);
```

**Issue**: ❌ NO AUTOMATIC SORTING IMPLEMENTED

**Missing Code**:
```typescript
// Need to add after setRows():
useEffect(() => {
  // Auto-sort Account Management to bottom
  const sortedRows = [...rows].sort((a, b) => {
    if (a.role.includes('Account Management')) return 1;  // Move to end
    if (b.role.includes('Account Management')) return -1; // Keep others above
    return 0; // Maintain original order for others
  });
  
  if (JSON.stringify(sortedRows) !== JSON.stringify(rows)) {
    setRows(sortedRows);
  }
}, [rows]);
```

**Status**: ❌ NOT IMPLEMENTED

---

## 🚨 CRITICAL FINDING

**The Account Management ordering is**:
- ✅ **Documented** in THE_ARCHITECT_SYSTEM_PROMPT
- ❌ **NOT enforced** in the UI component

**This means**:
- The AI will TRY to put Account Management at bottom when generating
- BUT users can drag it anywhere
- AND it will STAY wherever they put it (no auto-correction)

---

## 🔧 Required Fix

### Option A: Auto-Sort (Recommended)
Add automatic sorting that runs after ANY row change:

```typescript
useEffect(() => {
  // Enforce Account Management at bottom
  const hasAccountMgmt = rows.some(r => r.role.toLowerCase().includes('account management'));
  
  if (hasAccountMgmt) {
    const sortedRows = [...rows].sort((a, b) => {
      const aIsAccount = a.role.toLowerCase().includes('account management');
      const bIsAccount = b.role.toLowerCase().includes('account management');
      
      if (aIsAccount && !bIsAccount) return 1;  // a goes to end
      if (!aIsAccount && bIsAccount) return -1; // b goes to end
      return 0; // Maintain order for non-account roles
    });
    
    // Only update if order actually changed
    if (JSON.stringify(sortedRows) !== JSON.stringify(rows)) {
      setRows(sortedRows);
      toast.info('Account Management moved to bottom (required position)');
    }
  }
}, [rows]);
```

### Option B: Prevent Dragging (Less Flexible)
Disable drag for Account Management role:

```typescript
const handleDragStart = (e: React.DragEvent, index: number) => {
  const row = rows[index];
  
  // Prevent dragging Account Management
  if (row.role.toLowerCase().includes('account management')) {
    e.preventDefault();
    toast.warn('Account Management must remain at bottom of pricing table');
    return;
  }
  
  setDraggedIndex(index);
  // ... rest of code
};
```

---

## 📊 Verification Checklist

Once fix is implemented, verify:

- [ ] Generate SOW with prompt that requires Account Management
- [ ] Confirm Account Management role appears in pricing table
- [ ] Confirm Account Management is at BOTTOM (last role before TOTAL)
- [ ] Try dragging Account Management to TOP of list
- [ ] Verify it automatically returns to BOTTOM (or drag is blocked)
- [ ] Verify toast notification appears explaining why
- [ ] Try dragging OTHER roles below Account Management
- [ ] Verify Account Management still stays at bottom

---

## 🎯 Implementation Priority

**CRITICAL**: This is the LAST remaining requirement from Sam's analysis.

**Estimated Time**: 15 minutes
1. Add auto-sort useEffect (5 min)
2. Test with live SOW generation (5 min)
3. Verify drag-and-drop behavior (5 min)

**Once complete**: ALL requirements met ✅

---

## 📝 Test Evidence Required

Record video showing:
1. SOW generated with Account Management role
2. Account Management at bottom of pricing table
3. User drags Account Management to middle of list
4. Account Management auto-returns to bottom
5. Toast notification confirms enforcement

**This will prove**: Business rule is ENFORCED, not just documented.
