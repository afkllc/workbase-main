# Post-Demo Improvements — Notara

This file tracks deferred improvements that are explicitly out of scope
before the internal demo. Action these once the demo is complete.

---

## Visual Audit Deferrals

### [mobile] Loading skeletons across main list screens

**Source:** Visual audit Finding 8
**Files:** `mobile/src/components/ui.tsx`, `mobile/src/screens/HomeDashboardScreen.tsx`,
`mobile/src/screens/InspectionsScreen.tsx`, `mobile/src/screens/ReportsScreen.tsx`
**Detail:** Replace the generic spinner/LoadingRow with shaped skeleton components
that match the card and list row layouts they precede. Skeletons should mirror
the exact shape of the content they replace (card header, list row, badge).
This is the Trip.com loading standard and will significantly improve perceived performance.

---

### [mobile] Filter chip pressed/active state feedback

**Source:** Visual audit Finding 9
**File:** `mobile/app/inspection/[inspectionId]/review.tsx:L184–L188`
**Detail:** Add `style={({pressed}) => [...]}` with a pressed background
(e.g. `withAlpha(colours.accent, 0.08)`) and/or subtle scale transform
to match the rest of the app's Pressable interaction patterns.

---

### [mobile] Quick actions — convert to horizontal scroll row

**Source:** Visual audit Finding 15
**File:** `mobile/src/screens/HomeDashboardScreen.tsx:L178–L188`,
`mobile/src/components/QuickActionTile.tsx`
**Detail:** Convert the wrapping `'48%'` grid into a horizontal
`ScrollView`/`FlatList` row of consistently-sized tiles with snap
physics — matching the Trip.com shortcut row pattern. The `QuickActionTile`
width fix (Issue D) should land first as a precondition.

---

### [mobile] Review screen item row layout

**Source:** Visual audit Finding 16
**File:** `mobile/app/inspection/[inspectionId]/review.tsx:L231–L255`
**Detail:** Refactor review items from stacked blocks to a proper
left/right row layout: primary info (name, description, meta) on the left,
status badge or confirm action right-aligned. Adds scan-friendliness and
aligns with the Trip.com list row pattern.

---

### [mobile] Shared Chip component

**Source:** Visual audit Finding 4 (partial — token fix ships pre-demo,
shared component deferred)
**Files:** `mobile/app/inspection/[inspectionId]/review.tsx`,
`mobile/src/components/` (new file)
**Detail:** Once the token-level fix lands pre-demo, create a proper
shared `Chip` component using `radii.pill`, `spacing.*` tokens, and
a `chip` variant pattern. Refactor all chip usages across the app to use it.

---

### [mobile] Swipe-to-archive on inspections list

**Surface:** Mobile — `mobile/src/screens/InspectionsScreen.tsx`
**Detail:** Add left/right swipe gesture on inspection list rows to trigger
archive (not delete). Should use Reanimated `Swipeable` or equivalent gesture
handler, reveal a destructive-styled archive action on swipe, and follow the
same optimistic removal + revert-on-failure pattern established in the report
archive UI. Requires the `PATCH /api/inspections/{id}/archive` backend route
to exist first (parallel to the existing report archive route). Confirmation
alert should match report archive copy pattern: "Archive this inspection? It
will be removed from your list but not deleted."
**Preconditions:**

- Backend inspection archive route implemented
- `is_archived` / `archived_at` on `InspectionSummary` type (already landing
  with report archive work)
- Report swipe-to-archive pattern validated in demo first as a reference implementation

---

### [mobile] Fluid animations — Reanimated + Gesture Handler

**Detail:** Implement Trip.com-style fluid animations across the mobile app:
shared element transitions between list and detail screens, spring physics
on list item entry, gesture-driven navigation (swipe back with live tracking),
and micro-interactions on buttons and cards. Requires installing
`react-native-reanimated` and `react-native-gesture-handler` and configuring
the Babel plugin. Build on top of a stable, complete UI — do not introduce
before core polish is locked. Reference Trip.com bookings list → detail
transition as the primary benchmark.
**Preconditions:**

- All pre-demo polish tickets merged and stable
- Inter font rollout complete
- UI structure finalised (no more layout changes after animations land)

---

## Product / Infrastructure Deferrals

- Live AI provider (Groq) — switch via `AI_PROVIDER=groq` + `GROQ_API_KEY`
- PDF export (frontend)
- Report editing on web dashboard
- Auth / user accounts
- Production Postgres migration
- Object storage
- Native video upload
- Offline sync
