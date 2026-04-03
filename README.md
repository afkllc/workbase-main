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

For Expo Go on a physical device, keep a second local-only file such as `mobile/.env.device`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000
```

`mobile/.env.device` is a handy saved alternate value for device testing, but Expo does not load that filename automatically. Before testing on a physical device, copy the LAN IP value into `mobile/.env.local` or export it in your shell for that session.

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

The current FastAPI scaffold does not require runtime secrets for local development. Future env vars will live under `backend/`.

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

### 2. Frontend admin dashboard

```powershell
cd ~/onedrive/Documents/workbase-main/frontend
npm install
npm run dev
```

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
