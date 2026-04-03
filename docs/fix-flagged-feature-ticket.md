# Sections Save UX + Flagged Items Simplification

**Labels:** `mobile` `ux` `polish` `high`  
**Surface:** Mobile only  
**Source:** User testing feedback — save feedback invisible, flagged items confusing

---

## Context

Two UX problems identified during inspector user testing:

1. Tapping Save on the sections screen produces no visible feedback for several seconds — the success banner renders at the top of a long screen the user has scrolled past, so nothing appears to happen. Inspectors assume it is broken and tap again.

2. The "Flagged items" filter in the review screen is poorly understood by the target audience (building inspectors). The label is jargon, the filtering behaviour is unclear, and it adds cognitive load at a critical moment in the flow.

---

## Cursor Prompt

```
Run these fixes now. Do not describe or plan — execute, make the changes,
then run a full mobile audit. Return all findings and changes made.

---

## FIX 1 — Sections save: visible loading state

File: `mobile/app/inspection/[inspectionId]/sections.tsx`

Problem: The save button triggers `updateSections()` which takes several
seconds. During this time nothing visible happens. The success banner
renders at the top of the screen which the user has scrolled past, so
they never see it.

Changes to make:

1. When the user taps Save, immediately replace the Save button with a
   loading state — disable the button, show a `ActivityIndicator`
   (use `colours.surface` for the indicator color) alongside the label
   `"Saving..."`. The button must be visually disabled and non-tappable
   for the entire duration of the save operation. Use the existing
   `saving` state boolean if present, or add one.

2. On success: scroll the screen to the top programmatically
   (`scrollViewRef.current?.scrollTo({ y: 0, animated: true })`)
   before showing the success banner, so the user always sees it.
   Then show the existing `SuccessBanner` with message `"Sections saved"`
   and navigate back after dismissal as currently implemented.

3. On failure: restore the Save button to its normal tappable state
   immediately so the user can retry. Show the existing error `Notice`.
   Do not leave the button stuck in a loading state on error.

4. Add a `ScrollView` ref if one does not already exist:
   `const scrollViewRef = useRef<ScrollView>(null)`
   Pass it to the outermost `ScrollView` in the screen.

---

## FIX 2 — Flagged items: simplify for building inspectors

Target audience: building inspectors and inventory clerks. They do not
use the word "flagged" — they think in terms of what needs attention
and what is done.

File: `mobile/app/inspection/[inspectionId]/review.tsx`

Changes to make:

1. Rename all instances of "Flagged items" / "Flagged" label to
   `"Needs attention"` throughout this screen. This includes:
   - Filter chip label
   - Any section heading that says "Flagged"
   - Any empty state copy referencing "flagged"

2. Simplify the filter chips to two options only:
   - `"All items"` (default, shows everything)
   - `"Needs attention"` (shows only items where condition is
     `Poor`, `Fair`, or where no condition has been set yet)

   Remove any other filter options if present — inspectors need
   simple, binary filtering at this stage.

3. Make the `"Needs attention"` chip visually distinct when active —
   use `colours.destructive` with reduced opacity (`withAlpha` or
   equivalent token approach) as the active chip background to signal
   "these items need your eye". Use only existing colour tokens —
   no hardcoded hex values.

4. If the `"Needs attention"` filter returns zero items, show an
   explicit empty state inside the list: Feather icon `check-circle`,
   message `"All items are in good condition."` — this is a positive
   moment in the inspection flow and should feel like a completion
   signal, not a blank screen.

5. Add a one-line contextual hint beneath the filter chips
   (only visible when `"Needs attention"` is active):
   `"Items marked Poor, Fair, or not yet assessed."`
   Use `typography.supporting` and `colours.textSecondary`.
   This tells the inspector exactly what they are looking at without
   requiring them to understand internal terminology.

---

## POST-CHANGE AUDIT

After completing both fixes, run a full audit of the mobile app
against the following checklist. Do not skip any item. Return
findings using the FINDING N structure below.

Audit scope — verify these have not regressed:

1. SECTIONS SCREEN
   - Save button shows loading state on tap
   - Screen scrolls to top before success banner appears
   - Success banner is visible after save
   - Navigation back occurs after banner dismisses, not before
   - Error state restores the Save button correctly
   - Meter readings, keys/fobs, and general observations all
     save correctly end-to-end

2. REVIEW SCREEN
   - `"All items"` filter shows all checklist items
   - `"Needs attention"` filter shows only Poor, Fair, and unassessed items
   - No reference to "Flagged" remains anywhere on this screen
   - `"Needs attention"` empty state renders correctly when all items
     are in good condition
   - Contextual hint appears only when `"Needs attention"` is active
   - Confirm item action still works from the review screen
   - Report generation CTA is still reachable and functional

3. CORE FLOW — verify end-to-end flow has not broken:
   - Inspection list loads
   - Create inspection works
   - Room capture opens (item tap → bottom sheet)
   - Bottom sheet photo upload and AI analysis flow works
   - Sections screen saves correctly with visible feedback
   - Review screen renders all items with correct filter behaviour
   - Report generation completes and report is accessible

4. COLOUR AND TOKEN CHECK
   - Confirm no hardcoded hex or rgb values were introduced
     in either fix
   - Confirm all new UI elements use tokens from `colours.ts`

5. TYPECHECK
   - Run `npm run typecheck` in `mobile`
   - Return the full output — pass or fail with errors listed

---

## AUDIT OUTPUT FORMAT

For each finding use this structure:

FINDING N
Area: [Sections fix | Review fix | Core flow | Colour/token | Typecheck]
File: [file path and line numbers]
Status: [PASS | REGRESSION | NEW ISSUE]
Detail: [one precise description — if regression, what broke and why]
Fix applied: [yes/no — if yes, describe what was changed to resolve it]

After all findings, return a SUMMARY:
- Total findings
- Regressions found and resolved
- Regressions found and unresolved (with file references)
- Typecheck result
- Overall status: READY or BLOCKED (blocked if any unresolved regressions)
```

