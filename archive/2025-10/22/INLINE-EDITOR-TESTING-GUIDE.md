# 🧪 TESTING GUIDE - What to Look For

## Before Testing
✅ Server is running on port 3001
✅ Build is complete
✅ No console errors on page load

---

## Test 1: Selection Mode Works

### Step 1: Highlight Text
```
1. Open your editor
2. Select any text by clicking and dragging
3. Expected: Small toolbar appears above selection
```

**Check:**
- ✅ Toolbar appears immediately when text selected
- ✅ Toolbar shows "Ask AI" button
- ✅ Toolbar positioned above the selection
- ✅ Toolbar has green gradient button

### Step 2: Click "Ask AI"
```
1. With toolbar visible, click "Ask AI" button
2. Expected: Full floating bar opens below editor
```

**Check:**
- ✅ Small toolbar disappears
- ✅ Full floating bar appears at bottom of screen
- ✅ Bar has title "AI WRITING ASSISTANT with AI"
- ✅ Bar shows quick action buttons:
   - Improve Writing
   - Shorten
   - Elaborate
   - More formal
   - More casual
   - Bulletize
   - Summarize
   - Rewrite

### Step 3: Try Quick Action
```
1. Click any quick action button (e.g., "Improve Writing")
2. Expected: AI processes selected text and shows result
```

**Check:**
- ✅ Loading spinner appears
- ✅ Text gets processed
- ✅ Result appears in preview
- ✅ "Replace" and "Insert" buttons appear
- ✅ "Refine" button available to try again

### Step 4: Replace or Insert
```
1. Click "Replace" to replace selected text
   OR
   Click "Insert" to add below
2. Expected: Result applied and bar closes
```

**Check:**
- ✅ Selected text is replaced/inserted
- ✅ Bar closes automatically
- ✅ Editor returns to normal
- ✅ No console errors

### Step 5: Toolbar Disappears on Deselect
```
1. Click elsewhere to deselect text
2. Expected: Toolbar disappears
```

**Check:**
- ✅ Toolbar is gone
- ✅ No floating buttons left behind

---

## Test 2: Slash Command Mode Works

### Step 1: Type /ai Command
```
1. Click in editor at a new spot
2. Type: /ai
3. Expected: Full floating bar opens
```

**Check:**
- ✅ /ai command disappears
- ✅ Full bar opens at bottom
- ✅ Bar title says "Help me write"
- ✅ NO quick action buttons shown (important!)

### Step 2: Type Free-Form Command
```
1. In the input field, type something like:
   - "write a professional email"
   - "create a pros and cons list"
   - "write 5 marketing taglines"
2. Press Enter
3. Expected: AI generates new content
```

**Check:**
- ✅ Text gets generated
- ✅ Loading spinner shows during generation
- ✅ Preview appears with result
- ✅ "Replace" and "Insert" buttons shown

### Step 3: Insert Result
```
1. Click "Insert" to add the generated content
2. Expected: Content added to document
```

**Check:**
- ✅ Content inserted at cursor
- ✅ Bar closes
- ✅ Content appears in editor
- ✅ No console errors

---

## Test 3: Mode Independence

### Critical Test: Two Modes Don't Mix
```
1. Highlight text (Mode 1 activates)
2. Toolbar appears ✓
3. Type /ai command somehow (shouldn't happen if toolbar active)
4. Expected: Only one mode active at a time
```

**Check:**
- ✅ Can't accidentally trigger both modes
- ✅ Toolbar and slash bar never appear together
- ✅ Clear separation between modes

---

## Test 4: Keyboard Shortcuts

### Test Enter Key
```
1. Open either mode
2. Type a prompt/command
3. Press Enter (without Shift)
4. Expected: Generates text immediately
```

**Check:**
- ✅ Shortcut works
- ✅ Generation happens

### Test Escape Key
```
1. Full bar visible
2. Press Escape
3. Expected: Bar closes
```

**Check:**
- ✅ Bar closes
- ✅ Returns to normal editing

---

## Test 5: Model Selection

### Change AI Model
```
1. Full bar open
2. Click "Model: Gemini 2.0 Flash" dropdown
3. Expected: List of models appears
```

**Check:**
- ✅ Dropdown opens
- ✅ Multiple models shown (Gemini, Llama, Mistral, GLM)
- ✅ Can select different model
- ✅ Selection persists (try again later)

---

