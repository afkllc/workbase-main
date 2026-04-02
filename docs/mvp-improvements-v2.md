# MVP Improvement Scan v2 — Notara
**Date:** Thursday Apr 2, 2026
**Surfaces audited:** Admin dashboard (frontend/), Mobile app (mobile/)
**Scope:** MVP journey — refined findings + new scan
**Design reference:** Trip.com (live, https://uk.trip.com)
**Auditor:** Cursor automated scan
**Status:** Awaiting developer action

FINDING 1
Area: Task 1 refined
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (save flow: lines 56-76; save CTA: line 157)
Problem: Saving fixed sections immediately navigates back (`router.back()`) with no visible success state/confirmation, so a first-time user can’t tell the save completed.
Trip.com deviation: yes — violates Trip.com “clear confirmation feedback” standard.
Severity: High
Suggested fix: Add a visible success confirmation on successful `updateSections()`:
1. In `sections.tsx`, add `const [successMessage, setSuccessMessage] = useState<string | null>(null);`.
2. After `await updateSections(...)` resolves, set `setSuccessMessage('Sections saved');` and only then navigate back (either `router.back()` after a short timeout matching the banner dismissal, or inside the banner’s `onDismiss` callback).
3. Render `{successMessage ? <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} /> : null}` near the top of the screen (import `SuccessBanner` from `../../../src/components/ui`).

FINDING 2
Area: Task 2 mobile
Surface: mobile
File: `mobile/src/components/StatusSummaryRow.tsx` (subtitle render: line 26)
Problem: `StatusSummaryRow` renders the `subtitle` prop without `numberOfLines`/`ellipsizeMode`, so long dynamic content (used for item descriptions in MVP checklist rows) can overflow and break row rhythm.
Trip.com deviation: yes — violates Trip.com “secondary text truncation in list rows” pattern.
Severity: High
Suggested fix: Update `StatusSummaryRow` subtitle rendering:
1. Change line 26 from `<Text style={styles.subtitle}>{subtitle}</Text>` to `<Text numberOfLines={1} ellipsizeMode="tail" style={styles.subtitle}>{subtitle}</Text>`.
2. Optionally add `flexShrink: 1` to `styles.subtitle` to ensure truncation behaves predictably in constrained rows.

FINDING 3
Area: Task 2 mobile
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (keys/fobs label: lines 115-135; keyLabel styles: lines 180-184)
Problem: The dynamic key/fob label (`formatDisplayName(label)`) renders without truncation props, so long labels can expand horizontally and crowd the adjacent quantity input.
Trip.com deviation: yes — violates Trip.com “two-column row stability” pattern.
Severity: Medium
Suggested fix: Add truncation to the key label `Text`:
1. Update the key label line 117 to `<Text numberOfLines={1} ellipsizeMode="tail" style={styles.keyLabel}>...</Text>`.
2. Ensure `styles.keyLabel` keeps `flex: 1` (already present) so truncation occurs instead of wrapping.

FINDING 4
Area: Task 2 mobile
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (quantity `TextInput`: lines 118-134; `qtyInput` style: lines 185-194)
Problem: The keys/fobs numeric `TextInput` has width and padding but no enforced `minHeight`, so its touch target can fall below the 44×44pt baseline depending on font rendering.
Trip.com deviation: yes — violates Trip.com “generous touch targets” baseline.
Severity: Medium
Suggested fix: Enforce minimum touch target height using the token:
1. Import `layout` from `../../../src/theme` in this file.
2. Add `minHeight: layout.minTouchTarget` to `styles.qtyInput` (alongside `width: 76` and padding).

FINDING 5
Area: Task 2 mobile
Surface: mobile
File: `mobile/src/screens/ReportsScreen.tsx` (Open report action: lines 152-155; `linkButton` styles: lines 222-228)
Problem: The “Open report” action is a custom `Pressable` whose height is driven only by padding; it doesn’t guarantee a minimum 44×44pt touch target.
Trip.com deviation: yes — violates Trip.com “tap target size” baseline.
Severity: Medium
Suggested fix: Make the action meet the minimum touch size:
1. In `ReportsScreen.tsx`, update `styles.linkButton` to include `minHeight: layout.minTouchTarget`.
2. Optionally add `minWidth: layout.minTouchTarget` if you find it visually too small on short labels.

FINDING 6
Area: Task 3 frontend
Surface: frontend
File: `frontend/src/screens/ReviewScreen.tsx` (no-checklist empty state copy: lines 123-129)
Problem: User-facing copy uses internal/dev phrasing: “smoke-test export and report output,” which can reduce demo credibility.
Trip.com deviation: yes — violates Trip.com “human, customer-facing language” standard.
Severity: Medium
Suggested fix: Replace the phrase with user-friendly wording, e.g. update the empty-state `description` to remove “smoke-test” (for example: “generate the report immediately to test the report output.”).

RESOLVED FINDINGS:
- FINDING 2 (from `docs/mvp-improvements.md`): recent inspections text truncation on `mobile/src/screens/HomeDashboardScreen.tsx` (already actioned per provided list)
- FINDING 4 (from `docs/mvp-improvements.md`): new-inspection “Current summary” line truncation on `mobile/app/new-inspection.tsx` (already actioned per provided list)

SUMMARY TABLE:
| # | Area | Surface | Severity | Trip.com Deviation | File |
|---:|---|---|---|---|---|
| 1 | Task 1 refined | mobile | High | yes | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 2 | Task 2 mobile | mobile | High | yes | `mobile/src/components/StatusSummaryRow.tsx` |
| 3 | Task 2 mobile | mobile | Medium | yes | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 4 | Task 2 mobile | mobile | Medium | yes | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 5 | Task 2 mobile | mobile | Medium | yes | `mobile/src/screens/ReportsScreen.tsx` |
| 6 | Task 3 frontend | frontend | Medium | yes | `frontend/src/screens/ReviewScreen.tsx` |

HONEST ASSESSMENT:
The strongest part of the current UI is the overall card-based structure and the clarity of primary CTAs throughout the mobile MVP screens. The admin dashboard’s layout and empty-state scaffolding are also consistent and readable, with status badges generally placed cleanly. The single biggest demo-credibility gap is the mobile “save fixed sections” step: without a visible success confirmation, users can’t trust their meter/key/notes were persisted. Next biggest issues are subtitle truncation and touch target assurance: long subtitle text and keys/fobs labels can crowd rows, and the custom “Open report” pressable may be slightly too small. These findings are code-anchored (not runtime visual-browser validated here), but the gaps are real UI/polish risks that will show up during demos. On track in two weeks only if you treat these as priority UI polish fixes rather than “nice to have” tweaks.

# MVP Improvement Scan v2 — Notara
**Date:** Thursday Apr 2, 2026
**Surfaces audited:** Admin dashboard (frontend/), Mobile app (mobile/)
**Scope:** MVP journey — refined findings + new scan
**Design reference:** Trip.com (live, https://uk.trip.com)
**Auditor:** Cursor automated scan
**Status:** Awaiting developer action

FINDING 1
Area: Task 1 refined
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (save flow: lines 56-76; save CTA: line 157)
Problem: Saving fixed sections immediately navigates back (`router.back()`) with no visible success state/confirmation, so a first-time user can’t tell the save completed.
Trip.com deviation: yes — violates Trip.com “clear confirmation feedback” standard.
Severity: High
Suggested fix: Add a visible success confirmation on successful `updateSections()`:
1. In `sections.tsx`, add `const [successMessage, setSuccessMessage] = useState<string | null>(null);`.
2. After `await updateSections(...)` resolves, set `setSuccessMessage('Sections saved');` and only then navigate back (either `router.back()` after a short timeout matching the banner dismissal, or inside the banner’s `onDismiss` callback).
3. Render `{successMessage ? <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} /> : null}` near the top of the screen (import `SuccessBanner` from `../../../src/components/ui`).

FINDING 2
Area: Task 2 mobile
Surface: mobile
File: `mobile/src/components/StatusSummaryRow.tsx` (subtitle render: line 26)
Problem: `StatusSummaryRow` renders the `subtitle` prop without `numberOfLines`/`ellipsizeMode`, so long dynamic content (used for item descriptions in MVP checklist rows) can overflow and break row rhythm.
Trip.com deviation: yes — violates Trip.com “secondary text truncation in list rows” pattern.
Severity: High
Suggested fix: Update `StatusSummaryRow` subtitle rendering:
1. Change line 26 from `<Text style={styles.subtitle}>{subtitle}</Text>` to `<Text numberOfLines={1} ellipsizeMode="tail" style={styles.subtitle}>{subtitle}</Text>`.
2. Optionally add `flexShrink: 1` to `styles.subtitle` to ensure truncation behaves predictably in constrained rows.

FINDING 3
Area: Task 2 mobile
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (keys/fobs label: lines 115-135; keyLabel styles: lines 180-184)
Problem: The dynamic key/fob label (`formatDisplayName(label)`) renders without truncation props, so long labels can expand horizontally and crowd the adjacent quantity input.
Trip.com deviation: yes — violates Trip.com “two-column row stability” pattern.
Severity: Medium
Suggested fix: Add truncation to the key label `Text`:
1. Update the key label line 117 to `<Text numberOfLines={1} ellipsizeMode="tail" style={styles.keyLabel}>...</Text>`.
2. Ensure `styles.keyLabel` keeps `flex: 1` (already present) so truncation occurs instead of wrapping.

FINDING 4
Area: Task 2 mobile
Surface: mobile
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (quantity `TextInput`: lines 118-134; `qtyInput` style: lines 185-194)
Problem: The keys/fobs numeric `TextInput` has width and padding but no enforced `minHeight`, so its touch target can fall below the 44×44pt baseline depending on font rendering.
Trip.com deviation: yes — violates Trip.com “generous touch targets” baseline.
Severity: Medium
Suggested fix: Enforce minimum touch target height using the token:
1. Import `layout` from `../../../src/theme` in this file.
2. Add `minHeight: layout.minTouchTarget` to `styles.qtyInput` (alongside `width: 76` and padding).

FINDING 5
Area: Task 2 mobile
Surface: mobile
File: `mobile/src/screens/ReportsScreen.tsx` (Open report action: lines 152-155; `linkButton` styles: lines 222-228)
Problem: The “Open report” action is a custom `Pressable` whose height is driven only by padding; it doesn’t guarantee a minimum 44×44pt touch target.
Trip.com deviation: yes — violates Trip.com “tap target size” baseline.
Severity: Medium
Suggested fix: Make the action meet the minimum touch size:
1. In `ReportsScreen.tsx`, update `styles.linkButton` to include `minHeight: layout.minTouchTarget`.
2. Optionally add `minWidth: layout.minTouchTarget` if you find it visually too small on short labels.

FINDING 6
Area: Task 3 frontend
Surface: frontend
File: `frontend/src/screens/ReviewScreen.tsx` (no-checklist empty state copy: lines 123-129)
Problem: User-facing copy uses internal/dev phrasing: “smoke-test export and report output,” which can reduce demo credibility.
Trip.com deviation: yes — violates Trip.com “human, customer-facing language” standard.
Severity: Medium
Suggested fix: Replace the phrase with user-friendly wording, e.g. update the empty-state `description` to remove “smoke-test” (for example: “generate the report immediately to test the report output.”).

RESOLVED FINDINGS:
- FINDING 2 (from `docs/mvp-improvements.md`): recent inspections text truncation on `mobile/src/screens/HomeDashboardScreen.tsx` (already actioned per provided list)
- FINDING 4 (from `docs/mvp-improvements.md`): new-inspection “Current summary” line truncation on `mobile/app/new-inspection.tsx` (already actioned per provided list)

SUMMARY TABLE:
| # | Area | Surface | Severity | Trip.com Deviation | File |
|---:|---|---|---|---|---|
| 1 | Task 1 refined | mobile | High | yes | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 2 | Task 2 mobile | mobile | High | yes | `mobile/src/components/StatusSummaryRow.tsx` |
| 3 | Task 2 mobile | mobile | Medium | yes | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 4 | Task 2 mobile | mobile | Medium | yes | `mobile/app/inspection/[inspectionId]/sections.tsx` |
| 5 | Task 2 mobile | mobile | Medium | yes | `mobile/src/screens/ReportsScreen.tsx` |
| 6 | Task 3 frontend | frontend | Medium | yes | `frontend/src/screens/ReviewScreen.tsx` |

HONEST ASSESSMENT:
The strongest part of the current UI is the overall card-based structure and the clarity of primary CTAs throughout the mobile MVP screens. The admin dashboard’s layout and empty-state scaffolding are also consistent and readable, with status badges generally placed cleanly. The single biggest demo-credibility gap is the mobile “save fixed sections” step: without a visible success confirmation, users can’t trust their meter/key/notes were persisted. Next biggest issues are subtitle truncation and touch target assurance: long subtitle text and keys/fobs labels can crowd rows, and the custom “Open report” pressable may be slightly too small. These findings are code-anchored (not runtime visual-browser validated here), but the gaps are real UI/polish risks that will show up during demos. On track in two weeks only if you treat these as priority UI polish fixes rather than “nice to have” tweaks.

