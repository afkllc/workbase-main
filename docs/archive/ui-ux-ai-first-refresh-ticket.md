# Workbase AI-First UI Refresh Ticket

**Date:** 2026-03-29  
**Owner:** Product + Design + Frontend/Mobile Engineering  
**Status:** Proposed  
**Related:** `docs/ui-ux-audit.md`

---

## 1. Why This Ticket Exists

The current interface is functional but feels form-heavy, flat, and engineering-oriented.  
For an AI-first platform, the default user experience should feel:

- assisted, not manual
- conversational, not bureaucratic
- confident, not ambiguous
- guided end-to-end, not screen-by-screen data entry

This ticket defines a visual and interaction refresh that makes Workbase feel AI-first across mobile and web.

---

## 2. Product UX Shift

### Current mode
- Long forms and manual field completion
- AI appears as a secondary feature in parts of the flow
- Visual language is neutral/bland and low-emphasis

### Target mode
- AI acts as the primary co-pilot from first action to report output
- Users review, correct, and approve rather than type everything
- Interface communicates intelligence, speed, and confidence

---

## 3. Design Principles (AI-First)

1. **Prompt before form**
   - Start workflows with intent capture ("Create check-in for 12 High Street tomorrow").

2. **Evidence-first capture**
   - Photos/video/voice are primary inputs; forms are fallback or refinement.

3. **Review by exception**
   - Show uncertain or missing items first; bulk-approve high-confidence items.

4. **Confidence with transparency**
   - Every AI suggestion shows confidence and source context; user can edit at any step.

5. **Progressive disclosure**
   - Keep advanced/manual fields collapsed until needed.

---

## 4. Proposed New Interface Direction

### 4.1 App-level UX framing

- Replace "admin/dashboard" framing with "Inspection Assistant" framing.
- Introduce a consistent top-level AI action bar:
  - `Ask AI`
  - `Summarize progress`
  - `What should I do next?`

### 4.2 Key screen concepts

1. **Home: AI Briefing + Action Queue**
   - "Good morning, you have 3 inspections today."
   - Priority cards: `Needs review`, `Ready to report`, `Missing photos`
   - Quick AI prompt input for starting/continuing work

2. **New Inspection: Intent-led creation**
   - Primary: natural-language creation (address/date/template hints)
   - Secondary: manual fields under "Edit details"
   - AI pre-fills landlord/tenant/date where possible

3. **Room Capture: Camera-first assistant**
   - Primary action: `Capture room` (camera)
   - AI immediately proposes checklist updates
   - Inline actions: `Accept all high confidence`, `Review uncertain (3)`

4. **Sections: Assisted completion**
   - AI suggestions from prior entries/photos with confirm chips
   - Manual inputs shown only when suggestion missing or user expands
   - Dirty state visible and non-intrusive

5. **Review: Exception-focused workspace**
   - Default filter: unconfirmed/low confidence items
   - Batch actions per room and global
   - Plain-language explanation before report generation

6. **Reports: In-app summary and narrative**
   - Report card with key findings, risk flags, and completion timeline
   - In-app preview by default (mobile decision-gated)

---

## 5. Visual Refresh Direction

### 5.1 Brand feel

Target visual mood: **"Field intelligence you can trust."**

- Higher contrast hierarchy
- Less grey-on-grey
- Stronger semantic color usage
- Icon-led guidance where it improves scanability

### 5.2 Type system (proposal)

- Display: stronger heading style for key moments (briefing, readiness, completion)
- UI text: highly legible body and input text
- Metadata: compact but readable labels, never "washed out"

### 5.3 Color system (proposal)

- Keep blue as core trust color
- Add intentional semantic accents:
  - success readiness
  - attention/review needed
  - destructive action
  - AI-assist highlight
- Remove low-contrast text combinations on muted surfaces

### 5.4 Motion and feedback

- Subtle transitions for state changes (save, confirm, generate)
- Immediate success confirmations (toast/banner/inline state)
- Loading skeletons for primary cards and lists

---

## 6. AI-First Interaction Patterns to Add

1. **AI Command Input**
   - A small persistent entry point for task-level prompts.

2. **Suggestion Cards with Controls**
   - Each suggestion supports: accept, edit, dismiss, ask why.

3. **Confidence Buckets**
   - Group outputs: high confidence (bulk-approve), medium, low (needs review).

4. **Smart Prefill**
   - Parse address/date/people from prompt or prior context.

5. **Explainability Snippets**
   - Short "why this suggestion" lines for trust and auditability.

6. **One-tap Recovery**
   - "Undo last AI action" for confidence and safety.

---

## 7. Scope and Phasing

### Phase 0 (Decision Gates)
- Decide web direction: mobile-companion vs desktop-first responsive dashboard
- Decide mobile report behavior: external open vs in-app preview

### Phase 1 (High-impact polish, low complexity)
- UI copy refresh (remove technical/internal phrasing)
- Focus and accessibility fixes
- Success feedback system
- Condition label normalization (`N/A`, etc.)
- Empty state upgrades

### Phase 2 (AI-first experience layer)
- AI command input entry point
- Intent-led inspection creation
- Exception-first review mode
- Bulk accept/confirm flows

### Phase 3 (visual and structural upgrade)
- Full tokenized visual system update
- Responsive web layout (if desktop-first selected)
- Enhanced in-app report experience

---

## 8. Acceptance Criteria (Design + UX)

This ticket is complete when:

1. New users can complete first inspection flow with less manual typing and clearer guidance.
2. AI assistance appears at start, mid-flow, and end-flow (not only in room capture).
3. Every critical action has visible feedback (success/failure/progress).
4. Web and mobile share consistent language, condition labels, and confidence semantics.
5. Visual hierarchy feels intentional (clear primary actions, readable type, stronger contrast).
6. Exception-first review measurably reduces confirm/report time in internal QA walkthroughs.

---

## 9. Implementation Notes for IDE

Use this ticket with `docs/ui-ux-audit.md`:

- `ui-ux-audit.md` = baseline fixes and detailed backlog
- `ui-ux-ai-first-refresh-ticket.md` = new UI direction and AI-first interaction model

Implementation guidance:

1. Start with Phase 1 items from the audit backlog (`UX-01` to `UX-06`).
2. Then implement Phase 2 interaction patterns in thin vertical slices.
3. Keep AI-assisted and manual fallback paths available on every critical form.
4. Validate each slice against the acceptance criteria above before moving on.

---

## 10. Out of Scope (for now)

- Full offline sync architecture changes
- Signature capture
- Full report template redesign for branded PDF output
- Multi-tenant theming/white-label support

---

## 11. Proposed Next Step

Create a paired implementation ticket set:

1. **Execution Ticket A:** Phase 1 polish and accessibility backlog
2. **Execution Ticket B:** AI-first interaction layer (prompt-first, review-by-exception)
3. **Execution Ticket C:** Visual system refresh and responsive web direction

This keeps delivery incremental while moving the product toward a clearly AI-first experience.

