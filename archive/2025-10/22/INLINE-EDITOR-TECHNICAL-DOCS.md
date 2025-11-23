# 🔧 Inline Editor - Technical Implementation Details

## Architecture Overview

### Components

```
FloatingAIBar (Main Component)
├── SelectionToolbar (NEW - Lightweight)
│   └── Shows only on text selection
│       └── Single "Ask AI" button
│           └── Triggers full bar in selection mode
│
└── Full Floating Bar (Enhanced)
    ├── Selection Mode
    │   ├── Quick actions visible
    │   ├── Operates on selected text
    │   └── Replace/Insert options for selection
    │
    └── Slash Command Mode
        ├── No quick actions
        ├── Free-form text generation
        └── Insert/Replace for new content
```

---

## State Management

### Key States in FloatingAIBar

```typescript
// Visibility States (Separate)
const [showToolbar, setShowToolbar] = useState(false);      // Selection toolbar
const [isVisible, setIsVisible] = useState(false);          // Full floating bar

// Trigger Source
const [triggerSource, setTriggerSource] = useState<'selection' | 'slash'>('slash');

// Selection Tracking
const selectionRef = useRef<{ from: number; to: number } | null>(null);
const [hasSelection, setHasSelection] = useState(false);

// UI State
const [showActions, setShowActions] = useState(false);      // Show quick actions
const [showActionsDropdown, setShowActionsDropdown] = useState(false);
const [showModelSelector, setShowModelSelector] = useState(false);

// Data State
const [prompt, setPrompt] = useState("");
const [completion, setCompletion] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-exp:free");
```

### State Flow Logic

```
Selection Made
  ↓
updateSelection() fires
  ↓
selectionRef.current = { from, to }
setHasSelection(true)
  ↓
showToolbar = !isVisible && hasSelection
  ↓
Toolbar appears ✓


User Clicks "Ask AI"
  ↓
handleToolbarAskAI() fires
  ↓
setShowToolbar(false)
setTriggerSource('selection')
setIsVisible(true)
setShowActions(true)
  ↓
Full bar appears with quick actions ✓


User Types /ai
  ↓
handleOpenAIBar() event fires
  ↓
setShowToolbar(false)
setTriggerSource('slash')
setIsVisible(true)
setHasSelection(false)
setShowActions(false)
  ↓
Full bar appears without quick actions ✓
```

---

## Component: SelectionToolbar

### Purpose
Lightweight floating toolbar that appears only when text is selected

### Props
```typescript
interface SelectionToolbarProps {
  onAskAI: () => void;          // Callback when "Ask AI" is clicked
  isVisible: boolean;            // Should toolbar be visible
}
```

### Key Features
1. **Position Calculation:** Updates position based on selection range
2. **Auto-positioning:** Centers horizontally over selection
3. **Vertical Position:** Appears above selected text
4. **Smooth Animation:** Fade-in animation on appearance
5. **Mobile Safe:** Positioned absolutely but smart about boundaries

### Code Logic
```typescript
// Listen for selection changes
useEffect(() => {
  if (!isVisible || !toolbarRef.current) return;
  
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Position above the selection, centered
  setPosition({
    top: rect.top + window.scrollY - 50,      // 50px above
    left: rect.left + window.scrollX + rect.width / 2 - 40,  // Centered
  });
}, [isVisible]);
```

---

## Component: FloatingAIBar

### Mode 1: Selection Mode (triggerSource === 'selection')

**Trigger:**
- User highlights text
- User clicks "Ask AI" on toolbar

**Behavior:**
```typescript
// Always shows selection
const hasSelection = true;

// Shows quick actions
showActions = true;

// Operates on stored selection
const selectedText = getSelectedText(); // Uses selectionRef

// Sends to API
body: {
  prompt: selectedText,    // The text user is editing
  option: "zap",           // Transformation mode
  command: userPrompt,     // What to do with it
  model: selectedModel
}
```

**Result Processing:**
- User can see completion preview
- Click "Replace" → Replaces selected text with result
- Click "Insert" → Inserts result below selection

### Mode 2: Slash Command Mode (triggerSource === 'slash')

**Trigger:**
- User types `/ai` command

**Behavior:**
```typescript
// Never has selection in this mode
const hasSelection = false;

// Shows NO quick actions
showActions = false;

// Generate at cursor
const { from } = editor.state.selection; // Current cursor

// Sends to API
body: {
  prompt: "",              // No existing text
  option: "generate",      // Generation mode
  command: userPrompt,     // Free-form command
  model: selectedModel
}
```

**Result Processing:**
- User can see completion preview
- Click "Replace" → Inserts at cursor
- Click "Insert" → Inserts with spacing

---

## Selection Handling

### Storing Selection (Preservation)

The tricky part: When user clicks in the floating bar input field, the editor loses focus and selection is lost. Solution:

```typescript
// When selection is detected
if (hasText) {
  selectionRef.current = { from, to };  // Store it!
}

// Later, when generating
const getSelectedText = () => {
  if (selectionRef.current) {
    const { from, to } = selectionRef.current;
    return editor.state.doc.textBetween(from, to, " ");
  }
  return editor.state.doc.textBetween(from, to, " ");
};

// When replacing
const { from, to } = selectionRef.current;
editor.chain().focus().insertContentAt({ from, to }, completion).run();
```

