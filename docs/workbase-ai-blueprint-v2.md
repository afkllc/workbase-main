# Workbase AI — MVP Definition

**Epic ID:** WB-MVP-001
**Status:** In progress
**Last updated:** April 2026
**Stack:** React admin dashboard + Expo mobile app + FastAPI backend
**Related:** `docs/workbase-ai-blueprint-v2.md`

---

## What This Document Is

This is the single source of truth for what the MVP must do and what
done looks like. It is not a technical spec — the blueprint covers
architecture. This doc answers one question: what must work, for whom,
and to what standard, before we consider the MVP complete?

---

## MVP Goal

Demonstrate a complete, believable property inventory workflow to an
internal team audience within two weeks. Every part of the core loop
must work end-to-end without hand-holding, look professional enough to
show to a real letting agent, and feel like a coherent product rather
than a collection of screens.

---

## Core Loop (must work flawlessly)

This is the sequence a clerk follows on mobile. If any step breaks,
stalls, or looks unfinished, the MVP is not ready.

1. Open the app and see the inspection list
2. Create a new inspection from a template
3. Navigate to the inspection overview and understand what to do next
4. Open each room and work through checklist items
5. Upload at least one photo per room and receive an AI suggestion
6. Return to the inspection overview and see progress update
7. Open review when all rooms are complete
8. Confirm items and generate the report
9. View the generated report
10. Archive the report from the mobile reports screen

If a clerk can complete this loop without being told what to do at any
step, the mobile MVP is ready.

---

## What Must Work Flawlessly for the Internal Demo

### 1. Mobile end-to-end flow

The flow from empty inspection to generated report must feel seamless
and guided. Specifically:

- Every screen must communicate where the user is in the overall journey
- Every completed action must visibly update the relevant screen
- Every screen must have a clear primary next action — no dead ends
- Back navigation must be consistent and predictable across all screens
- The bottom navigation must render correctly on all screen sizes with
  no label overflow or overlapping content

Acceptance bar: a first-time user completes the full loop without
asking what to do next.

### 2. Visual polish

The app must look professional enough that showing it to a letting
agent would not cause embarrassment. Specifically:

- All colours reference `src/theme/colours.ts` — zero hardcoded values
- No snake_case or internal strings visible anywhere in the UI
- No blank screens, missing states, or unstyled error messages
- Back buttons are consistently positioned across all stack screens
- The bottom navigation renders correctly at all screen widths
- The AI icon is implemented and visible on relevant mobile screens

Acceptance bar: a non-technical person describes the app as polished
and intentional.

### 3. Report quality and readability

The generated report must be readable and credible. Specifically:

- Report content is structured clearly by room and section
- Condition labels are normalised (`N/A`, `Good`, `Fair`, `Poor`)
- The report opens reliably from the mobile reports screen
- The report is readable without requiring zoom or horizontal scroll

Acceptance bar: the report could be shown to a letting agent as an
example output without apology.

### 4. Archive and delete on mobile

Clerks must be able to archive reports from the mobile app. Specifically:

- An archive action is available on the reports screen
- A confirmation prompt appears before archiving
- The report disappears from the list immediately after archiving
- The backend `PATCH /api/reports/{inspection_id}/archive` endpoint
  exists and is wired to the mobile action

Acceptance bar: archiving a report works in one tap with no visible
errors.

---

## What Is Explicitly Not Required for This MVP

The following are real product requirements but are deferred beyond
this demo:

- PDF export (frontend only, next epic)
- Report editing on the web dashboard (next epic)
- Live AI model providers (Gemini/Groq) — mock is sufficient for demo
- Auth and user accounts
- Production Postgres database
- Object storage for photos
- Offline sync
- Native video upload
- Branded PDF output
- Multi-tenancy

Do not build these. Do not stub them in a way that implies they are
coming immediately. Keep scope clean.

---

## Demo Readiness Checklist

The MVP is ready when every item below is true:

**Mobile flow**
- [ ] Full core loop completable without guidance
- [ ] No dead ends — every screen has a clear next action
- [ ] Progress updates visibly after each room is completed
- [ ] Back navigation is consistent across all stack screens
- [ ] Bottom nav renders correctly on small screens — no overflow

**Visual quality**
- [ ] Zero hardcoded hex values outside `src/theme/colours.ts`
- [ ] Zero snake_case strings visible in the UI
- [ ] AI icon implemented on relevant mobile screens
- [ ] No blank, broken, or placeholder states on any primary screen

**Reports**
- [ ] Report generates successfully from the review screen
- [ ] Report is readable and well-structured
- [ ] Report opens from the mobile reports screen without errors

**Archive**
- [ ] Archive action present on mobile reports screen
- [ ] Confirmation prompt shown before archiving
- [ ] Report removed from list immediately after archiving
- [ ] Backend archive endpoint exists and responds correctly

**Technical**
- [ ] `npm run typecheck` passes
- [ ] `npx expo export --platform web` passes
- [ ] Backend starts cleanly with no import errors
- [ ] Full core loop works end-to-end with backend running locally

---

## What Comes After This MVP

Once the internal demo passes the checklist above, the next phase is:

**WB-MVP-002: Persistence and Auth**
- Postgres migration
- JWT auth
- User-scoped inspections

**WB-MVP-003: Real Capture Services**
- File upload storage
- Live AI provider (Gemini)
- Real photo analysis and room scan pipeline

**WB-MVP-004: Production Reports**
- PDF export
- Branded layout
- Frontend report editing and delivery

---

## Engineering Rules (unchanged from blueprint)

- Mobile app must not invent routes the backend does not expose
- Frontend must not own business logic belonging to inspections or reports
- AI must stay behind backend service boundaries
- All colours must reference the centralised theme file
- Built-in templates remain file-based and read-only