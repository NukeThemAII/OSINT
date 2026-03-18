# LOG.md

## Project status
- Status: Phase 1 foundation implemented and build-verified.
- Canonical brief: `AGENTS.md`.
- Verification status: `npm run build` passed on 2026-03-18.
- Current delivery level: workspace scaffold, shared schemas, DB schema/repository, source adapter framework, initial adapters, API routes, admin/auth foundation, OG card generation, worker jobs, frontend shell, and VPS/docs artifacts are in place.
- Still missing before a stronger v1: real event clustering persistence, link-table population, generated DB migrations, adapter fixtures/tests, and AI enrichment beyond deterministic fallback briefs.

## Current architecture snapshot
- `apps/web`
  - Next.js App Router frontend with pages for `/`, `/markets`, `/briefs`, `/events/[id]`, `/clusters/[id]`, `/admin`, and `/admin/login`.
  - Dark dashboard shell with KPI cards, map surface, timeline panel, latest events, market strip, and admin analytics shell.
  - Map foundation uses `maplibre-gl` plus `deck.gl` overlay scaffolding.
- `apps/api`
  - Fastify API with public dashboard/data routes, admin auth routes, request analytics middleware, and OG image endpoints.
  - Internal auth uses Argon2 password hashing plus signed HttpOnly cookies.
  - OG cards rendered with `satori` + `@resvg/resvg-js` and cached on disk.
- `packages/core`
  - Shared Zod schemas and TypeScript domain contracts for events, clusters, source items, tracks, markets, briefs, analytics, and API envelopes.
  - Source registry, AOIs/strategic map references, deterministic scoring, stable hashing, and deterministic fallback brief generation.
  - Browser-safe root exports; Node-only hashing exported from `@investor-intel/core/hashing`.
- `packages/db`
  - Drizzle schema for Postgres/PostGIS tables covering source ingest, normalized entities, tracks/hotspots, timelines, briefs, analytics, and admin sessions.
  - Repository layer exposes dashboard queries, detail queries, ingest bookkeeping, source health writes, auth/session helpers, and fallback brief persistence.
  - Database is optional at runtime; the app degrades to empty-state responses when `DATABASE_URL` is absent.
- `packages/sources`
  - Adapter framework with fetch/normalize/health boundaries.
  - Initial adapters: `gdelt`, `reliefweb`, `firms`, `opensky`, `aisstream`, `wikimedia`, `eia`, `fred`, `alphavantage`.
  - Per-source env/config parsing, timeout/retry helpers, CSV parsing, heuristic tagging, and provenance-ready normalized output.
- `workers`
  - Cron/systemd-friendly entrypoints for fast refresh, hourly ingest, fallback brief generation, health checks, and cleanup.
  - Worker runs create `ingest_run` records and persist source health snapshots.
- `docs` / `ops`
  - `.env.example`, setup guide, source registry doc, DB bootstrap SQL, cron file, systemd units/timers, Nginx sample config, and Ubuntu VPS deployment notes.

## Completed work
- Created the npm workspace monorepo structure for web, API, shared packages, and workers.
- Added strict TypeScript workspace configuration, shared package manifests, Tailwind/Next scaffolding, and root scripts.
- Implemented shared schemas/types for:
  - sources and provenance
  - raw ingested items
  - normalized events
  - clusters and timeline entries
  - geospatial features and AOIs
  - hotspot, aircraft, vessel, market, and indicator records
  - severity / escalation / market relevance summaries
  - ingest runs and admin analytics
- Implemented Postgres/PostGIS-ready schema and repository foundation.
- Implemented deterministic scoring and fallback brief generation.
- Implemented source adapter scaffolding and initial real adapters for the priority free/open sources.
- Implemented cron/systemd-friendly worker entrypoints.
- Implemented API routes for dashboard summary, map events, timeline, market signals, source health, briefs, event detail, cluster detail, admin auth, and admin analytics.
- Implemented admin auth foundation with secure password hashing, signed cookies, and protected admin analytics route.
- Implemented OG image generation for dashboard, event, and cluster pages.
- Implemented a product-grade dark frontend shell with map/timeline/panels and admin surface.
- Added environment, deployment, and operations documentation.
- Verified the current workspace with `npm run build`.

