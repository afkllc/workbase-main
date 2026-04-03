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

### [mobile + backend] Automated update tracker in Settings

**Detail:** Display the latest GitHub release name and version in the
Settings screen, updated automatically on each release. Clean
implementation: add a backend endpoint `GET /api/version` that proxies
the GitHub Releases API (`/repos/{owner}/{repo}/releases/latest`) and
returns `{ version: string, release_name: string, released_at: string }`.
Mobile fetches this on Settings mount and displays alongside the existing
`Constants.expoConfig.version`. Show a subtle loading state and fail
silently (fall back to package.json version) if the request fails.
**Preconditions:**

- GitHub personal access token stored securely as a backend environment
  variable — never in the mobile app binary
- Backend `/api/version` route implemented and returning correct shape
- Repo is on a consistent release tagging pattern (e.g. v1.0.1)
  **Security note:** Never call the GitHub API directly from mobile.
  Always proxy through the backend.

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

## Field-Mode / Capture Deferrals

### [mobile] Room sweep mode for batch capture

**Detail:** Let inspectors capture a small batch of room photos in one
pass, then have AI propose multiple item updates together. This could
make the flow even more "bang, bang, done" for experienced users, but it
is a larger workflow change and should only be explored after the
single-item rapid capture loop is validated in the demo.

---

### [mobile] Optional quick issue shortcuts after capture

**Detail:** Test a compact shortcut row such as `Good`, `Issue`, and
`N/A` immediately after capture for users who want explicit control
without opening a full review UI. This is promising, but it should only
be added if rapid auto-save plus compact exception review still feels too
slow in live feedback.

---

### [mobile + backend] Confidence-driven exception routing

**Detail:** Introduce a proper backend signal for `confidence` or
`needs_review`, then use that contract to decide when mobile should
auto-save and when it should force compact review. This should not be
added until the backend signal is stable enough to trust in the field.

---

### [mobile] Dedicated flagged-items queue

**Detail:** If the existing review experience becomes overloaded, add a
separate flagged-items queue at room or inspection level. For the MVP,
flagged items should stay inside the existing review flow to avoid
splitting the user journey too early.

---

### [mobile] Voice notes or dictation for defect descriptions

**Detail:** Allow inspectors to speak a short note and attach it to the
item description during review. This could be valuable for complex
findings, but it is not necessary to prove the MVP field workflow.

---

### [backend] SQLite → Postgres migration + schema normalisation

**Detail:** When migrating from SQLite to Postgres, normalise the
inspections table by extracting frequently-queried fields from
`payload_json` into proper columns: `property_address`, `property_type`,
`status`, `completed_at`, `template_key`, and `clerk_id` (once auth lands).
Keep a `payload_json` JSONB column for variable-shape room/item data.
Write a migration script that reads existing SQLite rows and maps them
to the new Postgres schema. Update all API queries accordingly.
**Preconditions:**

- Auth / user accounts implemented (clerk_id needs a users table to FK against)
- Postgres instance provisioned

---

### [mobile] Field-tool haptics and richer capture feedback

**Detail:** Add haptics, shutter-style feedback, and stronger save
signals so capture feels more like operating a tool than filling out a
form. Good experience leverage, but not essential for the internal demo.

---

### [mobile] Dedicated field-mode shell

**Detail:** Create a more clearly separated field-work shell that makes
inspection capture feel distinct from admin and reporting flows through
layout, navigation emphasis, and visual treatment. Important long-term,
but too structural for the MVP unless the lighter field-mode refresh is
insufficient.

---

### [mobile] Apple Developer License + EAS Dev Client setup

**Detail:** Enrol in the Apple Developer Program ($99/year) at
developer.apple.com. Once enrolled, set up EAS Build with a
development profile to compile a custom dev client with
react-native-reanimated and react-native-gesture-handler baked in.
This unlocks the fluid animation work and removes the Expo Go
constraint entirely. Re-introduce @gorhom/bottom-sheet to replace
the current Animated/Modal bottom sheet implementation.
**Preconditions:**

- Apple Developer Program enrolment complete
- EAS CLI configured with expo account
- `expo-dev-client` installed

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
