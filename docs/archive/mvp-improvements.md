# MVP Improvement Scan — Notara
**Date:** Thursday Apr 2, 2026
**Surfaces audited:** Admin dashboard (frontend/), Mobile app (mobile/)
**Scope:** MVP journey only — deferred items excluded per post-demo.md
**Design reference:** Trip.com mobile UI
**Auditor:** Cursor automated scan
**Status:** Awaiting developer action

FINDING 1
Area: Core Flow Blockers
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (save flow: lines 56-76; save CTA: lines 157-158)
Problem: Saving fixed sections (“meter readings / keys and fobs / general observations”) returns immediately with no visible success state/confirmation to the user.
Trip.com deviation: yes — violates Trip.com “clear confirmation feedback” standard (user needs an explicit saved-success moment).
Severity: High
  High = visible in a demo and damages credibility
  Medium = noticeable but not immediately damaging
  Low = cosmetic, worth fixing before handoff
Suggested fix: Add a visible success banner/toast on successful `updateSections()` (e.g., show `SuccessBanner` with “Sections saved” and only navigate `router.back()` after the banner is shown/dismissed). If you keep the current back navigation, at least pass a “saved=1” param and render a success Notice on the previous inspection screen.

FINDING 2
Area: Text Overflow On MVP Screens (mobile)
Surface: mobile
File: `mobile/src/screens/HomeDashboardScreen.tsx` (recent inspections row text: lines 208-213)
Problem: Dynamic text (`inspection.property_address`, property type + date, and item counts) is rendered without `numberOfLines` / `ellipsizeMode`, so long addresses/descriptions can overflow and visually break the card row.
Trip.com deviation: yes — violates Trip.com “card/list readability via truncation” pattern.
Severity: Medium
  High = visible in a demo and damages credibility
  Medium = noticeable but not immediately damaging
  Low = cosmetic, worth fixing before handoff
Suggested fix: Add `numberOfLines={1}` and `ellipsizeMode="tail"` to `Text` components rendering `inspection.property_address`, the meta line, and the progress line in the recent-inspections list row.

FINDING 3
Area: Text Overflow On MVP Screens (mobile)
Surface: mobile
File: `mobile/src/components/StatusSummaryRow.tsx` (subtitle render: lines 20-30)
Problem: `StatusSummaryRow` renders the `subtitle` prop without `numberOfLines` / `ellipsizeMode`. This is used in the MVP room checklist where `subtitle={item.description || ...}`, so long item descriptions can overflow.
Trip.com deviation: yes — violates Trip.com “truncate secondary text in list rows” pattern.
Severity: High
  High = visible in a demo and damages credibility
  Medium = noticeable but not immediately damaging
  Low = cosmetic, worth fixing before handoff
Suggested fix: Update `StatusSummaryRow` to render subtitle with `numberOfLines={1}` and `ellipsizeMode="tail"` (and ensure `styles.subtitle` allows shrink, e.g., `flexShrink: 1` on the subtitle container or text).

FINDING 4
Area: Text Overflow On MVP Screens (mobile)
Surface: mobile
File: `mobile/app/new-inspection.tsx` (current summary address/postcode text: lines 200-207)
Problem: Dynamic summary text for property address and postcode is rendered without `numberOfLines` / `ellipsizeMode`, so long addresses can overflow the “Current summary” card and push the UI awkwardly.
Trip.com deviation: yes — violates Trip.com “stable card layout with truncation” pattern.
Severity: Medium
  High = visible in a demo and damages credibility
  Medium = noticeable but not immediately damaging
  Low = cosmetic, worth fixing before handoff
Suggested fix: Add `numberOfLines={1}` and `ellipsizeMode="tail"` to the `Text` elements that render `form.property_address` and `form.postcode` in the “Current summary” section.

FINDING 5
Area: Text Overflow On MVP Screens (mobile)
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (keys and fobs list label: lines 115-135; `keyLabel` styles: lines 180-184)
Problem: The dynamic “key” label for keys/fobs is rendered without `numberOfLines` / `ellipsizeMode`. Long key labels can collide with the numeric input column and degrade the fixed-section editing experience.
Trip.com deviation: yes — violates Trip.com “two-column row stability” pattern.
Severity: Medium
  High = visible in a demo and damages credibility
  Medium = noticeable but not immediately damaging
  Low = cosmetic, worth fixing before handoff
Suggested fix: Add `numberOfLines={1}` and `ellipsizeMode="tail"` to the `Text` rendering `formatDisplayName(label)` and ensure the label text container uses `flexShrink: 1` so it wraps/truncates rather than expanding.

| # | Area | Surface | Severity | Trip.com Deviation | File |
|---:|---|---|---|---|---|
| 1 | Core Flow Blockers | mobile | High | yes (clear confirmation feedback) | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 2 | Text Overflow On MVP Screens (mobile) | mobile | Medium | yes (card/list readability via truncation) | `mobile/src/screens/HomeDashboardScreen.tsx` |
| 3 | Text Overflow On MVP Screens (mobile) | mobile | High | yes (truncate secondary text in list rows) | `mobile/src/components/StatusSummaryRow.tsx` |
| 4 | Text Overflow On MVP Screens (mobile) | mobile | Medium | yes (stable card layout with truncation) | `mobile/app/new-inspection.tsx` |
| 5 | Text Overflow On MVP Screens (mobile) | mobile | Medium | yes (two-column row stability) | `mobile/app/inspection/[inspectionId]/sections.tsx` |
