# Rapid Capture Mode + Inspector Vibe Refresh

**Labels:** `mobile` `ux` `core-loop` `field-mode` `high`  
**Surface:** Mobile first  
**Status:** Proposed  
**Source:** Building inspector user feedback  
**Related:** `docs/remake-item-capture-ticket.md`, `docs/archive/friction-in-inspection-flow.md`

---

## Context

Recent feedback from target users was consistent and unusually specific:

- "Too many steps."
- "It needs to be more bang, bang, then done."
- "Very generic, I'm not feeling like I am an inspector."

The current flow is usable, but it still behaves too much like a guided form workflow. The product asks the inspector to stop, review, and confirm too often, and the visual language still feels closer to a customisable report card than a field inspection tool.

This ticket reframes the core mobile inspection experience around one principle:

**Inspect first. Review exceptions second. Report last.**

The goal is to make Notara feel fast, operational, and purpose-built for inspectors in the field.

---

## Product Shift

### Current mode

- Capture is interrupted by too many review decisions
- Every item feels like a mini form
- The UI reads as soft, generic, and admin-oriented
- Users can finish an item or room without a strong sense of what to do next

### Target mode

- Camera and evidence capture are the primary workflow
- High-confidence items save fast with minimal interruption
- Review is reserved for low-confidence or issue-heavy items
- The interface feels like an inspection assistant, not a report builder
- Every completed item and room leads directly into the next step

---

## MVP Focus For Demo

For the internal demo, prioritise the smallest set of changes that most
clearly improve speed, momentum, and field-tool credibility:

- Auto-save high-confidence items with lightweight `Undo` and `Edit`
- Auto-advance to the next relevant item after save
- Show a strong next-room or next-stage CTA when a room is complete
- Surface captured, flagged, and remaining progress clearly
- Refresh field-mode copy on active inspection screens
- Keep reporting and admin actions visually secondary until capture is complete

Anything larger than this should only ship pre-demo if it directly
reduces interruption in the live inspection loop.

---

## Experience Goals

1. **Reduce per-item effort**
   - Clean items should take one capture and, when confidence is high, no extra confirmation step.

2. **Review by exception**
   - The user should only stop for manual review when AI is uncertain, when an issue is likely, or when the user explicitly chooses to edit.

3. **Keep momentum after every completion**
   - Finishing an item should naturally move the user to the next item.
   - Finishing a room should naturally move the user to the next room or the next inspection stage.

4. **Make the product feel built for inspectors**
   - Stronger operational language, clearer progress, evidence-first UI, and more purposeful visual hierarchy.

5. **Preserve trust and control**
   - Fast paths must still allow quick undo, manual correction, and issue flagging without hiding important decisions.

---

## Proposed Interaction Model

### A. Rapid item loop

| Step | What happens |
| ---- | ------------ |
| 1 | Inspector taps an item |
| 2 | Camera opens immediately |
| 3 | Inspector captures photo |
| 4 | AI analyses photo against the tapped item |
| 5 | If confidence is high and no issue is detected, item auto-saves |
| 6 | A lightweight confirmation appears: `"Sink saved as Good"` with `Undo` / `Edit`, and clearly calls out the next item |
| 7 | The next unconfirmed item becomes the active target immediately |

### B. Exception path

If AI confidence is not high, or the result looks like a defect / ambiguous condition:

- open compact review UI
- show condition selector + editable description
- allow `Confirm`, `Retake`, `Skip photo` where valid
- return to rapid progression immediately after confirm

### C. Room completion path

When the last required item in a room is completed:

- show a clear room completion state
- primary CTA:
  - `Next room` if another incomplete room exists
  - `Finish inspection review` if all rooms are done
- secondary CTA:
  - `Review flagged items`
- tertiary CTA:
  - `Back to inspection`

The user should never finish a room and wonder what the next step is.

---

## Design Principles

1. **Evidence first**
   - Photos are the hero action. Forms are secondary and only appear when needed.

2. **One obvious next action**
   - Every screen and completion state must clearly show what comes next.

3. **Operational, not decorative**
   - Status, progress, issues, and evidence should dominate the interface, not empty card chrome.

4. **Fast path by default**
   - Clean items move through the system with minimal taps.

5. **Manual control without bureaucracy**
   - Editing must stay available, but it should not block the primary loop.

---

## Tasks

### 1. Introduce Rapid Capture Mode on room screens

- Rework the room experience around a fast item-by-item capture loop.
- Tapping an item should launch capture immediately.
- High-confidence AI results should auto-save by default instead of always forcing confirm.
- Show a transient save confirmation with lightweight `Undo` and `Edit` actions.

### 2. Add auto-advance to the next item

