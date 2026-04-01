# WB-UX-001: AI-First Mobile UI Refresh

**Date:** 2026-03-31
**Status:** Approved — ready for implementation
**Platform:** Mobile only (`mobile/`)
**Audience:** Developer + Cursor (AI agent)
**Related docs:** `docs/ui-ux-audit.md`, `docs/ui-ux-ai-first-refresh-ticket.md`

---

## Context

The current mobile interface is functional but engineering-oriented — heavy
on forms, light on AI presence. The goal of this ticket is to make Workbase
feel AI-first: assisted, not manual; conversational, not bureaucratic;
guided end to end, not screen-by-screen data entry.

This ticket covers all three phases. Deliver them in order. Do not start
Phase 2 until Phase 1 acceptance criteria pass. Do not start Phase 3 until
Phase 2 acceptance criteria pass.

**For Cursor:** execute each phase as a discrete implementation pass against
the actual files in `mobile/`. Do not describe or plan — implement and
return diffs. Flag any blocked dependency before starting that item.

---

## Hard rules (apply across all phases)

- No backend or API changes
- No new routes without flagging first
- No new third-party libraries without discussion
- All colours must reference `src/theme/colours.ts` — zero hardcoded hex
  values
- Every change must pass `npm run typecheck` and
  `npx expo export --platform web`
- AI-assisted and manual fallback paths must both remain available on every
  critical form

---

## Phase 1 — High-impact polish and accessibility

**Goal:** Remove unfinished edges, fix copy, add feedback states, and make
the app feel complete enough to demo confidently.

### 1.1 UI copy refresh

- Audit every screen for technical or internal phrasing visible to the user
  (e.g. raw field keys, snake_case labels, engineering-facing error messages)
- Replace with plain, user-facing language throughout
- Condition labels must be normalised: use `N/A` not `na`, `Not started`
  not `not_started`, `In progress` not `in_progress`

### 1.2 Success feedback system

- Every action that saves, confirms, or generates something must produce
  visible feedback — toast, inline state change, or banner
- No action should complete silently
- Use a shared `Toast` or `Feedback` component — do not implement
  per-screen one-offs

### 1.3 Empty state upgrades

- Every list or dashboard screen must have a considered empty state:
  an icon or illustration placeholder, a clear explanation, and a
  primary action to move forward
- Replace any raw "No data", blank lists, or unstyled fallbacks

### 1.4 Focus and accessibility fixes

- All interactive elements must have a minimum 48×48pt touch target
- Form inputs must have visible focus states using `colours.primary`
- Error messages must be visible, styled, and placed adjacent to the
  relevant field — not at the bottom of the screen

### 1.5 Loading states

- Primary lists and cards must show skeleton placeholders during loading
- No screen should flash blank content before data arrives

### Phase 1 acceptance criteria

- [ ] Zero snake_case or internal strings visible in the UI
- [ ] Every save/confirm/generate action produces visible feedback
- [ ] Every list screen has a styled, actionable empty state
- [ ] All touch targets meet 48×48pt minimum
- [ ] Loading skeletons present on all primary lists and cards
- [ ] `npm run typecheck` passes
- [ ] `npx expo export --platform web` passes

---

## Phase 2 — AI-first interaction layer

**Goal:** Make AI the primary co-pilot. Users should review and approve,
not type everything from scratch.

### 2.1 Intent-led inspection creation

- Replace the current form-first new inspection screen with an intent
  capture input as the primary entry point:
  - Placeholder: `"Create check-in for 12 High Street tomorrow"`
  - AI parses address, date, and template hints from the input
  - Manual fields move under a collapsed `Edit details` section
- Keep the existing manual creation path fully functional as the fallback

### 2.2 Camera-first room capture

- Make `Capture room` (camera) the primary, most visually prominent action
  on the room capture screen
- After photo capture, AI immediately proposes checklist updates inline
- Add two inline actions below AI suggestions:
  - `Accept all high confidence`
  - `Review uncertain (N)` where N is the count of uncertain items

### 2.3 Exception-first review mode

- Default the review screen filter to unconfirmed and low-confidence items
- Add batch actions:
  - `Accept all` per room
  - `Accept all` globally
- Add a plain-language summary before the generate report action:
  e.g. `"3 items need attention before generating"`

### 2.4 AI suggestion cards

- Every AI suggestion must support four inline actions:
  `Accept`, `Edit`, `Dismiss`, `Why?`
