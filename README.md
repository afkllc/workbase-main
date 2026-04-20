# Workbase

Workbase now has three top-level parts:

- `frontend/`: permanent agency admin web dashboard
- `mobile/`: Expo managed clerk capture app
- `backend/`: FastAPI API and report generator

## Current backend routes

- `GET /health`
- `GET /api/templates`
- `GET /api/templates/{template_key}`
- `GET /api/inspections`
- `POST /api/inspections`
- `GET /api/inspections/{inspection_id}`
- `PATCH /api/inspections/{inspection_id}/sections`
- `PATCH /api/inspections/{inspection_id}/rooms/{room_id}/items`
- `POST /api/inspections/{inspection_id}/rooms/{room_id}/analyse-photo`
- `POST /api/inspections/{inspection_id}/rooms/{room_id}/video-scan`
- `POST /api/inspections/{inspection_id}/generate`
- `GET /api/reports/{inspection_id}`
- `GET /api/uploads/{file_name}` (internal media helper for deployed AI image analysis)

Canonical contract notes:

- Checklist item updates are `PATCH /api/inspections/{inspection_id}/rooms/{room_id}/items` with `item_id` in the JSON body.
- Fixed sections are embedded in `GET /api/inspections/{inspection_id}` and saved via `PATCH /api/inspections/{inspection_id}/sections`.
- Report generation is `POST /api/inspections/{inspection_id}/generate`.
- Reports are fetched with the inspection id at `GET /api/reports/{inspection_id}`.

## Repo structure

- `frontend/` React + Vite admin dashboard for letting agents
- `mobile/` Expo Router mobile app for field capture
- `backend/` FastAPI API
- `templates/` inspection templates consumed by the backend
- `docs/` architecture and execution docs
- `.github/workflows/` CI

## Environment setup

### Frontend

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Mobile

For local Expo web development, create `mobile/.env.local`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

For Expo Go on a physical device, your phone must be able to reach the backend. Keep a second local-only file such as `mobile/.env.device`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000
```

`mobile/.env.device` is a handy saved alternate value for device testing, but Expo does not load that filename automatically. Before testing on a physical device, copy the LAN IP value into `mobile/.env.local` or export it in your shell for that session.

Important note about scripts:

- `npm run web` does **not** modify `mobile/.env.local` (ideal for Expo Web + `http://localhost:8000`).
- `npm start` runs `node scripts/set-local-ip.js` first, which auto-writes `EXPO_PUBLIC_API_BASE_URL=http://<your LAN IP>:8000` into `mobile/.env.local` (ideal for physical device testing).

ngrok alternative:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-subdomain.ngrok-free.app
```

Important:

- `http://localhost:8000` is the correct value for Expo web running in a browser on the same machine as the backend.
- `EXPO_PUBLIC_API_BASE_URL` must point to a FastAPI server your phone can actually reach when testing on a physical device.
- `http://localhost:8000` does not work on a physical phone.
- Physical iOS development for camera or microphone work should use HTTPS. Use ngrok during development for that case.

### Backend

`backend/.env` is local-only and should not be committed. Create it only when you want to override the default mock provider or enable Verba.

Mock mode:

```env
AI_PROVIDER=mock
```

Verba mode:

```env
AI_PROVIDER=verba
VERBA_API_KEY=vka_your_api_key
VERBA_CAPTURE_CHARACTER=your_capture_verb_slug
VERBA_REPORT_CHARACTER=your_report_verb_slug
PUBLIC_API_BASE_URL=https://your-railway-backend.up.railway.app
```

Notes:

- `PUBLIC_API_BASE_URL` is **not** for your frontend/mobile. It exists because Verba (a third-party service) needs a **publicly reachable** URL to call back into your backend (e.g. to fetch uploaded images).
- `PUBLIC_API_BASE_URL` must be a **publicly reachable HTTPS URL**. `http://localhost:8000` is not publicly reachable from Verba and will fail explicitly for photo analysis.
- If you are running the backend locally but still want Verba image analysis, expose your local FastAPI port with a tunnel and set `PUBLIC_API_BASE_URL` to that HTTPS URL (ngrok / cloudflared / similar).
- Report generation can still use Verba locally as long as `VERBA_API_KEY` and the character slugs are set.
- The existing `video-scan` route remains a placeholder MVP path and is not yet backed by Verba video analysis.

## Run locally

### 1. Backend

```powershell
cd ~/onedrive/Documents/workbase-main/backend
python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Quick troubleshooting for `NetworkError when attempting to fetch resource.` (Expo Web):

- Ensure the backend is up by opening `http://localhost:8000/health` in your browser.
- If you ran `npm start` in `mobile/` recently, it may have changed `mobile/.env.local` to a LAN IP. Either:
  - run `npm run web` (recommended for Expo Web), and keep `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`, or
  - keep the LAN IP, but make sure your backend is started with `--host 0.0.0.0` so it’s reachable at `http://<LAN IP>:8000`.

### 2. Frontend admin dashboard

```powershell
cd ~/onedrive/Documents/workbase-main/frontend
npm install
npm run dev
```

Vite may move off port `3000` if that port is already in use. Always use the `Local` URL printed in the terminal instead of assuming `http://localhost:3000`.

### 3. Expo mobile app

```powershell
cd ~/onedrive/Documents/workbase-main/mobile
npm install
npm start
```

## What each client currently supports

### Frontend admin dashboard

- list inspections
- create inspections
- inspection detail
- review room progress
- update fixed sections
- confirm items
- generate and open reports

### Mobile clerk app

- list inspections
- create inspections
- open room list
- upload a photo from the library and send it to `analyse-photo`
- run room scan via `video-scan`
- edit and save sections
- review and confirm items
- generate and open reports

### Explicitly blocked until backend routes exist

- auth and session restore
- property CRUD
- inspection metadata editing after create
- room add/remove
- live video upload
- meter OCR route
- notifications and delivery workflow
- team and role management

## Current implementation notes

- `frontend/` is a permanent agency admin dashboard, not a temporary client.
- `mobile/` is an Expo managed app using Expo Router and `expo-image-picker`.
- The backend uses SQLite persistence right now. A Postgres migration is planned post-demo and documented in `docs/workbase-ai-blueprint-v2.md`.
- Report generation currently produces HTML files in `backend/generated_reports/`.
- Docker is intentionally deferred until Postgres and storage are introduced.
