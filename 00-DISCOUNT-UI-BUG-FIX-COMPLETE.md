// 🎯 CRITICAL FIX: Sync discount state with node.attrs.discount when it changes
useEffect(() => {
    if (
        node.attrs.discount !== undefined &&
        node.attrs.discount !== discount
    ) {
        console.log(
            `🔍 [DISCOUNT DEBUG] Updating discount from ${discount}% to ${node.attrs.discount}%`,
        );
        setDiscount(node.attrs.discount);
    }
}, [node.attrs.discount, discount]);
```

## Testing
To verify the fix:
1. Start the application
2. Enter the test prompt: "Generate an SOW for a HubSpot integration and an AI Agent. Apply a 15% discount."
3. Verify that the pricing table displays "Discount (%): 15" instead of "Discount (%): 0"

## Files Modified
- `frontend/components/tailwind/extensions/editable-pricing-table.tsx`

## Impact
This fix ensures that discount values from user prompts are correctly displayed in the pricing table UI, making the system truly WYSIWYG for pricing calculations and improving the user experience by providing accurate visual feedback.

## Technical Details
The fix ensures proper state synchronization between the parent component (which extracts the discount from the prompt) and the child component (which displays the discount in the UI). This resolves a critical disconnect in the state management flow that was causing the UI to display stale discount values.

The fix includes:
1. A conditional check to only update when the discount has actually changed
2. Proper logging to track discount updates for debugging
3. Dependency array correctly set to trigger only when `node.attrs.discount` or the internal `discount` state changes

This solution maintains the existing architecture while fixing the specific issue with discount value propagation.