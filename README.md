# Investor Intel / Iran Conflict Monitor Dashboard

Product-grade OSINT and investor intelligence dashboard scaffold for monitoring regional conflict escalation, chokepoints, fires, air/maritime movement, and market-sensitive signals.

The canonical build brief lives in `AGENTS.md`.

## Workspace layout
- `apps/web`: Next.js dashboard UI
- `apps/api`: Fastify API, auth, analytics, OG generation
- `packages/core`: shared contracts, scoring, source registry
- `packages/db`: Drizzle/Postgres/PostGIS schema and repositories
- `packages/sources`: source adapter framework and integrations
- `workers`: cron/systemd-friendly ingest and maintenance jobs
- `docs`, `ops`: setup, source registry, deployment, timers, DB bootstrap

## Quick start
- Copy `.env.example` to `.env` and fill in the required values.
- Bootstrap PostgreSQL/PostGIS with `ops/db/bootstrap.sql`.
- Apply the current schema with `npm run db:push`.
- Start the API with `npm run dev:api`.
- Start the web app with `npm run dev:web`.
- Run workers with `npm run worker:fast`, `npm run worker:hourly`, `npm run worker:summary`, `npm run worker:health`, and `npm run worker:cleanup`.

See `docs/setup.md`, `docs/source-registry.md`, and `LOG.md` for the implementation status and operational details.