- `Why?` expands a one-line explainability snippet explaining the basis
  for the suggestion

### 2.5 Confidence buckets

- Group AI outputs into three buckets: `High confidence`, `Medium`,
  `Low — needs review`
- High confidence items support bulk-approve
- Low confidence items surface first in review mode

### 2.6 AI action bar

- Add a persistent but unobtrusive AI entry point accessible from the
  home screen and inspection detail screen
- Three actions: `Ask AI`, `Summarise progress`, `What should I do next?`
- This is an entry point only — do not implement full conversational AI
  in this phase, stub the responses with realistic placeholder text

### Phase 2 acceptance criteria

- [ ] New inspection screen has intent input as primary entry point with
      manual fallback
- [ ] Room capture screen is camera-first with inline AI suggestion actions
- [ ] Review screen defaults to exception-first filter with batch actions
- [ ] Every AI suggestion card has Accept / Edit / Dismiss / Why? actions
- [ ] Confidence buckets group AI outputs consistently across the app
- [ ] AI action bar is present on home and inspection detail screens
- [ ] All manual fallback paths remain functional
- [ ] `npm run typecheck` passes
- [ ] `npx expo export --platform web` passes

---

## Phase 3 — Visual system and structural upgrade

**Goal:** Elevate the visual language to match the AI-first product
direction. Field intelligence you can trust.

### 3.1 Type system upgrade

- Introduce a stronger display style for key moments:
  briefing cards, readiness states, completion screens
- Body and input text must be highly legible — no washed-out metadata
- Apply the type scale from the existing design system consistently
  across every screen

### 3.2 Colour system upgrade

Extend `src/theme/colours.ts` with intentional semantic tokens:
```ts
export const colours = {
  // existing tokens retained
  primary: '#3B5B8C',
  primaryActive: '#2E4A73',
  accent: '#1D9E75',
  background: '#F7F7F5',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  border: '#E0E0DC',
  destructive: '#C0392B',
  success: '#27AE60',
  // new semantic tokens
  aiHighlight: '#EEF4FF',      // background for AI suggestion cards
  aiHighlightBorder: '#B8CFEF', // border for AI suggestion cards
  attention: '#F59E0B',         // review needed / medium confidence
  attentionText: '#92400E',     // text on attention surfaces
  confidenceHigh: '#27AE60',    // maps to success
  confidenceMedium: '#F59E0B',  // maps to attention
  confidenceLow: '#C0392B',     // maps to destructive
} as const
```

Apply new tokens across all AI suggestion cards, confidence indicators,
and review screens.

### 3.3 Motion and feedback

- Add subtle transitions for state changes: save, confirm, generate
- Immediate success confirmations via the shared feedback system from
  Phase 1
- Skeleton loading must feel intentional — use consistent shimmer
  animation, not static grey blocks

### 3.4 Higher contrast hierarchy

- Audit every screen for low-contrast text on muted surfaces
- Replace grey-on-grey combinations with intentional foreground/background
  pairings from the updated colour system
- Primary actions must be visually dominant relative to secondary controls
  on every screen

### 3.5 Icon-led guidance

- Add icons to section headings, empty states, and key action buttons
  where they improve scanability
- Use the existing Expo-bundled icon set — do not add a new icon library

### Phase 3 acceptance criteria

- [ ] New semantic colour tokens added to `src/theme/colours.ts` and
      applied to AI suggestion cards and confidence indicators
- [ ] No low-contrast text on muted surfaces anywhere in the app
- [ ] State transitions (save, confirm, generate) have visible motion
- [ ] Skeleton loading uses consistent shimmer animation
- [ ] Primary actions are visually dominant on every screen
- [ ] Icons present on section headings, empty states, and key actions
- [ ] `npm run typecheck` passes
- [ ] `npx expo export --platform web` passes

---

## Overall acceptance criteria

This ticket is complete when:

1. A first-time user can complete an inspection with less manual typing
   and clearer guidance than today
2. AI assistance is present at start, mid-flow, and end-flow — not only
   in room capture
3. Every critical action has visible feedback
4. Visual hierarchy is intentional — clear primary actions, readable type,
   strong contrast
5. Exception-first review measurably reduces confirm time in a walkthrough
6. All three phase-level acceptance criteria pass

---

## Out of scope

- Backend or API changes
- Offline sync
- Signature capture
- Branded PDF report redesign
- Multi-tenant or white-label theming
- Frontend web dashboard (separate ticket)