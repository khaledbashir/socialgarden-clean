# UI COMPONENT UPDATES - Quick Implementation Guide

**Target:** Complete remaining 8 requirements  
**Files to Modify:** 3 main components  
**Estimated Time:** 4-6 hours total

---

## 1. UPDATE: EditablePricingTable Component

**File:** `/frontend/components/tailwind/extensions/editable-pricing-table.tsx`

### Change 1: Account Management Role Sorting
```typescript
// Add this function to automatically sort rows
const sortRowsByRole = (rows: any[]) => {
  const accountMgmtRoles = rows.filter(row => 
    row.role?.toLowerCase().includes('account') ||
    row.role?.toLowerCase().includes('account manager')
  );
  
  const otherRoles = rows.filter(row =>
    !row.role?.toLowerCase().includes('account')
  );
  
  return [...otherRoles, ...accountMgmtRoles];
};
```

### Change 2: Discount Description Field
Add new state:
```typescript
const [discountDescription, setDiscountDescription] = useState("");
// Example: "Annual commitment discount" or "Volume discount"
```

### Change 3: Enhanced Summary Display
Update the summary section to show:
```
Sub-Total (Before Discount): $XX,XXX
Discount (Annual Commitment): -$X,XXX (10%)
Grand Total (After Discount): $XX,XXX +GST
```

---

## 2. CREATE: PricingSummary Component

**New File:** `/frontend/components/tailwind/pricing-summary.tsx`

### Purpose
Reusable component for consistent discount/total display

### Props
```typescript
interface PricingSummaryProps {
  subtotal: number;
  discountAmount: number;
  discountDescription?: string;
  discountPercentage?: number;
  gstAmount: number;
  grandTotal: number;
  roundedTotal?: number; // Suggested rounded figure
  budgetAdjustmentNotes?: string;
}
```

### Display Format
```tsx
<div className="pricing-summary">
  <Row label="Sub-Total (Before Discount)" value="$XX,XXX" />
  {discount > 0 && (
    <>
      <Row label={`Discount (${description})`} value="-$X,XXX" className="text-red-600" />
      <Row label="Subtotal After Discount" value="$XX,XXX" />
    </>
  )}
  <Row label="GST (10%)" value="+$X,XXX +GST" />
  <Row label="Grand Total" value="$XX,XXX +GST" className="font-bold bg-emerald-100" />
  
  {roundedTotal && roundedTotal !== grandTotal && (
    <Row label="Suggested (for budget alignment)" value={`$${roundedTotal.toLocaleString()}`} />
  )}
  
  {budgetAdjustmentNotes && (
    <BudgetNotes notes={budgetAdjustmentNotes} />
  )}
</div>
```

---

## 3. UPDATE: PricingTableBuilder Component

**File:** `/frontend/components/tailwind/pricing-table-builder.tsx`

### Add Rounding Function
```typescript
const roundToNearestFiveK = (amount: number): number => {
  const rounded = Math.round(amount / 5000) * 5000;
  return rounded === 0 ? 5000 : rounded; // Minimum $5k
};

const suggestedRounded = roundToNearestFiveK(calculateTotal());
const roundingNeeded = suggestedRounded !== calculateTotal();
```

### Add Discount Description Field
```tsx
<div className="space-y-2">
  <Label>Discount Description</Label>
  <Input
    type="text"
    placeholder="e.g., Annual commitment, volume discount"
    value={discountDescription}
    onChange={(e) => setDiscountDescription(e.target.value)}
  />
</div>
```

### Add Budget Adjustment Notes Field
```tsx
<div className="space-y-2">
  <Label>Budget Adjustment Notes (if optimized)</Label>
  <Textarea
    placeholder="e.g., Original estimate: $75k → Target: $60k → Optimized by combining roles"
    value={budgetNotes}
    onChange={(e) => setBudgetNotes(e.target.value)}
    rows={3}
  />
</div>
```

---

## 4. CREATE: PriceToggle Component

**New File:** `/frontend/components/tailwind/price-toggle.tsx`