## Decisions / tradeoffs
- Used npm workspaces instead of pnpm because `pnpm` was not available in the environment.
- Kept workers in a single `workers` workspace with multiple entrypoints to ship faster in v1.
- Preferred database-optional behavior so the UI/API can boot with empty states before live ingest is configured.
- Disabled `exactOptionalPropertyTypes` in `tsconfig.base.json` to reduce friction across Drizzle/Fastify/Zod boundaries during initial scaffold work.
- Kept the root `@investor-intel/core` export browser-safe and moved hashing to `@investor-intel/core/hashing` after Next.js build failed on a `node:crypto` import leaking into the client bundle.
- Using `db:push` as the current schema bootstrap path; generated migration files are still pending.
- The API currently runs via `tsx` in production for v1 simplicity because the workspace is source-first TypeScript across packages.
- The brief generator currently ships as deterministic fallback text. AI enrichment is intentionally deferred until the deterministic ingest path is stable.
- Event clustering tables exist, but the actual cluster generation/write path is not implemented yet; the dashboard currently derives value mainly from normalized events, timeline, markets, and source health.

## Open issues / risks
- `event_cluster`, `cluster_event_link`, and `event_source_link` are not populated yet; clustering remains the biggest product gap in the data layer.
- No generated migration files exist yet; database bootstrap depends on `npm run db:push`.
- Many source adapters require optional credentials and will report `disabled` until configured.
- Free air/maritime feeds will have coverage and rate-limit gaps compared with commercial products.
- Test coverage is not in place yet for scoring, normalization, adapter contracts, or route smoke tests.
- Admin sessions can fall back to in-memory storage when the DB is not configured; that is acceptable for local dev, not for production.
- No AI/schema-constrained summary integration exists yet beyond deterministic fallback briefs.

## Next tasks
- Implement actual event clustering and write `event_cluster`, `cluster_event_link`, and `event_source_link` records.
- Add generated Drizzle migrations and a repeatable DB bootstrap path beyond `db:push`.
- Add unit tests for scoring and normalization plus contract tests for adapters.
- Expand map layers to expose aircraft, vessel, and hotspot toggles from persisted track/signal data.
- Add richer dashboard filters and timeline-aware state changes.
- Add schema-constrained AI brief enrichment behind deterministic fallback behavior.

## Resume instructions for next agent session
- Read `AGENTS.md` first, then this file.
- Copy `.env.example` to `.env`, configure required values, and run `psql "$DATABASE_URL" -f ops/db/bootstrap.sql` followed by `npm run db:push` if you need a working DB.
- Run `npm install`, `npm run build`, `npm run dev:api`, and `npm run dev:web` to restore the local dev state.
- Use `npm run worker:fast`, `npm run worker:hourly`, `npm run worker:summary`, `npm run worker:health`, and `npm run worker:cleanup` to exercise the worker paths.
- If you touch browser-facing imports, keep the `@investor-intel/core` root export browser-safe; Node-only helpers such as hashing must stay on subpaths.
- Prioritize cluster persistence and test coverage next.

## Session entries

### 2026-03-17 — Session start
- Summary of work done:
  - Read and adopted `AGENTS.md` as the canonical build brief.
  - Inspected repository contents and local Node tooling.
  - Created `LOG.md` baseline for ongoing agent handoff.
- Files created/updated:
  - `LOG.md`
- Commands run:
  - `pwd`
  - `ls -la`
  - `git status --short --branch`
  - `rg --files -g 'AGENTS.md' -g 'package.json' -g 'pnpm-workspace.yaml' -g 'turbo.json' -g 'tsconfig*.json' -g '.env.example' -g 'LOG.md'`
  - `node -v && npm -v && (pnpm -v || true) && (bun -v || true)`
- Migrations/schema changes:
  - None.
- APIs/adapters added:
  - None.
- Next recommended step:
  - Create the workspace/package structure and install the core dependency set.

### 2026-03-17 — Workspace bootstrap
- Summary of work done:
  - Created the root monorepo/workspace structure and package manifests for `apps`, `packages`, and `workers`.
  - Added shared TypeScript configuration, root repo metadata, and base directories for docs/ops/data.
  - Installed the initial dependency set with npm.
- Files created/updated:
  - `.gitignore`
  - `package.json`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `README.md`
  - `apps/web/package.json`
  - `apps/web/tsconfig.json`
  - `apps/web/next-env.d.ts`
  - `apps/api/package.json`
  - `apps/api/tsconfig.json`
  - `packages/core/package.json`
  - `packages/core/tsconfig.json`
  - `packages/db/package.json`
  - `packages/db/tsconfig.json`
  - `packages/sources/package.json`
  - `packages/sources/tsconfig.json`
  - `workers/package.json`
  - `workers/tsconfig.json`
  - `package-lock.json`