## Test 6: Error Handling

### Test API Error
```
1. Disable your internet connection
2. Try to generate
3. Expected: Error message shown
```

**Check:**
- ✅ Error toast appears
- ✅ User gets helpful message
- ✅ Can retry after connection restored

### Test Empty Prompt
```
1. Open bar
2. Click generate without typing anything
3. Expected: Error or disabled button
```

**Check:**
- ✅ Generate button disabled if empty
- ✅ Or error message shown

---

## Test 7: Visual Polish

### Check Appearance
```
1. Look at floating bar design
2. Expected: Professional, clean appearance
```

**Check:**
- ✅ Green/teal gradient colors
- ✅ Rounded corners
- ✅ Shadow effect
- ✅ Smooth animations
- ✅ No layout bugs or overlaps
- ✅ Text is readable

### Check Animations
```
1. Watch toolbar appear
2. Watch bar slide in
3. Expected: Smooth transitions
```

**Check:**
- ✅ Toolbar fade-in smooth
- ✅ Bar slide-in from bottom smooth
- ✅ No janky or stuttery animation
- ✅ Loading spinner spins smoothly

---

## Test 8: Edge Cases

### Selection at Different Locations
```
1. Highlight text at top of editor
2. Highlight text at bottom
3. Highlight text in middle
4. Expected: Toolbar always positioned correctly
```

**Check:**
- ✅ Toolbar appears near selection every time
- ✅ No positioning issues

### Long vs Short Selection
```
1. Select 1 word
2. Select entire paragraph
3. Expected: Both work
```

**Check:**
- ✅ Toolbar works for short selections
- ✅ Toolbar works for long selections
- ✅ Selection preserved in both cases

### After Browser Resize
```
1. Open bar
2. Resize browser window
3. Expected: Position updates correctly
```

**Check:**
- ✅ Bar stays visible
- ✅ Position adjusts
- ✅ No layout breaks

---

## Test 9: Rapid Usage

### Try Multiple Edits in Succession
```
1. Select text → Ask AI → Replace
2. Immediately: Select different text → Ask AI → Replace
3. Then: Type /ai → Generate → Insert
4. Expected: No crashes or issues
```

**Check:**
- ✅ All operations complete successfully
- ✅ No console errors
- ✅ State resets properly between actions

---

## Test 10: No Console Errors

### Check Browser Console
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform all tests above
4. Expected: No red error messages
```

**Check:**
- ✅ No TypeScript errors
- ✅ No JavaScript exceptions
- ✅ No API 404s
- ✅ No network errors (unless expected)

---

## Quick Test Checklist (5 Minutes)

✅ Can highlight text and see toolbar
✅ Can click "Ask AI" and see full bar
✅ Can select quick action and it works
✅ Can type /ai and generate text
✅ Can replace text successfully
✅ Bar disappears when deselecting
✅ No console errors
✅ Looks professional and polished

---

## If Something's Wrong

### Toolbar doesn't appear on highlight
- Try selecting more text (more than 1 char)
- Hard refresh browser (Ctrl+Shift+R)
- Check console for errors

### Full bar doesn't open
- Make sure you clicked "Ask AI" button
- Check bar isn't already open
- Clear browser cache

### /ai command doesn't work
- Make sure you type `/ai` exactly
- Make sure cursor is in editor
- Try Escape first, then /ai again

### Generation fails
- Check your API quota
- Check internet connection
- Try different model from dropdown
- Type a clearer, more specific command

### Bar looks weird
- Hard refresh page
- Check if Tailwind CSS loaded
- Check browser zoom level
- Try different browser

---

## Success Criteria ✅

All of these must be true:

- [x] Toolbar appears only on text selection
- [x] Clicking "Ask AI" opens full bar with quick actions
- [x] Quick actions work correctly
- [x] Custom prompts work
- [x] /ai command generates new content
- [x] Replace function works
- [x] Insert function works
- [x] No console errors
- [x] Keyboard shortcuts work
- [x] Model selection works
- [x] Looks professional

**If all ✅, you're good to go!** 🎉

---

## Questions?

Refer to:
- 📖 `INLINE-EDITOR-USER-GUIDE.md` - User perspective
- 📚 `INLINE-EDITOR-TECHNICAL-DOCS.md` - Developer perspective
- ✅ `INLINE-EDITOR-COMPLETE.md` - Full summary

---

Happy testing! 🧪
