# Setup

## Prerequisites
- Ubuntu 24.04 LTS or similar Linux host
- Node.js 22+
- npm 10+
- PostgreSQL 16+
- PostGIS extension available

## Repository bootstrap
1. Copy `.env.example` to `.env`.
2. Fill in `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH`.
3. Add optional source API keys as they become available.

## Admin password hashing
Generate the Argon2 password hash used by the internal admin login:

```bash
npm run admin:hash-password -- 'replace-with-strong-password'
```

Put the resulting hash in `ADMIN_PASSWORD_HASH`.

## Database bootstrap
Create the database and enable the required extensions:

```bash
createdb investor_intel
psql "$DATABASE_URL" -f ops/db/bootstrap.sql
npm run db:push
```

Notes:
- `ops/db/bootstrap.sql` enables `postgis` and `pgcrypto`.
- `npm run db:push` is the current v1 schema bootstrap path.
- `npm run db:generate` is available once you want generated migration files.

## Local development
Start the API:

```bash
npm run dev:api
```

Start the Next.js app:

```bash
npm run dev:web
```

The expected local URLs are:
- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- API health: `http://localhost:4000/health`

## Worker jobs
Run the cron-friendly worker entrypoints manually:

```bash
npm run worker:fast
npm run worker:hourly
npm run worker:summary
npm run worker:health
npm run worker:cleanup
```

Current worker mapping:
- `worker:fast`: `gdelt`, `opensky`, `aisstream`, `alphavantage`
- `worker:hourly`: `reliefweb`, `firms`, `wikimedia`, `eia`, `fred`
- `worker:summary`: deterministic fallback brief generation
- `worker:health`: adapter health snapshot pass
- `worker:cleanup`: prune expired sessions and request analytics older than 30 days

## Production start commands
Build the Next.js app and typecheck the workspace:

```bash
npm run build
```

Run the API:

```bash
npm run start:api
```

Run the web app:

```bash
npm run start:web
```

Notes:
- The web app is production-built with `next build`.
- The API currently runs via `tsx` in production for v1 simplicity. This keeps the workspace wiring simple while the package graph is still TypeScript-first.
- The app is designed to degrade gracefully when the database or source credentials are missing.

## Current API surface
Public:
- `GET /health`
- `GET /api/dashboard/summary`
- `GET /api/events/map`
- `GET /api/timeline`
- `GET /api/markets/signals`
- `GET /api/sources/health`
- `GET /api/events/:id`
- `GET /api/clusters/:id`
- `GET /api/briefs`
- `GET /og/dashboard.png`
- `GET /og/events/:id.png`
- `GET /og/clusters/:id.png`

Admin:
- `GET /api/admin/auth/session`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/analytics/summary`

## Data model notes
The main Postgres/PostGIS tables are defined in `packages/db/src/schema.ts`:
- `source_item`
- `location`
- `event`
- `event_source_link`
- `event_cluster`
- `cluster_event_link`
- `market_snapshot`
- `indicator_snapshot`
- `asset_track`
- `hotspot_signal`
- `timeline_entry`
- `brief`
- `request_event`
- `ingest_run`
- `source_health_snapshot`
- `admin_user`
- `admin_session`

## Known v1 limitations
- Event clustering is still a scaffold layer; normalized event storage and dashboard summarization ship first.
- The brief worker is deterministic fallback text today; strict-schema AI enrichment is deferred.
- `db:push` is used for schema bootstrap before generated migration files are introduced.