- Commands run:
  - `python3` workspace scaffold writer
  - `npm install`
- Migrations/schema changes:
  - None.
- APIs/adapters added:
  - None.
- Next recommended step:
  - Implement shared domain contracts, the DB schema, and the source adapter foundation.

### 2026-03-18 — Foundation implementation pass
- Summary of work done:
  - Implemented the shared domain model, Zod contracts, scoring helpers, AOI/strategic map references, fallback brief generation, and source registry.
  - Implemented the Drizzle/PostGIS schema plus repository methods for dashboard queries, ingest runs, normalized record persistence, market/indicator/track/hotspot storage, admin analytics, and auth/session persistence.
  - Implemented the source adapter framework and real adapters for `gdelt`, `reliefweb`, `firms`, `opensky`, `aisstream`, `wikimedia`, `eia`, `fred`, and `alphavantage`.
  - Implemented worker entrypoints for fast refresh, hourly ingest, brief generation, cleanup, and health checks.
  - Implemented the Fastify API, admin auth service, OG card rendering, and request analytics middleware.
  - Implemented the Next.js dashboard/admin shell and detail pages.
- Files created/updated:
  - `packages/core/src/**`
  - `packages/db/drizzle.config.ts`
  - `packages/db/src/**`
  - `packages/sources/src/**`
  - `apps/api/src/**`
  - `apps/web/src/**`
  - `apps/web/next.config.mjs`
  - `apps/web/postcss.config.js`
  - `apps/web/tailwind.config.ts`
  - `workers/src/**`
  - `package-lock.json`
- Commands run:
  - `npm install -D @types/ws`
  - `npm run typecheck`
- Migrations/schema changes:
  - Added schema definitions for `ingest_run`, `source_item`, `location`, `event`, `event_source_link`, `event_cluster`, `cluster_event_link`, `market_snapshot`, `indicator_snapshot`, `asset_track`, `hotspot_signal`, `timeline_entry`, `brief`, `request_event`, `source_health_snapshot`, `admin_user`, and `admin_session`.
- APIs/adapters added:
  - Public API routes for dashboard summary, map events, timeline, market signals, source health, briefs, event detail, cluster detail, and OG cards.
  - Admin API routes for session lookup, login, logout, and analytics summary.
  - Adapters for `gdelt`, `reliefweb`, `firms`, `opensky`, `aisstream`, `wikimedia`, `eia`, `fred`, `alphavantage`.
- Next recommended step:
  - Implement cluster persistence and link-table writes so the cluster pages are backed by live data rather than schema-only scaffolding.

### 2026-03-18 — Build hardening, env, and ops pass
- Summary of work done:
  - Fixed the Next.js production build by preventing the root core barrel from exporting `node:crypto`-backed hashing helpers into browser bundles.
  - Added root scripts for production starts and DB push.
  - Added `.env.example`, setup/source-registry documentation, DB bootstrap SQL, cron/systemd examples, Nginx sample config, and Ubuntu VPS deployment notes.
  - Re-ran production build verification for the full workspace.
- Files created/updated:
  - `packages/core/package.json`
  - `packages/core/src/index.ts`
  - `packages/db/package.json`
  - `packages/db/src/repositories/app-repository.ts`
  - `packages/sources/src/adapters/*.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/services/auth-service.ts`
  - `.env.example`
  - `.gitignore`
  - `README.md`
  - `docs/setup.md`
  - `docs/source-registry.md`
  - `ops/db/bootstrap.sql`
  - `ops/cron/investor-intel.cron`
  - `ops/systemd/*.service`
  - `ops/systemd/*.timer`
  - `ops/nginx/investor-intel.conf`
  - `ops/deploy/ubuntu-vps.md`
  - `package.json`
  - `LOG.md`
- Commands run:
  - `npm run typecheck`
  - `npm run build`
- Migrations/schema changes:
  - No schema shape changes; added DB bootstrap SQL and `db:push` workflow.
- APIs/adapters added:
  - No new endpoints; import boundaries were hardened so the web build succeeds.
- Next recommended step:
  - Add real clustering and migration generation, then start writing tests around the adapter/repository boundaries.
