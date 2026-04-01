# UI/UX Audit — Workbase MVP

**Date:** 2026-03-29
**Reviewer:** Senior Product Design Audit
**Scope:** Full-stack audit — Mobile (Expo/React Native) + Frontend (React/Vite/Tailwind)
**Context:** Mobile-first field inspection app for property agencies. Targeting non-technical letting agents and field clerks.

---

## 1. Overall Assessment

### MVP Readiness Score: 5.5 / 10

Workbase has a **solid technical foundation** — clean component architecture, consistent spacing system, proper loading/error states, and a logical data model. However, it currently reads as a **developer prototype**, not a product ready to hand to a non-technical property inspector. The gap is not in functionality (the flows work), but in **polish, affordance, and confidence** — the things that make a user trust an app enough to rely on it in the field.

**What works well:**
- Consistent colour palette (slate/blue) across both apps
- Good component abstraction — `Card`, `Button`, `StatusBadge`, `Screen` are reusable and well-structured
- Loading states present on every async screen
- Error handling exists with clear error messages
- Typography hierarchy is intentional (28px → 18px → 15px → 12px scale)
- Safe area and keyboard handling are properly implemented on mobile

**What holds it back:**
- Developer language leaks into nearly every screen subtitle
- Success feedback is inconsistent — many key actions complete without explicit confirmation
- Empty states are plain text with no visual weight
- No onboarding or guidance for first-time users
- The frontend is locked at 448px `max-w-md` — it's a mobile mockup in a browser, not a responsive dashboard
- Status badges rely primarily on colour; labels exist but could be more distinct at a glance
- Focus states are stripped from all inputs (accessibility failure)
- Several screens feel like admin debug panels rather than user-facing tools

---

## 2. Screen-by-Screen Findings

### MOBILE APP

#### 2.1 Home Dashboard (`mobile/src/screens/HomeDashboardScreen.tsx`)

**Visual Design:**
- Hero copy reads like a changelog note: *"Run inspections, trigger room analysis, and keep reports moving from the field."* — this is feature marketing, not a dashboard greeting.
- Stats row (Total / Drafts / Reports) is good but the numbers (`22px weight 800`) feel oversized relative to the card.
- "Quick actions" card with "Open inspections" / "Open reports" buttons adds an unnecessary click layer — the bottom nav already provides these.

**UX Issues:**
- Subtitle: *"Field capture dashboard powered by the current FastAPI routes."* — this is developer documentation, not UI copy. A field inspector has no idea what FastAPI is.
- Recent inspections list shows only 3 items with no "View all" link.
- No greeting or user context (no name, no date, no "you have X pending").

**Recommendations:**
- Replace subtitle with contextual summary: "You have 3 inspections in progress"
- Remove "Quick actions" card — it duplicates bottom nav
- Replace hero copy with actionable context: today's inspections, pending reviews
- Add "View all" to recent inspections

---

#### 2.2 Inspections List (`mobile/src/screens/InspectionsScreen.tsx`)

**Visual Design:**
- Card layout is clean with consistent 20px radius, 16px padding
- Status badges work well (green/amber/blue/gray)
- Meta text "{confirmed} of {total} items confirmed" is useful at a glance

**UX Issues:**
- Subtitle: *"Create, open, and review inspections backed by the current API."* — developer language again.
- Intro card says: *"Use this list to open room capture, review, and report flows from the mobile client."* — reads like a README, not a product.
- No search or filter capability — will break at 20+ inspections.
- No sort options (date, status, address).
- No pull-to-refresh indicator (the API call happens but no visual feedback).
- No distinction between today's inspections vs older ones.

**Recommendations:**
- Remove the intro card entirely — the screen is self-explanatory
- Replace subtitle with count: "12 inspections"
- Add search bar and status filter tabs (All / Draft / In Progress / Completed)
- Group by date or status

---

#### 2.3 Reports List (`mobile/src/screens/ReportsScreen.tsx`)

**Visual Design:**
- Consistent with inspections list styling
- "Open report" button is primary blue — good affordance

**UX Issues:**
- Subtitle: *"Completed reports backed by the current report route."* — developer language.
- Empty state is plain text in a card: *"No completed reports yet. Generate one from the review screen."* — no illustration, no CTA button.
- Reports open in an external browser via `Linking.openURL` — jarring context switch on mobile. User loses the app.
- No report preview — you either open the full HTML or see nothing.