Results:

FINDING 1  
Area: Sections fix  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (lines 185-196, 247-281)  
Status: PASS  
Detail: Save action now shows an in-place loading state with spinner + `"Saving..."`, and the control is disabled/non-tappable for the full save duration.  
Fix applied: yes — replaced the final save `Button` with a disabled `Pressable` loading variant using `ActivityIndicator` (`colours.surface`).

FINDING 2  
Area: Sections fix  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (lines 22, 75, 110)  
Status: PASS  
Detail: Screen now scrolls to top before success banner is shown, ensuring banner visibility after long-scroll editing.  
Fix applied: yes — added `scrollViewRef` and `scrollViewRef.current?.scrollTo({y: 0, animated: true})` before setting success state.

FINDING 3  
Area: Sections fix  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (lines 110-113)  
Status: PASS  
Detail: Success banner remains rendered at the top of the same scroll container and is now guaranteed to be visible post-save due to top scroll.  
Fix applied: yes.

FINDING 4  
Area: Sections fix  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (lines 87-95)  
Status: PASS  
Detail: Navigation back still occurs after success banner dismissal, not before.  
Fix applied: no — behavior already correct and preserved.

FINDING 5  
Area: Sections fix  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (lines 76-83, 185-196)  
Status: PASS  
Detail: Failure path restores Save interaction immediately (`setSaving(false)` in `finally`) and keeps error `Notice` behavior intact.  
Fix applied: no — existing restore behavior retained while loading UI now reflects it correctly.

FINDING 6  
Area: Sections fix  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (lines 67-71)  
Status: PASS  
Detail: Meter readings, keys/fobs, and general observations payload mapping to `updateSections()` remains unchanged and still saves all required sections.  
Fix applied: no.

FINDING 7  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 206, 213)  
Status: PASS  
Detail: Filter chips now use only `"All items"` and `"Needs attention"` with `"All items"` as default.  
Fix applied: yes — replaced toggle chip behavior with explicit two-chip filter state.