- After an item is saved, automatically advance focus to the next unconfirmed item in the room.
- The next item should feel "armed" and ready to capture.
- Visually distinguish the next suggested item from the rest of the list.
- If the user edits or undoes, keep them in context rather than resetting the whole flow.

### 3. Add explicit next-step progression after room completion

- When a room is complete, immediately present the next stage.
- Primary CTA rules:
  - if another incomplete room exists: `Next room`
  - if no rooms remain: `Finish inspection review`
- Secondary action: `Review flagged items`
- Do not rely on the header back button as the main way to continue the workflow.

### 4. Add exception-first review behavior

- Introduce confidence-based handling:
  - high confidence + non-problem result -> auto-save
  - medium/low confidence -> compact review required
  - explicit issue or defect indicators -> compact review required
- Add a dedicated "flagged items" or "needs review" queue at room/inspection level.
- Make review feel like clearing exceptions, not filling forms.

### 5. Improve inspector-specific product language

Replace generic/report-builder language with field-tool language. Examples:

- `Checklist` -> `Inspection points` or `Items to capture`
- `Upload photo` -> `Capture evidence`
- `Open review` -> `Review flagged items`
- `Confirmed` -> `Captured`
- `Generate report` remains valid at end-stage, but should not dominate field screens

Use language that feels practical, operational, and specific to inspection work.

### 6. Refresh the visual vibe toward "inspection assistant"

- Make the camera/capture action visually dominant
- Increase contrast and reduce soft generic card styling
- Show room progress clearly, e.g. `Kitchen 4/7 captured`
- Surface evidence thumbnails, issue markers, and confidence states more clearly
- Make status colours and labels feel purposeful, not decorative
- Separate field mode visually from admin/setup/template-builder screens

The mobile inspection flow should feel like a field tool. Template editing and reporting can remain more administrative.

### 7. Keep reporting secondary during active inspection

- Remove or de-emphasise report-oriented language and actions from room
  and item capture screens.
- Make the primary framing about evidence capture, progress, flagged
  items, and what comes next.
- Reserve `Generate report` and other end-stage actions for review and
  completion states, not the active capture loop.

### 8. Add stronger issue and progress framing

- Show a visible count of:
  - captured items
  - flagged items
  - remaining items
- At room level, emphasise completion and unresolved exceptions
- At inspection level, emphasise remaining work and next room
- Make "what should I do next?" obvious without the user needing to infer it

### 9. Preserve fast manual fallback paths

- Users must still be able to:
  - manually edit condition and description
  - retake a photo
  - choose from library where needed
  - mark `N/A`
  - skip photo when rules allow
- These must remain available without becoming the default path for every item

---

## Hard Rules

- Optimise for the fastest safe field workflow, not the most explicit form flow
- Do not force a confirmation step for every high-confidence item
- Do not leave the user without an obvious next-step CTA after item or room completion
- During active inspection, the UI should answer "what is the next capture task?" before it answers reporting or admin questions
- Preserve backend-routed AI architecture; do not call AI providers directly from mobile
- All colours must continue to reference theme tokens
- Any new fast path must preserve easy undo or edit affordances

---

## Success Criteria

- [ ] A clean, high-confidence item can be completed without a mandatory full review sheet
- [ ] After saving an item, the flow naturally advances to the next item
- [ ] After completing a room, the user sees a strong primary CTA for the next room or the next stage
- [ ] Low-confidence or issue-heavy items still support quick manual review
- [ ] The product language feels specific to inspectors and field capture
- [ ] The inspection flow feels more like an assistant for evidence capture than a report-builder UI
- [ ] Users can tell at a glance what is captured, what is flagged, and what remains
- [ ] The end-to-end mobile flow requires fewer interrupts and fewer decisions on clean items
- [ ] Reporting and admin actions stay visually secondary until capture is complete

---

## Suggested Delivery Order

### Phase 1 — Speed

- Auto-save high-confidence items
- Add auto-advance
- Add next-room / next-stage CTA after room completion
- Keep report/admin actions secondary on active capture screens

### Phase 2 — Exception workflow

- Add flagged-item queue
- Route medium/low confidence outcomes into compact review
- Add better undo/edit affordances

### Phase 3 — Inspector vibe

- Update field-mode copy
- Refresh visual hierarchy for capture, progress, and issues
- Strengthen room/inspection progress framing

---

## Out of Scope

- Full report template redesign
- Web dashboard redesign
- Offline sync architecture changes
- Large template-builder redesign

---

## Note for Implementation

This ticket should be treated as a core-loop product improvement, not just a UI polish pass.

The main question during implementation is:

**"Does this reduce interruption and help the inspector move forward immediately?"**

If a new interaction adds ceremony without increasing trust or speed, it is the wrong direction.
