FINDING 1 — Mobile report archive API points to a backend route that does not exist  
Area: 1  
File(s): [api.ts:167](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/src/lib/api.ts#L167), [reports.py:10](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/api/routes/reports.py#L10)  
Problem: The mobile client calls `PATCH /api/reports/{inspection_id}/archive`, but the backend only defines `GET /api/reports/{inspection_id}`. Any executed archive request will 404.  
Severity: Runtime failure  
Fix: Either add a matching `PATCH /api/reports/{inspection_id}/archive` backend route and persistence for archived state, or remove `archiveReport()` and the archive flow from mobile until the backend contract exists.

FINDING 2 — `AI_PROVIDER=groq` is advertised as configurable, but enabling it makes analyse/generate routes throw  
Area: 5  
File(s): [backend/.env.example:1](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/.env.example#L1), [backend/.env.example:2](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/.env.example#L2), [dependencies.py:15](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/dependencies.py#L15), [groq_provider.py:21](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/services/ai/groq_provider.py#L21), [groq_provider.py:41](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/services/ai/groq_provider.py#L41), [groq_provider.py:43](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/services/ai/groq_provider.py#L43), [inspections.py:63](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/api/routes/inspections.py#L63), [inspections.py:84](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/api/routes/inspections.py#L84)  
Problem: The example env file and provider-selection logic imply Groq is supported, but `GroqProvider` still raises `NotImplementedError` for transcription, image description, and report generation. If `AI_PROVIDER=groq` is set, `/api/inspections/{id}/rooms/{roomId}/analyse-photo` and `/api/inspections/{id}/generate` will fail at runtime.  
Severity: Runtime failure  
Fix: Implement the Groq provider fully and read `GROQ_API_KEY` for real, or block `AI_PROVIDER=groq` in configuration and remove the misleading example variable until the provider is functional.

FINDING 3 — Mobile reports screen reads archive fields that the backend never returns  
Area: 2  
File(s): [ReportsScreen.tsx:30](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/src/screens/ReportsScreen.tsx#L30), [types.ts:113](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/src/lib/types.ts#L113), [domain.py:126](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/schemas/domain.py#L126)  
Problem: The mobile reports list filters on `item.is_archived` and `item.archived_at`, and the mobile `InspectionSummary` type includes those fields, but the backend `InspectionSummary` model only returns `id`, address/postcode/property metadata, counts, status, and `report_url`. The archive filter therefore runs against fields that are always `undefined`, so archive state can never round-trip from the server.  
Severity: Silent bug  
Fix: Add `is_archived` and `archived_at` to the backend `InspectionSummary` and persist them, or remove those fields from the mobile type and reports filter until archive support is real.

FINDING 4 — Frontend web app omits `sections_completed` and can generate reports before fixed sections are saved  
Area: 4  
File(s): [frontend/types.ts:71](/C:/Users/saqla/OneDrive/Documents/workbase-main/frontend/src/types.ts#L71), [domain.py:103](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/schemas/domain.py#L103), [App.tsx:65](/C:/Users/saqla/OneDrive/Documents/workbase-main/frontend/src/App.tsx#L65), [ReviewScreen.tsx:209](/C:/Users/saqla/OneDrive/Documents/workbase-main/frontend/src/screens/ReviewScreen.tsx#L209)  
Problem: The backend `InspectionRecord` includes `sections_completed`, but the frontend `InspectionRecord` type does not. The web app computes readiness solely from confirmed item counts and enables `Generate report` when `allItemsConfirmed` is true, so the frontend can move to report generation without the fixed sections step that the mobile app now requires.  
Severity: Silent bug  
Fix: Add `sections_completed: boolean` to the frontend `InspectionRecord` type and gate the review/report flow on `allItemsConfirmed && inspection.sections_completed` to match the backend/mobile contract. Ideally also enforce this server-side in the generate route.

FINDING 5 — Frontend `ItemRecord` is missing the backend’s `photo_required` field  
Area: 4  
File(s): [frontend/types.ts:28](/C:/Users/saqla/OneDrive/Documents/workbase-main/frontend/src/types.ts#L28), [domain.py:49](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/schemas/domain.py#L49)  
Problem: The backend item model includes `photo_required`, but the frontend item type does not. That leaves the web client’s item model out of sync with the backend/mobile contract and blocks any UI logic that needs to distinguish “photo required” from optional capture.  
Severity: Type error  
Fix: Add `photo_required: boolean` to the frontend `ItemRecord` type and keep the field in sync anywhere inspection items are rendered or edited.

FINDING 6 — Two backend routes are defined but have no callers anywhere in either client  
Area: 1  
File(s): [health.py:7](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/api/routes/health.py#L7), [templates.py:35](/C:/Users/saqla/OneDrive/Documents/workbase-main/backend/app/api/routes/templates.py#L35)  
Problem: `GET /health` and `DELETE /api/templates/{template_key}` are defined on the backend, but there are no matching calls in `mobile/app`, `mobile/src`, or `frontend/src`. They are server-side surface area with no in-repo consumer.  
Severity: Dead code  
Fix: Either wire these routes into a real client flow/tests, or remove them until they are needed.

FINDING 7 — Expo Router includes orphan screens that are not reachable from any navigation flow  
Area: 3  
File(s): [video-scan.tsx:12](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/app/inspection/[inspectionId]/room/[roomId]/video-scan.tsx#L12), [flags.ts:2](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/src/features/flags.ts#L2), [template-builder.tsx:1](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/app/template-builder.tsx#L1), [AppStackScreen.tsx:81](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/src/navigation/AppStackScreen.tsx#L81), [AppStackScreen.tsx:93](/C:/Users/saqla/OneDrive/Documents/workbase-main/mobile/src/navigation/AppStackScreen.tsx#L93)  
Problem: The mobile app ships route files for `/inspection/[inspectionId]/room/[roomId]/video-scan` and `/template-builder`, but there are no `router.push`, `router.replace`, `router.navigate`, or `<Link href>` call sites targeting either path. The video-scan screen is additionally hard-disabled by `featureFlags.videoScan = false` and immediately redirects away when opened.  
Severity: Dead code  
Fix: Add real navigation entry points to these routes if they are meant to ship, or delete the route files and related header-label cases until the features are actually exposed.