**Recommendations:**
- Replace subtitle: "Completed inspection reports"
- Add illustration/icon to empty state with a CTA button to go to inspections
- Consider an in-app WebView for report viewing
- Add report date, property type, and a preview snippet

---

#### 2.4 Settings Screen (`mobile/src/screens/SettingsScreen.tsx`)

**Visual Design:**
- Clean and simple, two cards

**UX Issues:**
- Subtitle: *"Local mobile app information only. No backend settings route exists."* — developer language.
- Second card says: *"This screen is intentionally local-only. Auth, push settings, and team controls remain blocked until matching backend routes exist."* — this is an internal engineering note, not user-facing content.
- Shows "API base URL" — no user needs to see this.
- Shows "AI provider mode: backend-controlled (mock default)" — completely internal.
- The screen is essentially a debug panel disguised as settings.

**Recommendations:**
- Remove all developer-facing info
- Show: App version, Support/Help link, Log out (when auth exists)
- If nothing else to show, consider hiding the settings tab until there's real content

---

#### 2.5 New Inspection (`mobile/app/new-inspection.tsx`)

**Visual Design:**
- Template picker uses native `<Picker>` component — looks different on iOS vs Android, inconsistent with the rest of the styled UI.
- "Create your own template" card with dashed border is well-designed — good affordance with the "+" icon and chevron.
- Form fields are clean and consistent.

**UX Issues:**
- Template picker item format: `"{property_type} — {name}{source}"` with "(custom)" suffix — "source" is an internal concept.
- No template preview — user selects blindly without knowing what rooms/items are included.
- Delete template button is styled as secondary, so destructive intent is visually weak (there is already a confirmation dialog).
- Date field is a plain text input — should use a date picker.

**Recommendations:**
- Show template preview (room count, item count) below picker on selection
- Style delete as destructive (red text or red outline)
- Keep the existing confirmation dialog and improve destructive styling
- Use a proper date picker component

---

#### 2.6 Inspection Detail (`mobile/app/inspection/[inspectionId]/index.tsx`)

**Visual Design:**
- Overview card with address, type, date, and status badge — well-structured
- Room cards with progress indicators are clear
- Two action buttons (Sections / Review) provide clear navigation

**UX Issues:**
- No progress bar on the overview card — just text "{confirmed} of {total}"
- Room cards don't indicate which rooms have photos vs which are empty
- No visual distinction between required and optional rooms
- "Sections" button could be confusing — what are sections?

**Recommendations:**
- Add a visual progress bar (like the frontend has)
- Add photo count or capture indicator to room cards
- Rename "Sections" to "Property Details" or split into individual buttons (Meters / Keys / General)
- Add room thumbnails if photos exist

---

#### 2.7 Room Capture (`mobile/app/inspection/[inspectionId]/room/[roomId].tsx`)

**Visual Design:**
- AI suggestion card is well-structured with confidence badge, image preview, and action buttons
- Checklist items are clear with status badges

**UX Issues:**
- Helper text: *"Native video upload is still blocked until a real upload route exists..."* — developer note exposed to user.
- "Video scan demo" button label exposes the fact it's a demo.
- Photo preview is 220px fixed height — may be too large on smaller phones, wastes vertical space.
- No camera integration — just file picker. For a field app, the camera should be the primary capture method.
- No progress indicator for photo upload/analysis.
- No way to manually edit items without uploading a photo first — the checklist shows status but has no edit action.

**Recommendations:**
- Remove developer helper text
- Rename "Video scan demo" to "Scan room" or "Quick scan"
- Add a real progress indicator for upload (not just disabled button)
- Make checklist items tappable with inline edit for manual entry
- Reduce image preview height to 160px or make it proportional

---

#### 2.8 Video Scan Screen (`mobile/app/inspection/[inspectionId]/room/[roomId]/video-scan.tsx`)

**UX Issues:**
- Title: *"Client demo action"* — developer language.
- Description explicitly says this is a demo endpoint.
- "Run video scan" sends a POST with no actual video — it's a mock trigger.
- The entire screen feels like a developer test harness.

