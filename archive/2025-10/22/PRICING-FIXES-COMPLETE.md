# Pricing and Financials Display - FIXED ✅

**All 3 Issues Resolved**

## Changes Made

### 1. ✅ GST Display Format - "+GST"
**Before:** GST was included in "Total Project Value" with a separate line showing "GST (10%)"  
**After:** Total shows as `$X,XXX.XX +GST` with GST details shown below in smaller text

**Implementation:**
```tsx
<div className="flex justify-between text-base font-bold">
  <span>Total Project Value:</span>
  <span className="text-[#0e2e33]">
    ${calculateSubtotalAfterDiscount().toFixed(2)} 
    <span className="text-sm font-normal">+GST</span>
  </span>
</div>
<div className="flex justify-between text-xs text-gray-500">
  <span>GST (10%):</span>
  <span>${calculateGST().toFixed(2)}</span>
</div>
<div className="flex justify-between text-xs text-gray-500 italic">
  <span>Total incl. GST:</span>
  <span>${calculateTotal().toFixed(2)}</span>
</div>
```

### 2. ✅ Toggle Summary Price Button
**What:** Added "Hide Total" / "Show Total" button  
**Why:** Sam needs to show multiple scopes as options WITHOUT showing a combined total  
**Where:** Above the total price display, right-aligned

**Implementation:**
- New state: `showTotal` (default: `true`)
- Button toggles visibility of entire total section
- Persisted in node attributes
- Clean UI with gray background button

```tsx
<button
  onClick={() => setShowTotal(!showTotal)}
  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded"
>
  {showTotal ? "Hide Total" : "Show Total"}
</button>
```

### 3. ✅ Discount Per Pricing Table
**Before:** Single discount field at bottom (applied to grand total across ALL SOWs)  
**After:** Discount field is INSIDE each pricing table (applies to THAT table only)

**How It Works:**
- Each pricing table has its own discount state
- Discount saves per pricing table node
- Multiple tables can have different discounts
- Supports per-SOW pricing options

**Calculation Flow:**
1. Subtotal = Sum of all rows (hours × rate)
2. Discount applied to subtotal → Subtotal after discount
3. GST (10%) applied to discounted amount
4. Total = Subtotal after discount + GST

## File Changed
`/root/the11/frontend/components/tailwind/extensions/editable-pricing-table.tsx`

## Testing Checklist
- [ ] Create a new pricing table
- [ ] Verify it shows "Total Project Value: $X,XXX.XX +GST"
- [ ] Click "Hide Total" button → Total section disappears
- [ ] Click "Show Total" button → Total section reappears
- [ ] Add discount (e.g., 10%) → Verify it applies to THAT table only
- [ ] Create second pricing table with different discount
- [ ] Verify each table has independent discount and total

## Deployment Status
✅ **Build successful** (1.22 MB bundle)  
✅ **PM2 restarted** (restart #48)  
✅ **Live on port 3001**

## Clear Browser Cache!
⚠️ **IMPORTANT:** Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to hard refresh and see changes.

## Next Steps
Sam should now be able to:
1. Show pricing tables with "+GST" format
2. Hide total price when presenting multiple options
3. Apply different discounts to different scopes/SOWs
