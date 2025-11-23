# AI Writing Assistant UX Best Practices Research

## Top Tools Analysis

### 1. **Notion AI** (Industry Leader)
**Positioning:**
- Appears inline at cursor position when triggered
- Compact command menu (not full modal)
- Bottom-center for global commands

**Interaction:**
- Slash command (/) to trigger
- Cmd/Ctrl+J for AI menu
- Instant inline results
- Easy dismiss: Click outside, Esc, or just keep typing

**Design:**
- Minimal, non-intrusive
- Purple accent color
- Smooth animations (fade + slide)
- Ghost text shows AI is thinking

### 2. **ChatGPT / Claude**
**Positioning:**
- Fixed bottom input bar
- Full-width textarea
- Results stream in place

**Interaction:**
- Always visible input
- Enter to send
- Streaming responses
- Clear regenerate/edit options

### 3. **Grammarly**
**Positioning:**
- Small floating button near selection
- Expands to tooltip on hover
- Suggestions appear inline

**Interaction:**
- Click suggestion to apply
- One-click fixes
- Non-modal (doesn't block editing)

### 4. **GitHub Copilot**
**Positioning:**
- Inline ghost text
- Minimal UI
- Suggestions appear at cursor

**Interaction:**
- Tab to accept
- Esc to dismiss
- Non-intrusive
- Works while typing

## Best Practices Summary

### ✅ DO:
1. **Position bottom-center** for global actions (like toolbar)
2. **Make it dismissible** - Click outside, Esc, or X button
3. **Minimize vertical space** - Compact header, no wasted padding
4. **Inline results** - Show AI output in the editor, not in modal
5. **Keyboard shortcuts** - Ctrl+Enter to generate, Esc to close
6. **Visual feedback** - Loading states, pulsing dot, progress
7. **Smart suggestions** - Context-aware quick actions
8. **Smooth animations** - Fade in/out, slide up/down (200-300ms)
9. **Click-outside-to-close** - Standard modal behavior
10. **One action per popup** - Don't combine multiple features

### ❌ DON'T:
1. **Don't block the editor** - Use overlay but keep editor visible
2. **Don't make it huge** - Max 500-600px width
3. **Don't auto-popup** - Only show when user triggers
4. **Don't hide shortcuts** - Make Esc/Enter obvious
5. **Don't require scrolling** - Keep common actions visible
6. **Don't use bright colors** - Subtle, dark theme
7. **Don't overlap selected text** - Position away from selection
8. **Don't make closing hard** - Multiple exit paths

## Recommended Design for Our Tool

### Layout:
```
┌─────────────────────────────────────┐
│ ● AI  |  45 words  |  Esc      ✕   │  ← Minimal header
├─────────────────────────────────────┤
│ What would you like to do?          │  ← Input area
│ [                                 ] │
│                                     │
│ 💡 Make professional                 │  ← Quick actions
│ 🔧 Fix grammar                       │
│ ✨ Improve clarity                   │
└─────────────────────────────────────┘
         ↑ Bottom center of screen
```

### Behavior:
- **Trigger**: Highlight text + Ctrl+Space or click "Ask AI"
- **Position**: Bottom-center, floating above editor
- **Dismiss**: Click backdrop, Esc, or X button
- **Result**: Replace selection or insert below
- **Animation**: 200ms fade + slide from bottom

### Colors (Dark Theme):
- Background: `#0E0F0F` (pure black)
- Border: `#2A2A2D` (subtle gray)
- Accent: `#1CBF79` (brand green)
- Backdrop: `rgba(0,0,0,0.6)` with blur

### Dimensions:
- Width: 500-600px max
- Height: Auto (max 400px)
- Padding: Minimal (12-16px)
- Border radius: 12-16px

### Keyboard Shortcuts:
- **Ctrl+Space**: Open AI assistant
- **Ctrl+Enter**: Generate/Submit
- **Esc**: Close
- **↑/↓**: Navigate suggestions
- **Enter**: Select suggestion

## Implementation Priority

### Phase 1: Core UX (DO NOW)
1. ✅ Move to bottom-center fixed position
2. ✅ Add backdrop overlay (click to close)
3. ✅ Simplify header (just icon, word count, close)
4. ✅ Make input prominent and focused
5. ✅ Add quick action buttons
6. ✅ Smooth animations (fade + slide)

### Phase 2: Polish (NEXT)
7. Better keyboard navigation
8. Inline result insertion
9. Undo/redo support
10. Loading states with progress

### Phase 3: Advanced (LATER)
11. Context-aware suggestions
12. History of past commands
13. Model selection dropdown
14. Settings/preferences