**Recommendations:**
- Either hide this screen until real video is implemented, or redesign as a genuine "Quick Scan" feature
- Remove all "demo" / "client" language

---

#### 2.9 Inspection Sections (`mobile/app/inspection/[inspectionId]/sections.tsx`)

**Visual Design:**
- Three clean cards (Meters, Keys, General) with proper form components
- Toggle rows for smoke alarms / CO detector look good
- Number inputs for keys are narrow (72px) and appropriately sized

**UX Issues:**
- All three sections in one scrollable screen — could be overwhelming
- No section completion indicators — user doesn't know which sections are done
- Native Picker for cleanliness looks inconsistent with the styled inputs
- Unsaved changes alert exists (good) but no visual "dirty" indicator while editing

**Recommendations:**
- Add completion checkmarks next to section titles
- Consider splitting into tabs or accordion sections
- Show a subtle "unsaved changes" indicator

---

#### 2.10 Review Screen (`mobile/app/inspection/[inspectionId]/review.tsx`)

**Visual Design:**
- Summary card with "X of Y items confirmed" is clear
- Room sections with item cards and inline "Confirm" buttons work well
- "Generate report" button disabled until all items confirmed — good guard

**UX Issues:**
- No bulk "Confirm all" action — tedious for large inspections (22+ items)
- No filtering (show only unconfirmed items)
- Condition display uses raw values like "na" — should display as "N/A"
- "Generate report" button doesn't explain what happens next

**Recommendations:**
- Add "Confirm all in room" button per room card
- Add filter: "Show unconfirmed only"
- Format condition values properly (N/A, not "na")
- Add helper text: "This will generate a PDF report for this inspection"

---

#### 2.11 Template Builder (`mobile/src/screens/TemplateBuilderScreen.tsx`)

**Visual Design:**
- Deep nesting: Template → Rooms → Items with 3 levels of cards
- Item cards use surfaceMuted background to differentiate from room cards — good visual hierarchy

**UX Issues:**
- Very long scrollable form — creating a template with 5 rooms and 20 items requires extensive scrolling
- "Condition options" field expects comma-separated values: "good, fair, poor, damaged" — this is developer input format
- "AI hints" field expects comma-separated values — same issue
- No drag-to-reorder for rooms or items
- No preview of what the template will look like in use
- No template duplication — can't clone a built-in template and modify it

**Recommendations:**
- Use multi-select checkboxes instead of comma-separated text for conditions
- Use tag input component for AI hints
- Add collapse/expand to room sections to manage long forms
- Add template preview
- Allow duplicating existing templates

---

### FRONTEND (WEB DASHBOARD)

#### 2.12 Home Screen (`frontend/src/screens/HomeScreen.tsx`)

**Visual Design:**
- Hero card with "Permanent web client for letting agents" heading — good but subtitle says *"Use the web dashboard to manage inspection templates, open inspections, assign rooms, review AI suggestions, and export completed reports."* — too long, reads like a feature list.
- Progress bar on inspection cards is a nice touch not present on mobile.
- Hover states (`hover:border-blue-200 hover:bg-blue-50/30`) are subtle and pleasant.

**UX Issues:**
- Loading spinner is tiny and positioned next to the "Inspections" label — easy to miss.
- No pagination or "load more" for the inspection list.
- Cards show "{rooms_count} rooms" but no room names.

---

#### 2.13 Room Capture (`frontend/src/screens/RoomCaptureScreen.tsx`)

**UX Issues:**
- Description text: *"Photo analysis is mocked through FastAPI right now..."* — developer note.
- "Run room scan" button name is ambiguous — what kind of scan?
- AI suggestion card works well but the condition select shows raw values: "good", "fair", "poor", "damaged", "na" — lowercase, no formatting.

---

#### 2.14 Review Screen (`frontend/src/screens/ReviewScreen.tsx`)

**Visual Design:**
- "Generate HTML report" button is dark (`bg-slate-950`) — good distinction from primary blue.
- Item cards with inline "Confirm suggestion" button with Check icon — clear affordance.

**UX Issues:**
- Button says "Generate HTML report" — "HTML" is a technical detail. Should be "Generate report".
- No confirmation dialog before generation.
- Subtitle: *"Confirm AI output before generating the report."* — reasonable but could be friendlier.

