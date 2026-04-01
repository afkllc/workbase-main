# WB-UX-002: Inspection Flow Friction Fixes

**Date:** 2026-03-31
**Status:** Ready for implementation
**Platform:** Mobile only (`mobile/`)
**Audience:** Developer + Cursor
**Source:** Cursor friction audit against end-to-end inspection flow
**Related:** WB-UX-001 (AI-First UI Refresh), PR 1 (Seamless flow)

---

## Context

A code-level friction audit traced the full inspection loop from creation
through to report generation. Seven concrete friction points were identified,
all grounded in specific files and line references. This ticket addresses
them as a focused fix pass — no new features, no backend changes.

**For Cursor:** execute each fix against the actual files listed. Do not
describe or plan — implement and return diffs. All fixes must pass
`npm run typecheck` and `npx expo export --platform web` before the PR
is raised.

---

## Hard rules

- No backend or API changes
- No new routes
- No new libraries without discussion
- All colours must reference `src/theme/colours.ts`
- Must pass `npm run typecheck` and `npx expo export --platform web`

---

## Fixes — in priority order

---

### FIX 1 — Add explicit "done" CTA to room capture screen

**File:** `mobile/app/inspection/[inspectionId]/room/[roomId].tsx` L192–203

**Problem:** After working through checklist items, there is no primary
action to move forward. The only exit is the header back button or OS
back gesture — the flow stalls rather than progresses.

**Fix:** Below the checklist `Card` (after L203), add a primary `Button`
labelled `Back to inspection` that routes to
`/inspection/${inspection.id}`. Keep the header back behaviour as a
secondary path — do not remove it.

---

### FIX 2 — Promote primary CTA on video scan screen

**File:** `mobile/app/inspection/[inspectionId]/room/[roomId]/video-scan.tsx`
L93–133

**Problem:** After running a scan, the return CTAs (`Back to capture`,
`Open review`) are buried below the fold inside the "Updated items" card.
Clerks may not notice them and abandon the screen without realising the
inspection has been updated.

**Fix:** Promote a single primary CTA immediately after the room status
section (around L101–110) — either `Back to room capture` or
`Review updated items` depending on scan outcome. Use `router.push` back
into the main capture or review flow. Keep the two existing detailed
buttons but visually subordinate them as secondary actions.

---

### FIX 3 — Add "all reviewed" empty state to review screen

**File:** `mobile/app/inspection/[inspectionId]/review.tsx` L187–240

**Problem:** When `filterNeedsReview` is true and all items are confirmed,
rooms return `null` and no rooms render below the summary card. The empty
page reads as a rendering bug, not completion.

**Fix:** Track a `hasVisibleRooms` flag after mapping rooms. When
`filterNeedsReview` is true and `hasVisibleRooms` is false, render a
`Card` or `Notice` beneath the summary stating:
`"All items are confirmed — nothing left to review."`
Do not change the summary card or the generate report action.

---

### FIX 4 — Confirm creation context on inspection overview

**File:** `mobile/app/inspection/[inspectionId]/index.tsx` L67–74
**Also:** `mobile/app/new-inspection.tsx` L150–155

**Problem:** After submitting a new inspection, the clerk lands on a
generic overview screen with no acknowledgement that this is the
inspection they just created. The transition feels like a context switch
rather than a continuation.

**Fix:** In `new-inspection.tsx`, append `?from=new` to the
`router.replace` call on L150–155. In `index.tsx`, read the `from`
query param and display a lightweight one-time banner near L67–74:
`"New inspection created — open a room below to start capturing."`
Dismiss the banner after the user scrolls or taps a room. Do not pass
persistent state — query param only.

---

### FIX 5 — Add next-step guidance to inspection overview

**File:** `mobile/app/inspection/[inspectionId]/index.tsx` L76–88

**Problem:** The overview shows progress and two action buttons but never
tells the user what their next action should be. First-time clerks may
treat the top buttons as the main flow and miss the room list entirely.

**Fix:** Add a contextual guidance line within the hero card when
`completion < 100`: `"Open a room below to continue capturing items."`
Optionally disable `Open review` until a minimum completion threshold
(e.g. at least one room complete) with a tooltip or muted state
explaining why. Do not block access entirely — this is guidance, not
a hard gate.

---

### FIX 6 — Surface newly generated report at top of reports list

**File:** `mobile/src/screens/ReportsScreen.tsx` L58–79
**Also:** `mobile/app/inspection/[inspectionId]/review.tsx` L146–147

**Problem:** After generating a report, `router.push('/reports')` lands
the clerk on an unordered list with no visual emphasis on the report
they just created. Finding the right report requires scanning the list.

**Fix:** In `review.tsx`, update the push to
`router.push('/reports?from=review&inspectionId=${inspectionId}')`.
In `ReportsScreen.tsx`, sort reports so the newest appears first. When
the `from=review` param is present, apply a subtle visual treatment to
the matching report card — a small `"Just generated"` label or a
highlighted border using `colours.accent`. Clear the treatment after
five seconds or on next navigation. No API changes required.

---

### FIX 7 — Standardise back navigation labels across inspection flow

**File:** `mobile/src/navigation/AppStackScreen.tsx` L172–185
**Also:** `mobile/app/new-inspection.tsx`, `mobile/app/inspection/[inspectionId]/index.tsx`,
`mobile/app/inspection/[inspectionId]/room/[roomId].tsx`,
`mobile/app/inspection/[inspectionId]/sections.tsx`,
`mobile/app/inspection/[inspectionId]/review.tsx`

**Problem:** Back button labels and fallback hrefs are inconsistent across
the flow. Some screens show `"Inspections"` (list), others show
`"Inspection"` (detail), with no clear rule. Clerks cannot build a
reliable mental model of where the back button leads.

**Fix:** Apply this rule consistently across all inspection sub-flow
screens:

- Screens nested inside a specific inspection
  (rooms, sections, review, video-scan) →
  `fallbackBackLabel: "Inspection"`,
  `fallbackHref: /inspection/${inspectionId}`
- Top-level exits only (inspection overview itself) →
  `fallbackBackLabel: "Inspections"`,
  `fallbackHref: /inspections`

Update `AppStackScreen` props at each instantiation site listed above
to match this rule. Do not change the `AppStackScreen` component
itself — only the props passed to it.

---

## Test plan

- [ ] Room capture screen has a visible primary `Back to inspection` CTA
      after the checklist
- [ ] Video scan screen has a promoted primary return CTA above the fold
      after a scan completes
- [ ] Review screen shows `"All items confirmed"` state when filter yields
      zero rooms
- [ ] Navigating from new inspection creation shows a contextual banner
      on the overview
- [ ] Inspection overview shows next-step guidance when completion < 100
- [ ] Reports list sorts newest first and highlights the just-generated
      report when navigated from review
- [ ] Back button labels follow the standardised rule across all
      inspection sub-flow screens
- [ ] `npm run typecheck` passes
- [ ] `npx expo export --platform web` passes

---

## Out of scope

- Backend or API changes
- New routes or navigation libraries
- Changes to report generation logic
- Frontend web dashboard
- Any screen not explicitly listed above