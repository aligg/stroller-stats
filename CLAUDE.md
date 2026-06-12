# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Stroller Stats (deployed at [strollerstats.com](https://strollerstats.com)) integrates with the
Strava API to track and display running/walking distance logged while pushing a stroller (or
wearing a baby carrier / "pack"). The frontend is Create React App; the backend is Google
Firebase Cloud Functions + Firestore.

## Commands

### Frontend (repo root)
- `npm start` — run the React app at http://localhost:3000
- `npm test` — run frontend tests (react-scripts/Jest, watch mode). Run a single file:
  `npm test -- src/__tests__/components/AnnualStats.test.js`
- `npm run build` — production build
- Note: the root `lint` script (`react-scripts run lint`) is broken — CRA has no `run`
  subcommand. There is no working frontend lint command.

### Backend (`functions/` directory — run all commands from there)
- `firebase emulators:start --only firestore` — start the Firestore emulator (port 8080),
  required before running backend tests
- `npm test` — runs `node --test test/index.test.js` against the emulator
  (`FIRESTORE_EMULATOR_HOST=localhost:8080`). The emulator must already be running.
- `npm run serve` — run the functions emulator locally
- `npm run lint` / `npm run lint:fix` — ESLint (Google config). Lint passes as a `predeploy`
  hook, so deploys fail on lint errors.
- `npm run deploy` — `firebase deploy --only functions`
- `npm run logs` — tail deployed function logs
- Backend uses Node 20.

## Architecture

### Three deployed functions (`functions/index.js`)
1. **`app`** (`onRequest`) — an Express app serving all REST endpoints under
   `https://us-central1-stroller-stats.cloudfunctions.net/app/...`. Endpoints include
   `/get-access-token`, `/create-user`, `/update-user`, `/user/:id`,
   `/user-activity-data/:id/:year`, `/monthly-activities/:id`, `/leaderboard`, `/hall-of-fame`,
   `/auth-user`.
2. **`stravaWebhookv2`** (`onRequest`) — Strava webhook receiver. GET handles subscription
   verification (`VERIFY_TOKEN = "STROLLER-STATS"`); POST processes new activity events via
   `handlePost`.
3. **`writeMonthlyData`** (`onSchedule`, hourly 7:00–20:00 America/Los_Angeles) — recomputes the
   current month's leaderboard totals for opted-in users (`functions/monthlyData.js`).

### Activity ingestion flow (the core of the backend)
Strava activity created → webhook POST → `handlePost`: fetch refresh token from `users`, exchange
for access token, fetch the full activity from Strava, then `formatActivity` classifies it:
- **Stroller** if title/description contains `#strollerstats` or `#strollermiles`.
- **Pack** if it contains `#packmiles` or `#packstats` (stroller always wins over pack).
- `#strollerstats(N)` / `#strollermiles(N)` lets users log a *partial* distance N (used when
  only part of the activity was with the stroller).

`addActivityToDB` only stores stroller activities of `sport_type` Run/TrailRun/Walk, and pack
activities of Walk/Hike. `updateDescription` then writes a running monthly total back to the
Strava activity description (e.g. `12.3 March stroller run miles | https://www.strollerstats.com`),
guarded by `isAlreadyProcessed` to avoid double-appending.

### Firestore collections
- `users` — keyed by Strava user id (string). Holds tokens, `first_name`, and the opt-in flags
  `opted_in_leaderboard` and `opted_in_kilometers`.
- `activities` — keyed by Strava `activity_id`. Each doc has `distance` (always stored in
  **meters**), `sport_type`, `start_date` (ISO string), `is_stroller`, `is_pack`, `user_id`.
- `leaderboard/{YYYY-M}/monthly-data/{user_id}` — per-user monthly run/walk totals, written by
  `writeMonthlyData`.

### Units convention
Distances are stored in meters and converted at read time via `getDistance(meters, isKilometers)`
/ `getMeters(...)`. Per-user units come from the `opted_in_kilometers` flag, surfaced everywhere
through `getIsKilometersUser`. When changing distance logic, preserve the meters-in-storage,
convert-on-read pattern.

### Frontend
React Router app (`src/App.js`) with routes: `/` (home), `/redirect/exchange_token` (Strava OAuth
callback), `/about`, `/settings`, `/hall-of-fame`. Auth state is just `localStorage.user_id` set
during the OAuth redirect (`src/routes/redirect.js`). Components fetch data directly from the
deployed Cloud Function URLs (hardcoded `https://us-central1-stroller-stats.cloudfunctions.net/app/...`)
rather than from a local backend — note this when developing against local emulators. Charts use
Plotly via `react-plotly.js`.

### Secrets
Env vars (`.env`, gitignored): `REACT_APP_CLIENT_ID`, `REACT_APP_CLIENT_SECRET`,
`REACT_APP_FIREBASE_KEY` for the frontend; functions read `STRAVA_CLIENT_ID`,
`STRAVA_CLIENT_SECRET`, `REACT_APP_FIREBASE_KEY` from the deployed environment.