### Purpose
Toggle to hide/show price totals

### Implementation
```typescript
export default function PriceToggle() {
  const [pricesHidden, setPricesHidden] = useState(false);
  
  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('hidePrices');
    setPricesHidden(JSON.parse(saved || 'false'));
  }, []);
  
  const toggle = () => {
    const newValue = !pricesHidden;
    setPricesHidden(newValue);
    localStorage.setItem('hidePrices', JSON.stringify(newValue));
    
    // Trigger re-render of pricing sections
    window.dispatchEvent(new CustomEvent('priceVisibilityChange', { 
      detail: { hidden: newValue }
    }));
  };
  
  return (
    <button onClick={toggle} className="gap-2 flex items-center">
      {pricesHidden ? '🔓' : '🔒'} {pricesHidden ? 'Show' : 'Hide'} Totals
    </button>
  );
}
```

---

## 5. VERIFICATION: Folder Persistence Test Plan

**File:** `/frontend/app/page.tsx`

### Tests to Run
1. Create folder → Refresh page → Folder still visible ✅
2. Create folder → Switch workspace → Switch back → Folder exists ✅
3. Create folder with nested SOWs → Refresh → All SOWs visible ✅
4. Delete folder → Refresh → Folder gone ✅
5. Browser dev tools → Storage → Check localStorage for folders ✅

### Code to Add (if needed)
```typescript
// Auto-load folders on component mount
useEffect(() => {
  const loadFolders = async () => {
    const response = await fetch('/api/folders/list');
    const folders = await response.json();
    setFolders(folders);
  };
  
  loadFolders();
}, [workspaceId]);
```

---

## 6. REFINE: Drag-and-Drop Functionality

**File:** `/frontend/components/tailwind/extensions/editable-pricing-table.tsx`

### Current Implementation Review
- [ ] Check if using HTML5 Drag API correctly
- [ ] Add visual feedback (row highlight, cursor change)
- [ ] Add smooth transitions during drag
- [ ] Test with: Chrome, Firefox, Safari, Edge

### Enhanced Feedback
```typescript
const handleDragStart = (e: DragEvent, index: number) => {
  e.dataTransfer!.effectAllowed = 'move';
  setDraggedIndex(index);
  // Add visual feedback
  e.currentTarget.classList.add('opacity-50');
};

const handleDragEnd = (e: DragEvent) => {
  e.currentTarget.classList.remove('opacity-50');
  setDraggedIndex(null);
};
```

---

## Implementation Priority Order

### Phase 1 (Critical - Do First)
1. Account Management sorting in EditablePricingTable
2. Discount Description field
3. Rounding logic with suggestions

### Phase 2 (Important - Do Next)
1. Create PricingSummary component
2. Integrate into PricingTableBuilder
3. Test discount display format

### Phase 3 (Nice to Have)
1. Price toggle feature
2. Drag-and-drop refinement
3. Budget adjustment notes integration

---

## Testing Commands

```bash
# Build and test
cd /root/the11-dev/frontend
npm run build

# Run dev server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Run lint
npm run lint
```

---

## Checklist for Each Component Update

- [ ] TypeScript types correct
- [ ] No console errors
- [ ] Responsive design (mobile-friendly)
- [ ] Dark theme support
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Unit tests (if needed)
- [ ] Git commit message clear
- [ ] Pushed to branch

---

## Expected Files After Completion

```
frontend/components/tailwind/
├── pricing-table-builder.tsx (UPDATED)
├── extensions/
│   └── editable-pricing-table.tsx (UPDATED)
├── pricing-summary.tsx (NEW)
├── price-toggle.tsx (NEW)
└── ... other components
```

---

## Notes

- Keep changes modular (reusable components)
- Use existing UI patterns from codebase
- Maintain dark theme consistency
- Test with various role combinations
- Document any API changes

---

**Last Updated:** October 23, 2025  
**Ready to Start:** Yes ✅  
**Estimated Completion:** 1-2 hours per component