FINDING 8  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 15, 244, 247)  
Status: PASS  
Detail: `"Needs attention"` filtering now includes only `poor`, `fair`, and unset condition items.  
Fix applied: yes — updated `itemNeedsAction()` logic and applied it to visible item filtering.

FINDING 9  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 211, 335-336, 345-348)  
Status: PASS  
Detail: Active `"Needs attention"` chip is visually distinct with destructive token styling + reduced opacity.  
Fix applied: yes — added `withAlpha(colours.destructive, ...)` active styles.

FINDING 10  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 232-239, 373-384)  
Status: PASS  
Detail: Empty state for zero `"Needs attention"` items now shows positive completion message with `Feather` `check-circle`.  
Fix applied: yes.

FINDING 11  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (line 220, lines 349-352)  
Status: PASS  
Detail: Contextual hint appears only while `"Needs attention"` is active.  
Fix applied: yes.

FINDING 12  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx`  
Status: PASS  
Detail: No remaining `"Flagged"` wording exists on this screen.  
Fix applied: yes — replaced relevant copy with `"Needs attention"` terminology.

FINDING 13  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 268-274)  
Status: PASS  
Detail: Per-item confirm action remains available for confirmable unconfirmed items.  
Fix applied: no.

FINDING 14  
Area: Review fix  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 154-168, 224)  
Status: PASS  
Detail: Report generation CTA remains reachable and wired to `createReport()`.  
Fix applied: no.

FINDING 15  
Area: Core flow  
File: `mobile/app/new-inspection.tsx` (line 154)  
Status: PASS  
Detail: Create inspection flow remains wired to `createInspection(form)` and unchanged by this fix set.  
Fix applied: no.

FINDING 16  
Area: Core flow  
File: `mobile/app/inspection/[inspectionId]/room/[roomId].tsx` (line 627), `mobile/src/components/ItemCaptureSheet.tsx` (lines 395-407, 137-167)  
Status: PASS  
Detail: Room item tap → bottom sheet and photo/AI analysis paths remain connected and callable.  
Fix applied: no (from this ticket scope).

FINDING 17  
Area: Core flow  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` + `mobile/app/inspection/[inspectionId]/review.tsx`  
Status: PASS  
Detail: Sections save visibility improvements and review filter simplification integrate without breaking route-level flow wiring.  
Fix applied: yes.

FINDING 18  
Area: Core flow  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 164, 224)  
Status: PASS  
Detail: Report generation completion routing to reports screen remains intact.  
Fix applied: no.

FINDING 19  
Area: Core flow  
File: Runtime/device verification gap (no specific file)  
Status: NEW ISSUE  
Detail: Full interactive end-to-end execution on device/emulator (inspection list load, create, capture, AI, save, report open) was not executable in this CLI-only pass; code paths are intact but runtime QA is still required.  
Fix applied: no.

FINDING 20  
Area: Colour/token  
File: `mobile/app/inspection/[inspectionId]/sections.tsx`, `mobile/app/inspection/[inspectionId]/review.tsx`  
Status: PASS  
Detail: No hardcoded hex/rgb introduced; new styles use existing tokens (`colours.*`, `withAlpha`, `spacing`, `radii`, `typography`).  
Fix applied: yes.

FINDING 21  
Area: Typecheck  
File: `mobile` workspace (`npm run typecheck`)  
Status: PASS  
Detail: TypeScript check passes with zero errors.  
Fix applied: no.

### Typecheck output
```text
> mobile@1.4.5 typecheck
> tsc --noEmit
```

### Files changed
- `mobile/app/inspection/[inspectionId]/sections.tsx`
- `mobile/app/inspection/[inspectionId]/review.tsx`

### SUMMARY
- Total findings: 21
- Regressions found and resolved: 0
- Regressions found and unresolved: 0
- Typecheck result: PASS (`tsc --noEmit`, 0 errors)
- Overall status: READY (with one runtime verification gap noted for device-level E2E QA)