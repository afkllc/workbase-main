# MVP Gap Analysis — Notara
**Date:** April 12, 2026  
**Surfaces audited:** Backend, Admin dashboard (frontend/), Mobile (mobile/)  
**Reference:** Epic WB-MVP-001 + Trip.com layout reference  
**Auditor:** Cursor automated analysis  
**Status:** Awaiting developer action  

**Runtime verification:** FastAPI (`uvicorn` on port 8000), Vite admin (`http://localhost:3000/`), Expo web (`http://localhost:8081/`), and scripted `Invoke-RestMethod` calls against `http://localhost:8000` for templates, inspections, sections, generate, report file fetch, and archive.

---

FINDING 1  
Area: Area 1 — Backend route coverage  
MVP step affected: 1  
Surface: backend  
File: `backend/app/main.py` (routers included: templates, inspections, reports only); `backend/app/api/routes/health.py` (empty router)  
Status: PARTIAL  
Problem: README documents `GET /health`, but no health router is mounted and `health.py` defines no route, so `GET /health` returns 404.  
Impact: Low  
Suggested action: Add `@router.get("/health")` returning `{"status": "ok"}` and `app.include_router(health_router)` in `create_app()`, or remove `/health` from `README.md` if intentionally dropped.

---

FINDING 2  
Area: Area 1 — Backend route coverage  
MVP step affected: 1  
Surface: backend | all  
File: `backend/app/api/routes/inspections.py` (e.g. lines 34–50, 84–90); `backend/app/api/routes/reports.py` (lines 12–17)  
Status: PARTIAL  
Problem: The audit checklist names differ from the implemented contract: item updates use `PATCH /api/inspections/{id}/rooms/{room_id}/items` with `item_id` in the JSON body (not `PATCH .../items/{itemId}`); fixed sections use `PATCH .../sections` (not `POST`); report generation uses `POST .../generate` (not `POST .../report`); there is no standalone `GET .../inspections/{id}/sections` (sections live on `GET .../inspections/{id}`); reports are fetched at `GET /api/reports/{inspection_id}` (inspection-scoped id, not an opaque report id).  
Impact: Medium  
Suggested action: Treat the **implemented** routes as canonical for WB-MVP-001; update any external checklists or OpenAPI docs to match `inspections.py` / `reports.py`. Clients already align (`mobile/src/lib/api.ts`, `frontend/src/api/client.ts`).

---

FINDING 3  
Area: Area 1 — Backend route coverage  
MVP step affected: 3  
Surface: mobile  
File: `mobile/scripts/set-local-ip.js` (lines 55–67)  
Status: PARTIAL  
Problem: `npm start` runs this script before Expo and **rewrites** `mobile/.env.local` to `http://<LAN-IP>:8000`, overriding a developer-set `EXPO_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8000` from README). Local Expo web against localhost-only backend can break if the rewritten IP does not match the machine’s current LAN address.  
Impact: Medium  
Suggested action: Only upsert LAN URL when `USE_LAN_API=1` (or similar), or skip rewriting when `.env.local` already sets `EXPO_PUBLIC_API_BASE_URL` to an explicit value.

---

FINDING 4  
Area: Area 2 — Mobile MVP journey gaps  
MVP step affected: 5, 6  
Surface: mobile  
File: `mobile/app/inspection/[inspectionId]/room/[roomId].tsx` (e.g. lines 618–621)  
Status: PARTIAL  
Problem: During active room capture, a secondary **“Review flagged items”** button always routes to the inspection review screen, pulling reporting/review language into the capture loop.  
Impact: Medium  
Suggested action: Hide or demote this control until the room is complete (or rename to “Exceptions” and show only when `flaggedCount > 0`) so capture stays primary.

---

FINDING 5  
Area: Area 2 — Mobile MVP journey gaps / Area 4 — WB-108  
MVP step affected: 8  
Surface: mobile  
File: `mobile/app/inspection/[inspectionId]/review.tsx` (lines 15–17, 77–78, 199–220)  
Status: PARTIAL  
Problem: `itemNeedsAction` returns true for **any** item with `condition === 'fair'`, even after `is_confirmed` is true, so “needs attention” counts and the **Needs attention** filter never clears for fair-but-confirmed items—misleading for exception-based review.  
Impact: Medium  
Suggested action: Narrow the predicate to exceptions only, e.g. require `!item.is_confirmed` for fair/poor, or treat confirmed fair as resolved unless `source`/confidence warrants follow-up.

---

