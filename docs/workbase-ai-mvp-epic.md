# Epic: Workbase AI MVP Build

**Epic ID:** WB-MVP-001  
**Status:** In progress  
**Owner:** Workbase  
**Stack:** React admin dashboard + Expo mobile app + FastAPI backend

## Epic Goal

Turn the existing prototype into a functioning multi-client app with a real backend and a clear upgrade path to the full product.

## Success Definition

The repo is successful at this stage when a developer can:

1. run the FastAPI backend
2. run the React admin dashboard
3. run the Expo mobile app
4. create an inspection
5. step through rooms
6. confirm items
7. save fixed sections
8. generate a report

## Scope In This Epic

### WB-101: Monorepo Restructure

**Done target**

- create `frontend/`, `backend/`, `templates/`, `docs/`
- move the existing React app into `frontend/`
- add FastAPI scaffold in `backend/`

**Acceptance criteria**

- repo structure matches the documented architecture
- frontend and backend can run independently

### WB-102: Template-Driven Backend Scaffold

**Done target**

- load templates from JSON
- create inspections from templates
- expose inspection and template endpoints
- keep persistence behind a service layer

**Acceptance criteria**

- `GET /api/templates` returns configured templates
- `POST /api/inspections` creates rooms and items from the selected template key
- `GET /api/inspections/{id}` returns the full nested inspection

### WB-103: Frontend Integration

**Done target**

- replace hardcoded frontend mock data with API calls
- position `frontend/` as permanent agency admin dashboard
- support inspection creation, review flow, and report access

**Acceptance criteria**

- the React app loads inspections from FastAPI
- creating an inspection updates the room list
- the room list reflects backend state

### WB-104: Expo Mobile Client

**Done target**

- add `mobile/` as Expo managed app
- scaffold only screens backed by existing FastAPI routes
- use Expo Router and image picker

**Acceptance criteria**

- the mobile app lists inspections from FastAPI
- the mobile app can create inspections
- the mobile app can upload a photo to the analyse-photo route
- the mobile app can review and confirm items

### WB-105: Capture Stubs With Real Contracts

**Done target**

- add photo-analysis endpoint contract
- add room-scan endpoint contract
- keep implementation mocked for now

**Acceptance criteria**

- uploading a photo returns a structured item suggestion
- running a room scan populates reviewable item descriptions
- the frontend can confirm suggestions returned by the API

### WB-106: Fixed Sections

**Done target**

- meter readings
- keys and fobs
- general observations

**Acceptance criteria**

- all three sections save through FastAPI
- saved data is visible again when the inspection reloads

### WB-107: Report Generation Stub

**Done target**

- generate a local report file from inspection state
- make it downloadable from the frontend

**Acceptance criteria**

- the review screen can trigger report generation
- the backend writes a report file
- the reports screen can open that file

## Explicitly Deferred

Not in this epic:

- production Postgres database
- auth
- object storage
- live model providers
- background jobs
- PDF generation
- native video upload

These are next epics, not hidden work inside this one.

## Next Epic After This

### WB-MVP-002: Persistence and Auth

- Postgres
- migrations
- JWT auth
- user-scoped inspections

### WB-MVP-003: Real Capture Services

- file upload storage
- real vision inference
- real room scan or video pipeline

### WB-MVP-004: Production Reports

- branded output
- PDF generation
- delivery workflow

## Engineering Rules For This Epic

- keep the frontend thin
- keep the frontend permanent as the admin dashboard
- keep the mobile app route-backed only
- keep templates on the backend
- keep AI behind the backend
- prefer replaceable interfaces over premature infrastructure
- do not scaffold screens against unbuilt backend routes

## Direct Call

The old plan was over-scoped for the repo we actually had.

This epic fixes that by making the current codebase real first, then layering production concerns in the right order.