---

#### 2.15 Reports Screen (`frontend/src/screens/ReportsScreen.tsx`)

**UX Issues:**
- Subtitle: *"Agency report center powered by the FastAPI backend."* — developer language.
- "Download report" opens an external HTML page — no in-app preview.

---

#### 2.16 Section Screens (`frontend/src/screens/SectionScreens.tsx`)

**UX Issues:**
- Meter readings subtitle: *"Save the fixed meter section."* — what does "fixed" mean to a user?
- Keys subtitle: *"Record the handover inventory."* — better, but "inventory" is formal.
- General subtitle: *"Complete the final fixed section."* — developer language.
- Cleanliness values are formatted, but terminology can still be made friendlier for non-technical users.

---

#### 2.17 Global Frontend Issues

**Layout & Responsiveness:**
- The entire app is locked at `max-w-md` (448px) centered on screen with `shadow-2xl` — it's literally a phone mockup in the browser.
- On a 1440px monitor, ~70% of the screen is empty grey space.
- No responsive breakpoints, no desktop layout, no sidebar navigation.
- This is acceptable if the frontend is intentionally mobile-web-only, but the header says "Agency admin dashboard" — admins expect a desktop experience.

**Accessibility:**
- All inputs use `outline-none` with NO replacement focus indicator — this is a **WCAG 2.1 AA failure**. Keyboard users cannot see which field is focused.
- Back button (`<ArrowLeft>` icon only) has no `aria-label`.
- Settings button in BottomNav is non-functional with no disabled styling or tooltip.
- No `aria-live` region for error banner — screen readers won't announce errors.
- Status badges rely on colour alone — no icon or pattern differentiator.

**Navigation:**
- State-machine routing means no URL history — browser back button doesn't work.
- No deep linking — can't bookmark or share a specific inspection.
- BottomNav Settings button does nothing — no click handler, no disabled state.

---

## 3. Cross-Platform Consistency

| Element | Mobile | Frontend | Consistent? |
|---------|--------|----------|-------------|
| Primary colour | `#2563eb` | `bg-blue-600` (`#2563eb`) | Yes |
| Card radius | 20px | `rounded-3xl` (24px) | No — 4px difference |
| Card padding | 16px | `p-5` (20px) | No — 4px difference |
| Button radius | 14px | `rounded-2xl` (16px) | No — 2px difference |
| Input radius | 14px | `rounded-2xl` (16px) | No — 2px difference |
| Font family | System default | Inter (Google Fonts) | No |
| Status badge colours | `statusTone()` function | `statusPill()` function | Yes (same logic) |
| Label style | 12px uppercase bold, 1px spacing | `text-xs uppercase tracking-[0.16em]` | Close but different spacing |
| Progress bar | Not present on inspection cards | Present (`h-2 rounded-full bg-blue-600`) | No — mobile missing |
| Error display | Blue Notice component | Red rose-50 banner | No — different colour/style |

---

## 4. IDE-Ready UI/UX Backlog (Implementation Focus)

### 4.1 Decision Gates (Resolve First)

1. **Web product direction (highest priority decision)**
   - Option A: Keep web as mobile-companion UI and update positioning/copy accordingly.
   - Option B: Build true desktop-responsive dashboard with breakpoints and desktop navigation.
   - Why first: this changes layout, navigation, and where to invest UI effort.

2. **Mobile report viewing**
   - Option A: Keep external open behavior for MVP.
   - Option B: Add in-app `WebView` report viewer.
   - Why first: this affects flow continuity and implementation scope.

### 4.2 Prioritized Task List with Acceptance Criteria