FINDING 6  
Area: Area 2 — Mobile MVP journey gaps  
MVP step affected: 9  
Surface: mobile  
File: `mobile/src/screens/ReportsScreen.tsx` (lines 215–221, 147–150)  
Status: BROKEN  
Problem: The archive control sets `display: 'none'` on the archive `Pressable`, so **archive is implemented in code paths but invisible** in the UI.  
Impact: Medium  
Suggested action: Remove `display: 'none'` from `styles.archiveButton` (or replace with visible styling) so `archiveReport` is reachable.

---

FINDING 7  
Area: Area 3 — Admin dashboard MVP journey gaps  
MVP step affected: 9  
Surface: frontend  
File: `frontend/src/api/client.ts` (no `archiveReport`); `frontend/src/App.tsx` (filters `!entry.is_archived` only)  
Status: MISSING  
Problem: The admin dashboard never calls `PATCH /api/reports/{inspection_id}/archive`; completed reports can only be hidden from the list via other clients or manual API calls.  
Impact: Medium  
Suggested action: Add `archiveReport(inspectionId)` to `frontend/src/api/client.ts` and a secondary action on `ReportsScreen` (or inspection detail) consistent with mobile.

---

FINDING 8  
Area: Area 3 — Admin dashboard MVP journey gaps  
MVP step affected: 2, 5  
Surface: frontend  
File: `frontend/src/screens/RoomCaptureScreen.tsx` (photo upload + video scan + per-item suggestion UI)  
Status: PARTIAL  
Problem: The web dashboard implements the same **field-style photo/scan capture** as mobile rather than focusing on agency oversight (bulk status, assignment, delivery—deferred elsewhere). It functions but overlaps mobile’s job.  
Impact: Low  
Suggested action: For MVP demo, keep as smoke-test surface; later, thin admin to progress/inspection management and leave capture to mobile per epic positioning.

---

FINDING 9  
Area: Area 4 — WB-108 rapid capture acceptance criteria  
MVP step affected: 5, 6  
Surface: mobile  
File: `mobile/app/inspection/[inspectionId]/room/[roomId].tsx` (auto-save path ~308–343; banner ~549–561)  
Status: PARTIAL  
Problem: **Criterion 1:** Straightforward items can auto-save after AI analysis without opening the sheet—**PASS** for the happy path; **PARTIAL** overall because fair/poor semantics still drive review noise (see Finding 5). **Criterion 2:** After completion, the UI surfaces “Next item armed” in a time-limited banner but does **not** auto-navigate or auto-open the next item—**PARTIAL**.  
Impact: Medium  
Suggested action: Optionally scroll/focus the next armed row or offer a one-tap “Continue” to the next item after save.

---

FINDING 10  
Area: Area 4 — WB-108 rapid capture acceptance criteria  
MVP step affected: 5  
Surface: mobile  
File: `mobile/app/inspection/[inspectionId]/room/[roomId].tsx` (lines 466–479, 618–620)  
Status: PASS  
Problem: (None—evidence only.) When `roomComplete`, the screen shows a primary button for **next room**, **fixed sections**, or **finish review** depending on state—clear next-room / next-stage CTAs.  
Impact: Low  
Suggested action: None required for criterion 3; keep behavior stable.

---

FINDING 11  
Area: Area 4 — WB-108 rapid capture acceptance criteria  
MVP step affected: 5, 6, 7  
Surface: mobile  
File: `mobile/app/inspection/[inspectionId]/sections.tsx` (form layout); `mobile/app/inspection/[inspectionId]/index.tsx` (lines 134–138 secondary actions)  
Status: PARTIAL  
Problem: **Criterion 4:** Room capture with camera + auto-save feels field-oriented; **fixed sections** and the inspection hub expose multiple pathways into **review** and **sections**, which reads closer to a **form + reporting** shell than a single-purpose field tool.  
Impact: Medium  
Suggested action: Reduce parallel entry points during active capture (e.g. collapse secondary buttons behind a “More” menu until room complete).

---

FINDING 12  
Area: Area 5 — Fixed sections (WB-106)  
MVP step affected: 7  
Surface: backend | mobile  
File: `backend/app/api/routes/inspections.py` (`PATCH .../sections`); `backend/app/services/store.py` (`update_sections`, lines 316–326); verified via API: PATCH sections then `GET /api/inspections/{id}` shows meter readings and notes persisted  
Status: PASS  
Problem: (None.) Meter readings (gas/electric/water), keys/fobs, and general observations save through FastAPI and reload correctly on `GET /api/inspections/{id}`.  
Impact: Low  
Suggested action: None for persistence; optional UX polish on `sections.tsx` only.

---

