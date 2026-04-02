# Ticket: MVP UI Improvement Scan

**Ticket ID:** WB-MVP-UI-01
**Epic:** WB-MVP-001 — Workbase AI MVP Build
**Status:** Ready for dev
**Priority:** High — complete before internal demo
**Owner:** TBD
**Surfaces:** Mobile (Expo) + Admin dashboard (React/Vite)

---

## Context

A Cursor-automated scan has been run across both app surfaces to identify UI and interaction issues that affect the core MVP demo journey. This ticket covers all actionable findings from that scan.

Items in `docs/post-demo.md` are **explicitly excluded** from this ticket — do not action them here.

---

## MVP Journey in Scope

The scan and this ticket cover only screens and components that touch this flow:

1. List inspections
2. Create an inspection
3. Step through rooms
4. Confirm items
5. Save fixed sections (meter readings, keys / fobs, general observations)
6. Generate and access a report

Any finding outside this flow is out of scope for this ticket.

---

## Design Reference

The visual standard for the mobile app is the **Trip.com mobile UI**. Key patterns your fixes should align with:

- Primary info large and leading in every card/row; status badges right-aligned, never colliding
- Empty states always have an icon + one line of human copy — never a blank screen
- Touch targets minimum 44×44pt throughout
- Active states unambiguous — filled icon, coloured label
- Typography has clear hierarchy — the eye has a natural entry point into every card
- Copy is human and action-oriented — no placeholder or developer-facing text visible to users

---

## Findings

> **These will be populated by Cursor after running `docs/cursor-mvp-improvements-prompt.md`.**
> The scan writes its full output to `docs/mvp-improvements.md`.
> Copy findings from there into the sections below once the scan completes.

### High Severity

_Paste High findings here — these block the demo and must ship first._

### Medium Severity

_Paste Medium findings here — noticeable but not immediately damaging._

### Low Severity

_Paste Low findings here — cosmetic, fix before handoff._

---

## Acceptance Criteria

- [ ] All High severity findings resolved and visually verified on device/simulator
- [ ] All Medium severity findings resolved or explicitly deferred with justification
- [ ] No placeholder, debug, or developer-facing copy visible on any MVP screen
- [ ] All interactive elements in the core flow meet 44×44pt minimum touch target
- [ ] Empty states exist on every MVP screen that can return zero results
- [ ] Colour token violations resolved on all MVP screens (no raw hex/rgb in `colours.ts` scope)
- [ ] `docs/mvp-improvements.md` findings marked resolved with commit references

---

## Explicitly Out of Scope

Do not action the following in this ticket — they are tracked in `docs/post-demo.md`:

- Loading skeletons (list screens)
- Filter chip pressed/active state
- Quick actions horizontal scroll row
- Review screen item row refactor
- Shared Chip component
- Swipe-to-archive (inspections)
- Auth, PDF export, live AI provider, Postgres, object storage, video upload, offline sync

--

## Related Files

| File                           | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `docs/mvp-improvements-v2.md`  | Full scan output from Cursor          |
| `docs/post-demo.md`            | Deferred items — do not action here   |
| `docs/workbase-ai-mvp-epic.md` | Full MVP epic and acceptance criteria |
