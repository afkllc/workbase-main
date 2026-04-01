# Workbase AI Blueprint v2

**Date:** 28 March 2026  
**Status:** Active  
**Stack decision:** React admin dashboard + Expo mobile app + Python/FastAPI backend

## 1. Reality Check

The repo did not contain a mobile app, a backend, storage, auth, or report generation. It contained a single mocked frontend prototype.

That matters because the old plan assumed we had already committed to:

- React Native / Expo
- FastAPI
- Postgres
- object storage
- background jobs
- PDF generation
- live AI services

That was too much architecture for the actual codebase.

## 2. Revised Product Direction

We are still building the same product:

- property inventory inspections
- template-driven room checklists
- AI-assisted capture
- report generation

But we are building it in the correct order.

The product should now evolve in four layers:

1. Permanent React admin dashboard for letting agents.
2. Expo mobile app for clerks in the field.
3. FastAPI service that owns templates, inspections, rooms, items, and report generation.
4. Real persistence, auth, uploads, and AI integration.

## 3. Current Architecture

```text
workbase/
├─ frontend/     React + Vite admin dashboard
├─ mobile/       Expo managed clerk app
├─ backend/      FastAPI
├─ templates/    JSON room and item schemas
└─ docs/         Product and delivery docs
```

### Frontend

The frontend is the permanent agency admin dashboard.

Responsibilities:

- create inspections
- view inspection progress
- review generated content
- save fixed sections where needed
- trigger report generation
- open reports

Important rule:

- the frontend should not own business rules that belong to inspections, rooms, or reports

### Mobile

The mobile app is the clerk capture interface.

Responsibilities:

- list inspections
- open room lists
- upload inspection photos
- trigger room scans using the current backend route
- save fixed sections
- review and confirm item suggestions
- generate and open reports

### Backend

The backend is the system of record.

Responsibilities:

- load templates
- create inspections from templates
- manage room and item state
- accept section updates
- provide AI-analysis endpoints
- generate reports

Current implementation:

- SQLite-backed store behind a service layer
- built-in templates loaded from JSON files
- custom templates stored in SQLite and merged with built-ins

Future implementation:

- swap the store for Postgres repositories without changing frontend contracts

### Templates

Templates are first-class product assets, not static UI content.

Responsibilities:

- define required rooms
- define per-room items
- define AI hints
- define fixed sections like meters, keys, and general observations

The backend expands templates into real inspections. The frontend only renders what the backend sends.

## 4. Data Flow

The core data flow is:

1. User selects a template.
2. Backend resolves the matching template key.
3. Backend creates inspection, rooms, and items.
4. Frontend displays those rooms and items.
5. Capture actions send updates back to FastAPI.
6. Review confirms items.
7. Report generation reads inspection state and outputs a document.

This is the correct long-term flow even when storage and AI become more advanced.

## 5. AI Strategy

Do not wire the UI directly to a model provider.

All AI work must stay behind backend service boundaries.

Current state:

- provider-backed mocked AI service selected by backend config

Future state:

- real vision model for photo analysis
- real transcription + structuring pipeline for room scan/video mode
- optional note enhancement for manual edits

The important part is the contract, not the temporary implementation.

## 6. Report Strategy

Current state:

- backend generates an HTML report for local validation

Why this is correct:

- it proves end-to-end flow now
- it keeps the report step testable
- it avoids introducing docx/pdf complexity before the data model is stable

Future state:

- Word or HTML template rendering
- PDF export
- proper branding and formatting

## 7. What We Are Not Doing Yet

Not now:

- offline sync
- multi-tenancy
- agency admin tooling
- background queues
- production auth
- production storage
- live video upload pipeline

These are real later phases, not MVP day-one requirements.

## 8. Current MVP Slice

The repo should support this local flow across web and mobile:

1. Create an inspection from a template.
2. Open rooms and inspect items from either client.
3. Simulate photo analysis or room scan.
4. Save meter, key, and general sections.
5. Review and confirm items.
6. Generate a local report.

If that flow breaks, the app is not yet a functioning MVP.

## 9. Next Build Order

### Phase 1: Complete the local vertical slice

- keep the React and FastAPI contract stable
- remove remaining mock-only frontend assumptions
- keep built-in templates in JSON and custom templates in SQLite

### Phase 2: Real persistence and auth

- Postgres
- SQLAlchemy or SQLModel
- Alembic
- basic JWT auth

### Phase 3: Real capture and AI

- file upload storage
- photo analysis provider
- real room-scan or video processing endpoint

### Phase 4: Production-grade reports

- HTML to PDF or docx to PDF pipeline
- branded layout
- delivery and download handling

## 10. Hard Rules

- Do not let the frontend own template logic that belongs on the backend.
- Do not let the mobile app invent routes that the backend does not expose.
- Do not couple the UI to a specific AI provider.
- Do not introduce Postgres-specific assumptions into the frontend contract.
- Keep built-in templates versioned as files and custom templates editable in SQLite.

## 11. Decision Summary

Clear version:

- Frontend: React admin dashboard in `frontend/`
- Mobile: Expo managed app in `mobile/`
- Backend: FastAPI in `backend/`
- Templates: JSON in `templates/`
- Current persistence: SQLite
- Current AI: provider-backed mock selected through backend config
- Current report output: HTML
- Future persistence: Postgres
- Future AI: provider-backed
- Future reports: branded PDF

That is the architecture the repo should follow from here.