FINDING 13  
Area: Area 6 — Report generation (WB-107)  
MVP step affected: 9  
Surface: backend | mobile | frontend  
File: `backend/app/services/reports.py` (writes `backend/generated_reports/{inspection_id}.html`); `mobile/app/inspection/[inspectionId]/review.tsx` (`generateReport` ~155–169); `mobile/src/screens/ReportsScreen.tsx` (`Linking.openURL(getReportUrl(report_url))`); `frontend/src/screens/ReviewScreen.tsx` + `ReportsScreen.tsx`  
Status: PASS  
Problem: (None.) Review triggers `POST /api/inspections/{id}/generate`, backend writes HTML, `report_url` points at `GET /api/reports/{inspection_id}`, and clients open that URL. Report generation stays gated behind sections + confirmed items (`store.generate_report`), so it is **end-stage** relative to capture.  
Impact: Low  
Suggested action: Wire admin archive (Finding 7) for parity; no change required to generation positioning.

---

FINDING 14  
Area: Area 7 — Layout quality vs Trip.com reference  
MVP step affected: 5, 6, 8  
Surface: mobile  
File: `mobile/src/components/StatusSummaryRow.tsx`; list screens under `mobile/src/screens/`, `mobile/app/inspection/`  
Status: LAYOUT GAP  
Problem: **Inspections list:** Title + subtitle + right `StatusBadge` match a Trip.com-like hierarchy (primary left, status right). **Room item rows:** `StatusSummaryRow` keeps status right-aligned; tags (“Next”, “Flagged”) sit beside the title—generally clear, but dense stacks on small widths. **Fixed sections screen:** Long form with many equal-weight fields feels **more like a settings form** than Trip.com’s airy card/timeline rhythm—acceptable for MVP but not “generous” spacing.  
Impact: Low  
Suggested action: Increase vertical rhythm between section groups on `sections.tsx`; ensure status badges never truncate primary titles on narrow devices.

---

FINDING 15  
Area: Area 2 — Mobile MVP journey gaps  
MVP step affected: 4  
Surface: mobile  
File: `mobile/app/template-builder.tsx` (template authoring)  
Status: PARTIAL  
Problem: Template builder / custom template flows extend beyond WB-MVP-001 “route-backed only” minimal scope; not harmful but adds surface area for demos.  
Impact: Low  
Suggested action: Flag as optional in demo scripts or hide behind settings until WB-MVP-002+.

---

MVP STEP SCORECARD  

1. **Run the FastAPI backend** — **COMPLETE.** Uvicorn serves templates, inspections, reports; scripted CRUD/report/archive succeeded.  
2. **Run the React admin dashboard** — **COMPLETE.** Vite dev server responded 200 at `http://localhost:3000/`.  
3. **Run the Expo mobile app** — **COMPLETE** (Expo web 200 at `http://localhost:8081/`); **PARTIAL** if developers rely on `.env.local` without accounting for `scripts/set-local-ip.js` (Finding 3).  
4. **Create an inspection** — **COMPLETE.** `POST /api/inspections` and mobile/new-inspection flow align.  
5. **Step through rooms in a fast capture flow** — **PARTIAL.** Auto-save path is strong; room-level “Review flagged items” and hub secondary actions add non-capture exits (Findings 4, 11).  
6. **Move through items without unnecessary review friction** — **PARTIAL.** Fast path skips the sheet; fair-condition review noise persists (Finding 5).  
7. **Save fixed sections** — **COMPLETE.** PATCH sections + reload verified (Finding 12).  
8. **Review exceptions and items needing attention** — **PARTIAL.** Filters and bulk confirm exist; “fair” handling skews attention metrics (Finding 5).  
9. **Generate a report** — **PARTIAL.** Generation and file open work; **archive** is broken/hidden on mobile UI and missing on admin (Findings 6, 7).

---

PRIORITY ORDER  

**Fix first (High impact)**  
- Finding 5 — Correct exception/review semantics so “needs attention” reflects real blockers.  
- Finding 6 — Unhide mobile archive control so WB-107 archive path is usable.  

**Fix before demo (Medium impact)**  
- Finding 3 — Stop clobbering `EXPO_PUBLIC_API_BASE_URL` on every start (or document/guard).  
- Finding 4 — Demote “Review flagged items” during active capture.  
- Finding 7 — Add admin `archiveReport` + UI.  
- Finding 2 — Align documentation/checklists with actual REST paths.  
- Finding 9 — Stronger “next item” affordance after auto-save.  
- Finding 11 — Reduce competing capture vs review entry points.  

**Polish pass (Low impact)**  
- Finding 1 — Health route vs README.  
- Finding 8 — Admin vs mobile capture overlap (product positioning).  
- Finding 10 — Already PASS; no action.  
- Finding 12–13 — PASS; optional follow-ups only.  
- Finding 14 — Layout/spacing on sections and small screens.  
- Finding 15 — Template builder scope for demos.