| ID | Task | Priority | Effort | Core Files | Acceptance Criteria |
|---|---|---|---|---|---|
| UX-01 | Remove developer-facing copy from user screens | **Critical** | Quick | `mobile/src/screens/HomeDashboardScreen.tsx`, `mobile/src/screens/InspectionsScreen.tsx`, `mobile/src/screens/ReportsScreen.tsx`, `mobile/src/screens/SettingsScreen.tsx`, `mobile/app/inspection/[inspectionId]/room/[roomId].tsx`, `mobile/app/inspection/[inspectionId]/room/[roomId]/video-scan.tsx`, `frontend/src/screens/ReportsScreen.tsx`, `frontend/src/screens/SectionScreens.tsx` | No user-facing screen text contains: API/FastAPI/backend/route/mock/demo/client. Copy explains user outcome, not implementation detail. |
| UX-02 | Restore visible keyboard focus and baseline web accessibility | **Critical** | Quick | `frontend/src/components/fields.tsx`, `frontend/src/screens/RoomCaptureScreen.tsx`, `frontend/src/screens/SectionScreens.tsx`, `frontend/src/screens/NewInspectionScreen.tsx`, `frontend/src/components/layout.tsx`, `frontend/src/App.tsx` | All interactive controls show visible focus on Tab. Back button has `aria-label`. Error banner uses `role=\"alert\"` or `aria-live=\"assertive\"`. |
| UX-03 | Add explicit success feedback for save/confirm/generate actions | **High** | Quick | `mobile/app/inspection/[inspectionId]/sections.tsx`, `mobile/app/inspection/[inspectionId]/review.tsx`, `mobile/app/inspection/[inspectionId]/room/[roomId].tsx`, `frontend/src/App.tsx` | After successful actions, user sees confirmation within 500ms (toast/banner/inline). No silent success on key write operations. |
| UX-04 | Standardize condition display formatting (especially `na` → `N/A`) | **High** | Quick | `mobile/src/lib/utils.ts`, `frontend/src/components/layout.tsx` | `good/fair/poor/damaged` display title case; `na` displays `N/A`; `professional_clean` displays `Professional Clean`. Same output across mobile and web. |
| UX-05 | Upgrade empty states with message hierarchy and CTA | **High** | Medium | `mobile/src/screens/HomeDashboardScreen.tsx`, `mobile/src/screens/InspectionsScreen.tsx`, `mobile/src/screens/ReportsScreen.tsx`, `frontend/src/screens/HomeScreen.tsx`, `frontend/src/screens/ReportsScreen.tsx` | Empty states include: headline, short guidance, primary CTA. No plain single-line empty-state copy cards on primary entry screens. |
| UX-06 | Remove debug-panel feel from mobile Settings | **High** | Quick | `mobile/src/screens/SettingsScreen.tsx` | Settings contains only user-meaningful items (version, support/help, account actions when available). No API/provider/internal roadmap notes in production UI. |
| UX-07 | Improve inspection list usability (search/filter + refresh affordance) | **High** | Medium | `mobile/src/screens/InspectionsScreen.tsx`, `mobile/src/screens/ReportsScreen.tsx`, `frontend/src/screens/HomeScreen.tsx` | Users can filter by status and search by address/postcode. Mobile lists have visible refresh affordance (`RefreshControl` or equivalent). |
| UX-08 | Reduce review friction with bulk confirmation actions | **Medium** | Medium | `mobile/app/inspection/[inspectionId]/review.tsx`, `frontend/src/screens/ReviewScreen.tsx`, `frontend/src/App.tsx` | Per-room “Confirm all eligible” action exists. Action only confirms items that have required fields and are not yet confirmed. |
| UX-09 | Clarify destructive actions visually | **Medium** | Quick | `mobile/app/new-inspection.tsx`, shared button styles in `mobile/src/components/ui.tsx` | Delete actions use destructive styling (color/label/placement) while retaining confirmation dialogs. |
| UX-10 | Resolve web layout + navigation model based on Decision Gate #1 | **Medium** | Major | `frontend/src/App.tsx`, `frontend/src/components/layout.tsx`, all frontend screens | If Option A: mobile-web framing is explicit and consistent. If Option B: breakpoints + desktop nav + usable wide-screen layout are implemented. |
| UX-11 | Improve report flow continuity (Decision Gate #2 dependent) | **Medium** | Medium | `mobile/src/screens/ReportsScreen.tsx`, optional `mobile` WebView screen | If Option B selected, reports open in-app with back navigation preserved. If Option A selected, external open behavior is clearly communicated. |
| UX-12 | Clean label terminology and technical format wording | **Low** | Quick | `frontend/src/screens/ReviewScreen.tsx`, `frontend/src/screens/SectionScreens.tsx` | Replace “Generate HTML report” with “Generate report”; remove ambiguous terms like “fixed section”; user wording is domain-natural. |

### 4.3 File-Level Implementation Notes for the IDE

- **Copy sweep (`UX-01`)**
  - Run a copy grep to catch implementation language: `FastAPI|backend|route|mock|demo|client|API`.
  - Rewrite to user-intent phrasing (what user can do now).

- **Accessibility sweep (`UX-02`)**
  - Replace bare `outline-none` patterns with visible focus classes.
  - Ensure icon-only controls include `aria-label`.
  - Upgrade error region semantics so screen readers announce failures.

- **Condition formatting (`UX-04`)**
  - Centralize mapping in helpers, not per-screen.
  - Add explicit handling for `na` to avoid “Na”.

- **Success feedback (`UX-03`)**
  - Prefer one reusable feedback primitive per platform.
  - Trigger on successful promise resolution only.

- **Decision-gated work (`UX-10`, `UX-11`)**
  - Do not start large layout/report-view implementation until gate choices are made.

---

## 5. Top 5 Before External Demo (Revised)

1. **Remove developer-facing copy in all core flows** (`UX-01`)
2. **Fix focus visibility and web accessibility basics** (`UX-02`)
3. **Add consistent success confirmation after key actions** (`UX-03`)
4. **Improve empty states with clear CTA paths** (`UX-05`)
5. **Decide and align web positioning (mobile companion vs desktop dashboard)** (`UX-10`)

These five items provide the biggest trust and usability gains with the least ambiguity for implementation.

---

## 6. Design System Gap Analysis

### What exists (good):
- Shared `Card`, `Button`, `StatusBadge`, `Screen`, `Label`, `TextField`, `Notice`, `LoadingRow` components on mobile
- Shared `Header`, `BottomNav`, `SectionCard`, `Input`, `FieldLabel`, `ToggleRow` components on frontend
- Consistent status colour mapping (`statusTone` / `statusPill`)
- Defined colour palette in `theme.ts` (mobile)
- Inter font imported with proper weight range (frontend)

### What's missing:
- **No shared design tokens** between mobile and frontend — colours are defined separately
- **No Toast/Snackbar component** — success states have no UI
- **No Modal/Dialog component** — confirmation dialogs use `Alert.alert()` (native) with no web equivalent
- **No Skeleton/Placeholder component** — loading shows a spinner but no content skeleton
- **No Tag/Chip component** — for conditions, confidence levels, or multi-select inputs
- **No SearchInput component** — will be needed for list filtering
- **No ProgressBar component** on mobile (frontend has one inline)
- **No DatePicker component** — mobile uses plain text input for dates
- **No Avatar/User component** — no user identity anywhere in the UI

---

## 7. Information Architecture Issues

### Screen count vs user needs:
The mobile app has **11 distinct screens** for what is essentially a 4-step workflow:
1. Create inspection (1 screen)
2. Capture rooms (2 screens: room list + room capture, plus video scan)
3. Fill details (1 screen with 3 sections)
4. Review and generate (2 screens: review + reports)

The Template Builder adds complexity (1 screen) and so does the dashboard (1 screen) and settings (1 screen).

### Navigation depth:
The deepest flow is: **Home → Inspections → Inspection Detail → Room → Video Scan** (5 levels deep). For a field app used with one hand while walking through a property, this is borderline too deep. Consider:
- Flattening room capture into the inspection detail screen (inline expansion)
- Moving sections (meters/keys/general) into the review screen as collapsible sections

### Bottom nav tab relevance:
- **Home**: Partially duplicates Inspections
- **Inspections**: Core screen
- **Reports**: Low-frequency use (only after completion)
- **Settings**: Empty shell

Consider: **Home (dashboard) | Inspections | Create New | Reports** with settings as a gear icon in the header.

---

## 8. Competitor Benchmark Notes

For context, property inspection apps like **Inventory Hive**, **No Letting Go**, and **Imfuna** typically include:
- Photo capture directly from camera (not file picker)
- Signature capture for tenants/landlords
- PDF report generation (not HTML)
- Offline mode with sync
- Room-level photo galleries
- Timestamped audit trails
- Client branding/logo on reports

Workbase's AI-powered condition detection is a genuine differentiator, but the surrounding experience needs to match the baseline expectations of the category.

---

*End of audit.*
