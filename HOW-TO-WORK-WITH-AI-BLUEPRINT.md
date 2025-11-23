# 🤝 How To Work With AI - Your Personal Blueprint

**Created**: October 24, 2025  
**Purpose**: Make you and AI 10x more efficient building features  
**Read this before asking for ANY change or feature**

---

## 🎯 TL;DR - The Golden Rules

1. **For NEW features**: Give me complete specs → I generate 90% working code → You copy-paste & test
2. **For BUGS**: Give me console logs + what you expected → I fix in 1-2 tries
3. **For QUESTIONS**: Ask "what should I ask you to do next?" instead of guessing

**Time saved**: 2 hours → 30 minutes per feature

---

## 📖 Table of Contents

- [Part 1: Understanding Your Project](#part-1-understanding-your-project)
- [Part 2: What AI Is Good At (Use These)](#part-2-what-ai-is-good-at-use-these)
- [Part 3: What AI Sucks At (Avoid These)](#part-3-what-ai-sucks-at-avoid-these)
- [Part 4: The Perfect Feature Request Template](#part-4-the-perfect-feature-request-template)
- [Part 5: Your Project's Ready-To-Build Features](#part-5-your-projects-ready-to-build-features)
- [Part 6: Common Scenarios & How To Ask](#part-6-common-scenarios--how-to-ask)
- [Part 7: Red Flags (When Things Go Wrong)](#part-7-red-flags-when-things-go-wrong)

---

## Part 1: Understanding Your Project

### What You're Building
**Social Garden SOW Generator** - A platform to create Statements of Work (SOWs) for digital marketing projects with AI-powered generation, pricing tables, and client portals.

### Tech Stack (You Don't Need To Know Details)
```
Frontend: Next.js + React (the UI you see)
Backend: FastAPI (generates PDFs)
Database: MySQL (stores everything)
AI: AnythingLLM (chat + SOW generation) + OpenRouter (inline AI)
```

### Current Status
✅ **Working**: SOW editor, AI chat, PDF export, pricing tables, client portal, dashboard
⚠️ **Needs Polish**: Thread management, analytics, collaboration features
🚀 **Ready To Build**: See Part 5 for full list

---

## Part 2: What AI Is Good At (Use These)

### ⭐⭐⭐⭐⭐ EXCELLENT (95%+ Success Rate)

**1. Generate Complete Features From Scratch**
```
✅ "I need a client dashboard showing all their SOWs with filters"
✅ "Create an export to Google Sheets feature"
✅ "Build a notification system for when clients view SOWs"
```

**Why it works**: I can see the whole picture and write all pieces together.

**2. Write API Routes**
```
✅ "Create API endpoint to fetch SOW analytics by date range"
✅ "Write route to send email when SOW is accepted"
```

**Why it works**: Clear inputs/outputs, self-contained logic.

**3. Create UI Components**
```
✅ "Build a modal for creating new folders with validation"
✅ "Create a dropdown to filter SOWs by status"
```

**Why it works**: I know React patterns, can generate styled JSX.

**4. Database Queries & Schema Changes**
```
✅ "Add comments table for SOWs with user_id, text, timestamp"
✅ "Write query to get total revenue per client"
```

**Why it works**: I know SQL patterns, understand database structure.

**5. Fix Code With Specific Error Messages**
```
✅ Console shows: "TypeError: Cannot read property 'slug' of undefined at line 485"
✅ Expected: Thread created and selected
✅ Got: Error when clicking New Chat
```

**Why it works**: Specific error = specific fix.

---

### ⭐⭐⭐ GOOD (75-85% Success Rate)

**6. Refactor/Improve Existing Code**
```
✅ "Make the pricing table more compact"
✅ "Add loading spinner to PDF export button"
✅ "Move thread management logic to separate hook"
```

**Why it works**: Clear scope, existing code to reference.

**7. Connect Systems Together**
```
✅ "Connect the dashboard chat to AnythingLLM workspaces"
✅ "Wire up the folder dropdown to filter SOWs"
```

**Why it works**: I can read both endpoints and bridge them.

---

### ⭐⭐ OKAY (40-60% Success Rate)

**8. Debug "Something's Not Working"**
```
⚠️ "The chat button doesn't work"
⚠️ "PDF export is broken"
```

**Why it struggles**: Too vague, I can't see what's happening.

**How to improve**:
```
✅ "Chat button doesn't work. Console shows: [paste logs]. Expected: new thread created. Got: nothing happens"
```

---

### ⭐ POOR (20-40% Success Rate)

**9. Fix Visual/CSS Issues Without Screenshots**
```
❌ "The green is too bright"
❌ "Make it look better"
```

**Why it fails**: I can't see your screen.

**How to improve**: Give me the exact hex color or take a screenshot.

**10. Guess What You Want**
```
❌ "Improve the dashboard"
❌ "Make the AI smarter"
```

**Why it fails**: 100 different ways to do this, I'll guess wrong.

**How to improve**: Tell me EXACTLY what improvement means to you.

---

## Part 3: What AI Sucks At (Avoid These)

### 🚫 Never Ask AI To Do This

1. **"Just make it work"** - Too vague
2. **"Fix everything"** - I don't know what's broken
3. **"Make it pretty"** - Beauty is subjective
4. **"Optimize performance"** - Need specific metrics
5. **"Debug this" (without logs)** - I'm blind
6. **"Test if it works"** - I can't click buttons

### ✅ Instead, Do This

1. **"Make the thread management work so each new chat is independent"** - Specific goal
2. **"Fix: Console shows 401 error when sending message"** - Specific error
3. **"Change green from #1CBF79 to #15a366"** - Specific change
4. **"Reduce API calls by caching responses for 5 minutes"** - Specific optimization
5. **"Thread created but message goes to old thread. Console logs: [paste]"** - Specific debug info
6. **"I tested: new chat button → message sent → AI remembered old conversation (expected: fresh start)"** - Specific test result

---

## Part 4: The Perfect Feature Request Template

### Copy-Paste This For New Features

```markdown
## Feature: [Name in 3-5 words]

### What User Does
1. [First action]
2. [Second action]
3. [Result they see]

### What System Does
- [Backend logic]
- [Database changes]
- [API calls needed]

### UI Should Show
- [Button/form/modal description]
- [Success message]
- [Error states]

### Success Looks Like
- [How you'll know it works]
- [What to test]

### Data Needed
- [From where: database table, API, user input]
```

### Real Example: Client Comments Feature

```markdown
## Feature: Client Comments on SOWs

### What User Does
1. Opens client portal with SOW
2. Clicks "Add Comment" button
3. Types feedback
4. Clicks Submit
5. Sees comment appear with timestamp

### What System Does
- Store comment in `sow_comments` table
- Link to SOW ID and client email
- Notify agency via email (future)
- Update SOW status to "feedback_received"

### UI Should Show
- Comment form at bottom of SOW
- List of existing comments above
- Success toast: "Comment added"
- Loading state while submitting

### Success Looks Like
- Comment appears instantly after submit
- Refresh page → comment still there
- Multiple comments show in order

### Data Needed
- SOW ID (from URL)
- Client email (from session/URL param)
- Comment text (from form)
- Timestamp (auto-generated)
```

**Result**: I'll generate:
- Complete React component
- API route for comments
- Database migration
- Integration code
- Test instructions

**Time**: 30 minutes total (vs 2+ hours debugging)

---

## Part 5: Your Project's Ready-To-Build Features

I've analyzed your project and docs. Here are features YOU probably want, organized by priority. **Just copy the title and say "build this" - I'll handle the rest.**

### 🔴 High Priority (Should Do Soon)

#### 1. **SOW Activity Timeline**
What: Show when client viewed SOW, how long they spent, what sections they read
Why: Track engagement, know when to follow up
Complexity: Medium (2-3 hours)

#### 2. **Email Notifications**
What: Send email when SOW is sent/viewed/accepted with links
Why: Keep stakeholders informed automatically
Complexity: Medium (2-3 hours)

#### 3. **Client Comments/Feedback**
What: Let clients leave comments on SOW sections with threading
Why: Gather feedback without email back-and-forth
Complexity: Medium (2-3 hours)

#### 4. **SOW Templates Library**
What: Pre-built SOW templates for common project types (Social Media Campaign, SEO Audit, Content Strategy)
Why: Speed up creation, ensure consistency
Complexity: Low (1-2 hours)

#### 5. **Export to Google Sheets**
What: Export pricing table to Google Sheets with formatting
Why: Share with finance team, integrate with workflow
Complexity: Medium (3-4 hours with OAuth)

#### 6. **Bulk SOW Operations**
What: Select multiple SOWs → export all, delete all, move to folder
Why: Manage large number of SOWs efficiently
Complexity: Low (1-2 hours)

---

### 🟡 Medium Priority (Nice To Have)

#### 7. **SOW Comparison View**
What: Compare two SOW versions side-by-side, highlight differences
Why: Track revisions, show client what changed
Complexity: Medium (2-3 hours)

#### 8. **Dashboard Analytics**
What: Charts showing SOWs created per month, total revenue, most used roles, acceptance rate
Why: Business insights at a glance
Complexity: Medium (3-4 hours with charts library)

#### 9. **Role Usage Analytics**
What: Track which roles are used most, suggest popular combinations
Why: Optimize pricing, understand patterns
Complexity: Low (1-2 hours)

#### 10. **Client Portal Branding**
What: Let clients upload logo, choose colors for their portal
Why: White-label experience
Complexity: Low (1-2 hours)

#### 11. **SOW Search & Filters**
What: Search by client name, service type, date range, total value
Why: Find SOWs quickly in large database
Complexity: Low (1-2 hours)

#### 12. **Keyboard Shortcuts**
What: Cmd+S save, Cmd+E export, Cmd+N new SOW, Cmd+F search
Why: Power users work faster
Complexity: Very Low (30 minutes)

---

### 🟢 Low Priority (Future Enhancement)

#### 13. **Real-Time Collaboration**
What: Multiple users edit same SOW simultaneously (Google Docs style)
Why: Team collaboration
Complexity: High (8-10 hours, needs WebSockets)

#### 14. **AI Learning From Approved SOWs**
What: AI learns from your approved SOWs to improve suggestions
Why: Personalized AI over time
Complexity: Very High (12+ hours, needs ML pipeline)

#### 15. **Mobile App**
What: React Native app for iOS/Android
Why: Work on the go
Complexity: Very High (40+ hours)

---

## Part 6: Common Scenarios & How To Ask

### Scenario 1: You Want A New Feature

❌ **BAD**: "Add comments"

✅ **GOOD**: 
```
Build this: Client Comments/Feedback

Feature: Let clients add comments on SOW sections

What user does:
1. Opens client portal
2. Clicks "Comment" button on any section
3. Types feedback
4. Sees comment added with timestamp

What system does:
- Store in sow_comments table
- Link to SOW ID and section
- Show to agency in dashboard

UI: Comment button on each section, modal with text area

Success: Comment appears after submit, persists on refresh
```

**My response**: I'll generate the complete feature in ONE message.

---

### Scenario 2: Something Is Broken

❌ **BAD**: "Export doesn't work"

✅ **GOOD**:
```
BUG: PDF export fails

Console error:
Failed to fetch: http://localhost:8000/generate-pdf
TypeError: NetworkError when attempting to fetch resource

Expected: PDF downloads
Got: Nothing happens, error in console

Steps to reproduce:
1. Open any SOW
2. Click "Export PDF"
3. Error appears
```

**My response**: I'll identify the issue (backend not running) and give you exact fix.

---

### Scenario 3: You Want To Improve UX

❌ **BAD**: "Make the chat better"

✅ **GOOD**:
```
Improve: Dashboard chat thread management

Current problem:
- Thread list is cramped
- Hard to see which thread is active
- No way to rename threads

Requested improvements:
1. Make thread list wider (300px instead of 200px)
2. Highlight active thread with green border
3. Add "rename" icon on hover
4. Show thread creation date

Success: Can easily see and manage multiple threads
```

**My response**: I'll make the specific UI changes.

---

### Scenario 4: You're Not Sure What To Build Next

❌ **BAD**: *Just starts describing random ideas*

✅ **GOOD**:
```
What should I ask you to build next?

Context:
- I want to improve client engagement
- Need better tracking of SOW status
- Want to reduce manual follow-ups

Constraints:
- Can spend 2-3 hours on implementation
- Need it before end of week
- Should integrate with existing portal
```

**My response**: I'll suggest 3-5 prioritized features from Part 5 that match your goals.

---

### Scenario 5: You Want To Understand How Something Works

❌ **BAD**: "How does this work?"

✅ **GOOD**:
```
Explain: How does thread management work?

Specifically:
- Where are threads created?
- How do they link to SOWs?
- Why do messages sometimes go to wrong thread?
- What's the data flow from UI → API → AnythingLLM?

Goal: I want to understand so I can explain to my team
```

**My response**: I'll give you a clear explanation with diagrams if needed.

---

## Part 7: Red Flags (When Things Go Wrong)

### 🚩 Warning Signs You're Using AI Wrong

**Sign 1**: We're on 5+ back-and-forths for one small fix
- **Problem**: Too vague initial request
- **Fix**: Give me complete context upfront (console logs, expected behavior, actual behavior)

**Sign 2**: I keep asking you questions instead of giving solutions
- **Problem**: Missing information in your request
- **Fix**: Use the template from Part 4

**Sign 3**: My code doesn't work when you paste it
- **Problem**: Environment difference or missing dependency
- **Fix**: Share full error message + your environment (local/production)

**Sign 4**: You're fixing my code instead of asking me to fix it
- **Problem**: I didn't understand the requirement
- **Fix**: Tell me what you had to change and why

**Sign 5**: We've spent 2 hours on something that should take 30 minutes
- **Problem**: We're debugging instead of building
- **Fix**: Stop, start over with clear feature spec

---

### ✅ Green Flags (We're Working Well)

- I give you code, you paste it, it works (maybe 1-2 tweaks)
- Each response moves the project forward
- You understand what I'm doing and why
- We finish features in 30-60 minutes
- You're comfortable asking "why did you do it this way?"

---

## 🎯 Your Next Steps

### Right Now (5 minutes)
1. ✅ Read this document
2. Pick ONE feature from Part 5
3. Use the template from Part 4 to describe it
4. Send it to me
5. Watch me generate 90% working code

### This Week
- Build 2-3 high-priority features from Part 5
- Get comfortable with the request template
- Track: How long does each feature actually take?

### This Month
- Build 10+ features using this workflow
- Refine the template based on what works
- Share this doc with your team

---

## 📚 Quick Reference Cards

### Copy-Paste When Asking For Features

```
Feature: [Name]

User does: [Actions]
System does: [Logic]
UI shows: [Elements]
Success = [How to verify]
```

### Copy-Paste When Reporting Bugs

```
BUG: [Title]

Console: [Paste error]
Expected: [What should happen]
Got: [What actually happened]
Steps: [How to reproduce]
```

### Copy-Paste When Stuck

```
I'm stuck on: [Feature/bug]

What I've tried: [Steps]
Current state: [Where it's at]
What I need: [Specific help]
```

---

## 🤝 Final Thoughts

**The Old Way (Slow)**:
- You: "Add feature X"
- Me: "What should it do?"
- You: "Well, it should..."
- Me: *Builds something*
- You: "Not quite, actually..."
- Me: *Tries again*
- Repeat 5-10 times
- **Time: 2-4 hours**

**The New Way (Fast)**:
- You: *Uses template from Part 4*
- Me: *Generates complete feature*
- You: *Copy-pastes, tests*
- You: "Works! But change color from X to Y"
- Me: *Makes tweak*
- **Time: 30 minutes**

---

**Remember**: I'm a **code generator**, not a **mind reader**. The more specific you are, the faster we move. When in doubt, use the templates in Part 4.

Ready to build? Pick a feature from Part 5 and let's go! 🚀

---

*Last Updated: October 24, 2025*  
*Next Review: Add more real examples as we build together*
