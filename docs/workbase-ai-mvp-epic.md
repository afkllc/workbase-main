# Epic: Workbase AI MVP Build

**Epic ID:** WB-MVP-001
**Status:** In progress
**Owner:** Workbase
**Stack:** React admin dashboard + Expo mobile app + FastAPI backend

## Epic Goal

Turn the existing prototype into a functioning multi-client app with a real backend, a believable mobile inspection loop, and a clear upgrade path to the full product.

Core product principle: during inspection, the app should feel like a field tool. Reporting should feel secondary until the end.

## Success Definition

The repo is successful at this stage when a developer can:

1. run the FastAPI backend
2. run the React admin dashboard
3. run the Expo mobile app
4. create an inspection
5. step through rooms in a fast capture flow
6. move through items without unnecessary review friction
7. save fixed sections
8. review exceptions and flagged items
9. generate a report

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
- make room capture feel like a field workflow rather than a form workflow

**Acceptance criteria**

- the mobile app lists inspections from FastAPI
- the mobile app can create inspections
- the mobile app can move through room items in a fast evidence-first capture flow
- the mobile app can review and confirm items when needed
- completing an item or room presents a clear next action

### WB-105: Capture Stubs With Real Contracts

**Done target**

- add photo-analysis endpoint contract
- add room-scan endpoint contract
- keep implementation mocked for now
- preserve the fast-path mobile capture loop even while services are mocked

**Acceptance criteria**

- uploading a photo returns a structured item suggestion
- running a room scan populates reviewable item descriptions
- straightforward capture can move forward quickly while manual review is reserved for exceptions
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
- keep reporting as an end-stage workflow rather than the dominant frame of mobile inspection flow

**Acceptance criteria**

- the review screen can trigger report generation
- the backend writes a report file
- the reports screen can open that file
- report generation happens after inspection capture and review, not as a competing primary action during field work

### WB-108: Rapid Capture and Progression UX

**Done target**

- reduce capture friction across the room and item flow
- auto-advance users from a completed item to the next relevant step where appropriate
- provide explicit next-room or next-stage calls to action after room completion
- shift review toward exception handling instead of repeated manual confirmation on every straightforward item

**Acceptance criteria**

- straightforward items can be completed with fewer interruptions than a review-every-item flow
- room capture surfaces a strong next action after each completion
- room completion surfaces a strong next-room or next-stage action
- the mobile capture loop feels more like a field tool than a report builder

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
- optimise the mobile inspection loop for speed, evidence capture, and progress
- keep reporting secondary until the inspection phase is complete

## Direct Call

The old plan was over-scoped for the repo we actually had.

This epic fixes that by making the current codebase real first, then shaping the mobile experience around a credible field workflow. The MVP should feel like an inspection tool during capture, with reporting positioned as the end-stage outcome rather than the constant frame of the product.