This allows the user to:
1. Select text
2. Click input field (selection lost in DOM)
3. Type command
4. Generate with the ORIGINAL selection

---

## Event Flow Diagram

```
User Highlights Text
        ↓
Selection Event Fires
        ↓
editor.on('selectionUpdate') / editor.on('update')
        ↓
updateSelection() runs
        ↓
Store in selectionRef ✓
        ↓
setShowToolbar(true)
        ↓
SelectionToolbar Component Renders
        ↓
User Clicks "Ask AI"
        ↓
handleToolbarAskAI()
        ↓
setIsVisible(true)
setTriggerSource('selection')
setShowActions(true)
        ↓
FloatingAIBar Renders with Quick Actions
        ↓
User Clicks Quick Action or Types Command
        ↓
handleGenerate() or handleQuickAction()
        ↓
API Call to /api/generate
        ↓
Stream Response to Completion
        ↓
Show Preview
        ↓
User Clicks Replace/Insert
        ↓
Replace: insertContentAt({ from, to }, completion) [selection mode]
Insert: insertContentAt(to, "\n\n" + completion)
        ↓
Reset States
        ↓
Bar Closes, Returns to Normal Editing
```

---

## API Integration

### Selection Mode Request
```typescript
POST /api/generate
{
  prompt: "The selected text here",
  option: "zap",                    // Transformation
  command: "make it more formal",   // User instruction
  model: "google/gemini-2.0-flash-exp:free"
}
```

### Slash Command Request
```typescript
POST /api/generate
{
  prompt: "",                       // No existing text
  option: "generate",               // Generation mode
  command: "write a summary",       // Free-form instruction
  model: "google/gemini-2.0-flash-exp:free"
}
```

### Response Streaming
Both modes stream response:
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  accumulatedText += chunk;
  setCompletion(accumulatedText);  // Real-time updates
}
```

---

## Quick Actions Configuration

```typescript
const quickActions = [
  { label: "Improve Writing", icon: Sparkles, prompt: "Improve the writing quality and clarity" },
  { label: "Shorten", icon: ArrowDownWideNarrow, prompt: "Make this shorter and more concise" },
  { label: "Elaborate", icon: WrapText, prompt: "Add more details and expand this" },
  { label: "More formal", icon: Briefcase, prompt: "Rewrite in a more formal, professional tone" },
  { label: "More casual", icon: MessageCircle, prompt: "Rewrite in a casual, friendly tone" },
  { label: "Bulletize", icon: List, prompt: "Convert this into bullet points" },
  { label: "Summarize", icon: FileText, prompt: "Create a concise summary" },
  { label: "Rewrite", icon: RotateCcw, prompt: "Rewrite this in a different way" },
];
```

Each action is a preset prompt that gets sent to the API.

---

## CSS/Styling Notes

### SelectionToolbar
- Fixed positioning (doesn't move with scrolling)
- Calculated top/left based on selection rect
- Z-index: 50 (high priority)
- Gradient button from teal to dark

### FloatingAIBar
- Fixed positioning
- Bottom-8, centered horizontally
- Z-index: 50
- Gradient background: teal → white → dark
- Rounded, shadowed container
- Responsive input field

### Animations
- Fade-in for toolbar
- Slide-in from bottom for bar
- Smooth transitions on all hover states

---

## Error Handling

### API Errors
```typescript
if (errorMsg.includes('402')) {
  toast.error("API credit limit reached. Please check your OpenRouter account.");
} else {
  toast.error("Failed to generate");
}
```

### Edge Cases
1. **No selection in selection mode** → Button disabled until text selected
2. **User clears selection** → Toolbar disappears
3. **No completion text** → Replace/Insert buttons disabled
4. **Network error** → Error toast shown, user can retry

---

## Performance Considerations

1. **Selection monitoring:** Runs on every update (optimized)
2. **Position recalculation:** Only when toolbar is visible
3. **Component re-renders:** Minimal due to separate state management
4. **Memory:** Selection stored as reference, not copied text

---

## Future Improvements

- [ ] Add undo/redo for selections
- [ ] Support multiple consecutive edits
- [ ] Add text analysis before suggestions
- [ ] Keyboard navigation for quick actions
- [ ] Persist user's preferred model choice
- [ ] Add model performance metrics
- [ ] Support custom quick action presets
- [ ] Add undo button in bar

---

## Testing Checklist

- [x] Toolbar appears only on text selection
- [x] Toolbar disappears when selection cleared
- [x] "Ask AI" click opens full bar in selection mode
- [x] /ai command opens full bar in slash mode
- [x] Quick actions work in selection mode
- [x] Custom prompts work in both modes
- [x] Selection is preserved when typing in input
- [x] Replace function works correctly
- [x] Insert function works correctly
- [x] Close button (X) properly resets state
- [x] ESC key closes bar
- [x] Enter key in input triggers generation
- [x] Model selection persists (localStorage)
- [x] Loading spinner shows during generation
- [x] Error messages display properly

---

This implementation provides a clean, intuitive interface for both selecting and transforming text AND generating new content from scratch. The separation of concerns (toolbar vs full bar, selection vs slash) eliminates the buggy behavior from the previous implementation.
