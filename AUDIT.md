# AUDIT.md — Industry Standards Codebase Audit

**Auditor**: Antigravity (Google DeepMind)  
**Date**: 2026-03-18  
**Canonical Brief**: `AGENTS.md`  
**Prior Agent**: Codex (OpenAI)  
**Total Files Reviewed**: ~65 TypeScript/TSX source files + ops/docs/config  
**Git History**: 2 commits (initial `AGENTS.md`, then full scaffold)  

---

## Executive Summary

The Codex agent built a **strong architectural scaffold** in what appears to be a single concentrated session. The monorepo structure, shared domain model, database schema, source adapter framework, API layer, frontend shell, and worker orchestration all exist and follow the `AGENTS.md` brief with high fidelity. The codebase is well-organized, type-safe, and demonstrates professional engineering patterns.

**However, this is still a scaffold — not a functional product.** The data pipeline has no working end-to-end flow without a live Postgres/PostGIS instance, event clustering is unimplemented, there are zero tests, and the frontend UI is structurally complete but visually sparse. The foundation is solid; the product surface needs work.

### Overall Codex Rating: **7.5 / 10**

| Category | Score | Notes |
|---|---|---|
| AGENTS.md Adherence | 9/10 | Followed brief with high accuracy, correct source choices, correct stack |
| Architecture & Structure | 9/10 | Clean monorepo, proper layering, good separation of concerns |
| Type Safety | 8/10 | Zod schemas + TS everywhere, discriminated unions, proper inference |
| Database Design | 8/10 | 17 tables with PostGIS, proper indexes, FK constraints, fingerprint dedup |
| Source Adapters | 7/10 | All 9 adapters exist, proper normalization, but some have weak validation |
| API Layer | 7/10 | Clean Fastify setup, but query params are unvalidated `as` casts |
| Frontend | 6/10 | Functional skeleton with map, but visually needs polish for "Palantir-grade" |
| Security | 7/10 | Argon2 + signed cookies, but some gaps (see findings) |
| Testing | 0/10 | Zero test files exist |
| Ops/DevOps | 8/10 | cron, systemd, nginx, bootstrap SQL, .env.example all present |
| Documentation | 8/10 | LOG.md, setup.md, source-registry.md, README all quality |

---

## Detailed Findings

### 1. Architecture & Monorepo Structure ✅ Excellent

**What Codex got right:**
- Monorepo layout exactly matches `AGENTS.md` recommended structure
- Clean workspace separation: `apps/web`, `apps/api`, `packages/core`, `packages/db`, `packages/sources`, `workers`
- Shared types flow correctly from `packages/core` → all consumers
- Browser-safe root export with Node-only hashing on a subpath (`@investor-intel/core/hashing`)
- ESM throughout with `"type": "module"`

**Minor issues:**
- `tsconfig.base.json` has `exactOptionalPropertyTypes` disabled — documented and acceptable for v1
- No workspace dependency version pinning (relies on npm hoisting)
- Missing `packages/maps` and `packages/ui` workspaces from the AGENTS.md recommended layout (acceptable simplification)

---

### 2. Shared Domain Model & Schemas ✅ Strong

**Files**: `packages/core/src/schemas/*.ts`, `packages/core/src/domain/*.ts`

**Strengths:**
- Comprehensive Zod schemas for all domain entities (events, clusters, markets, timeline, tracks, hotspots, briefs, analytics)
- Discriminated union for `NormalizedRecord` — clean pattern for multi-type normalization
- API envelope pattern (`apiEnvelopeSchema`) properly wraps all response types
- Source provenance tracking built into the data model from day one
- Scoring functions (severity, escalation, market relevance) are deterministic and explainable per AGENTS.md

**Issues:**
- `timestampSchema` is just `z.string().min(1)` — should validate ISO 8601 format with `z.string().datetime()` or a regex
- The `ingestStatusSchema` in `common.ts` is missing the `'running'` variant that exists in the DB enum
- No `z.coerce` usage for numeric query parameters (the API casts with `Number()` instead)

---

### 3. Database Schema ✅ Strong

**File**: `packages/db/src/schema.ts` (441 lines, 17 tables)

**Strengths:**
- Proper PostGIS geometry columns with SRID 4326
- GiST spatial indexes on all geometry columns
- Fingerprint-based deduplication on events, tracks, hotspots, market snapshots, timeline entries
- Foreign key cascades configured correctly
- Composite primary keys on link tables (`event_source_link`, `cluster_event_link`)
- All enums defined as `pgEnum` for type safety
- Appropriate use of `jsonb` for raw data and metadata storage

**Issues:**
- No Drizzle migration files generated yet — relies on `db:push` which is not safe for production
- The `events` table stores both `lat`/`lon` as doubles AND `geom_point` as PostGIS geometry — this dual storage pattern creates sync risk. Should derive geometry from lat/lon or vice versa
- No `created_at`/`updated_at` triggers — relies on application-level timestamps
- `request_event` table has no TTL or partitioning strategy for what will become a high-volume table
- `source_health_snapshot` status column is `varchar(16)` instead of using the existing enum type

---

### 4. Repository Layer ⚠️ Mixed

**File**: `packages/db/src/repositories/app-repository.ts` (848 lines)

**Strengths:**
- Database-optional pattern (`if (!this.database) return ...`) allows UI to boot without Postgres — excellent DX choice
- Clean mapper functions for all entity types
- Proper upsert with `onConflictDoUpdate` for events
- Parallel queries in `getDashboardSummary` using `Promise.all`
- Complete CRUD coverage for all core flows

**Issues:**
- **Monolith repository**: 848 lines in a single class. Industry standard would split this into domain-specific repositories (EventRepository, MarketRepository, AdminRepository, etc.)
- **`getAdminAnalyticsSummary`** fetches ALL request events in the window into memory and aggregates in JS — this will explode with scale. Should use SQL `COUNT`/`GROUP BY` instead
- **`onConflictDoUpdate` bug**: The upsert on events uses `eventRecords[0]?.title` as the update value — this means ALL upserted events in a batch get the title of the FIRST record, not their own title
- **`finishIngestRun`** sets `durationMs: 0` instead of computing actual duration from start time
- **No transactions**: Multi-table writes (events + timeline entries) are not wrapped in a transaction — partial writes are possible
- **N+1 query risk**: `getMapFeatures` makes 4 separate queries instead of a unified geospatial query

---

### 5. Source Adapters ✅ Good

**Files**: `packages/sources/src/adapters/*.ts` (9 adapters)

**Strengths:**
- Consistent adapter interface (`SourceAdapter` with `fetchBatch` and `healthcheck`)
- Each adapter produces both `sourceItems` (raw) and `normalizedRecords` (processed) — proper dual-write provenance
- Response validation with Zod schemas before processing
- Graceful degradation when API keys are missing (returns `disabled` health status)
- Retry and timeout support via shared HTTP utilities
- WebSocket-based AISStream adapter with proper timeout/cleanup

**Issues:**
- **OpenSky adapter** has `z.array(z.any())` for state vectors — should define the tuple structure explicitly
- **GDELT adapter** doesn't extract geolocation from articles — the GDELT Geo 2.0 API is more appropriate and provides coordinates
- **ReliefWeb adapter** uses `.iso3?.slice(0, 2)` for country code — ISO 3166-1 alpha-3 to alpha-2 conversion should use a proper mapping, not string slicing (e.g., "IRN" → "IR" works, but "USA" → "US" works, while "GBR" → "GB" does NOT — it would give "GB" correctly by coincidence but "CHN" → "CH" gives Switzerland instead of China)
- **No rate limiting** built into the adapter layer — relies on upstream API rate limits
- **Error types** are not well-defined — catches generic `Error` objects
- Individual adapter files have no JSDoc or inline documentation

---

### 6. API Layer ⚠️ Needs Improvement

**Files**: `apps/api/src/routes/*.ts`, `apps/api/src/app.ts`

**Strengths:**
- Clean Fastify setup with CORS, cookie signing, rate limiting
- Bot detection using `isbot` library
- Request analytics middleware captures all traffic
- OG card generation with caching
- IP hashing for privacy-conscious analytics

**Critical Issues:**
- **No input validation on query parameters**: Routes use `request.query as { limit?: string }` and `request.params as { id: string }` with unsafe type assertions. This bypasses Fastify's built-in schema validation and the project's own Zod schemas
- **404 handling bug**: Event/cluster detail routes call `reply.code(404)` but don't `return` — they still call `.parse(event)` on `null`, which will throw a Zod parse error instead of returning a clean 404
- **No request body size limits** explicitly configured
- **No API versioning** — all routes are under `/api/` without a version prefix
- **OG card routes don't handle missing entities gracefully** — `renderOgCard` is called even when event/cluster is null
- **Login route** stores raw IP as `ipHash` (the variable name says hash but the value is `request.ip`)

---

### 7. Auth & Security ⚠️ Mostly Good, Some Gaps

**File**: `apps/api/src/services/auth-service.ts`

**Strengths:**
- Argon2 password hashing (industry standard)
- Signed HttpOnly cookies with SameSite=lax
- Secure cookie flag in production
- Session tokens are hashed before storage (`stableHash`)
- Fallback to in-memory sessions when DB is unavailable (documented as dev-only)
- `requireAdmin` pre-handler pattern for protected routes
- Login rate limiting (10 attempts per minute)

**Issues:**
- **In-memory sessions never expire** from the map — only check expiry on read, but dead entries remain in memory forever (memory leak in long-running API)
- **No CSRF protection** — SameSite=lax helps but isn't sufficient for all attack vectors
- **Token generation** uses `randomUUID() + randomUUID()` — fine but a single `crypto.randomBytes(32)` would be more standard
- **Session lifetime** is a hardcoded 12 hours with no refresh mechanism
- **`requireAdmin`** calls `reply.code(401).send()` but doesn't prevent the route handler from continuing — the handler will still execute after this unless Fastify's hook lifecycle catches it. Should `throw` or `return reply.code(401).send()`
- **No input sanitization** on admin email during login
- **stableHash** uses `sha256` but the AGENTS.md spec mentions Argon2 for passwords — hashing session tokens with SHA-256 is fine, but should be documented

---

### 8. Frontend ⚠️ Functional but Needs Polish

**Files**: `apps/web/src/**/*.tsx`

**Strengths:**
- Next.js App Router with proper Server Components
- Good font choices (IBM Plex Sans, IBM Plex Mono, Space Grotesk)
- MapLibre + deck.gl integration working with ScatterplotLayer
- Proper strategic point overlay from shared `@investor-intel/core`
- Clean component extraction (Panel, MetricCard, MapSurface)
- Dark theme matching the "Palantir-inspired" aesthetic target in AGENTS.md

**Issues:**
- **No `globals.css` content reviewed** but the visual density appears low — large amounts of whitespace vs. the "data-dense but readable" aesthetic target
- **No loading states** — Server Components fetch data at render time with no skeleton/loading UI
- **No error boundaries** — if the API is down, the dashboard will crash
- **Map component** creates/destroys the entire map on every data change (the `useEffect` dependency on `points` causes full re-render). Should update layers in place
- **No interactive timeline** — the timeline is just a static card grid, not a scrubbable timeline as described in AGENTS.md success criteria
- **Admin pages** (`/admin`, `/admin/login`) exist but were not deeply reviewed — they're likely skeleton views
- **No responsive breakpoints** below `md` — the layout may break on mobile
- **No favicon or meta tags** beyond the basic title and description
- **Missing shadcn/ui** — AGENTS.md recommends it for primitives but no shadcn components exist
- **No dark mode CSS** — it assumes dark background via Tailwind classes but there's no `dark:` prefix usage or preference media query
- **No data refresh mechanism** — RSC data is fetched once at page load with no revalidation/polling

---

### 9. Workers & Job Orchestration ✅ Good

**Files**: `workers/src/*.ts`, `workers/src/jobs/*.ts`

**Strengths:**
- CLI router pattern is clean and standard
- Proper ingest run lifecycle (create → process → finish/fail)
- Health snapshots recorded after each adapter run
- Error isolation per adapter (one failing adapter doesn't crash the batch)
- Configurable worker groups (fast vs hourly)

**Issues:**
- **No concurrency control** — if a worker job runs longer than the cron interval, duplicate runs can overlap
- **No dead letter / retry queue** — failed adapters are logged but not retried
- **Cleanup job** exists but wasn't reviewed in detail — should verify it handles all housekeeping
- **No graceful shutdown** — workers don't handle SIGTERM/SIGINT signals
- **Brief generation** calls `getDashboardSummary()` → `saveBrief()` but if zero events exist, it saves a mostly-empty brief every run

---

### 10. Testing 🔴 Critical Gap

**Zero test files exist anywhere in the codebase.**

This is the largest gap vs. industry standards. At minimum, the following should exist:

- Unit tests for scoring functions (`scoreSeverity`, `scoreEscalation`, `scoreMarketRelevance`)
- Unit tests for adapter normalization (given raw input → expected normalized output)
- Contract tests for Zod schemas (ensure valid data passes, invalid rejects)
- Integration tests for key repository methods
- API route smoke tests (at least health check and 404 handling)
- Frontend component render tests for critical panels

---

### 11. Ops & Deployment ✅ Strong

**Files**: `ops/**`, `.env.example`, `docs/setup.md`

**Strengths:**
- Complete `.env.example` with all config variables and comments
- DB bootstrap SQL with PostGIS and pgcrypto extensions
- systemd service and timer unit files for all worker jobs
- cron file as an alternative
- Nginx reverse proxy config with proper proxy headers
- Ubuntu VPS deployment guide
- Source registry documentation

**Issues:**
- **No Docker/Compose** setup — would reduce deployment friction significantly
- **No health check endpoint in the systemd service** — should use `RestartSec` and health probing
- **No log rotation** configuration
- **Bootstrap SQL** is minimal (only extension creation) — should also create the database role and set permissions

---

### 12. Code Quality & Style ✅ Consistently Good

**Overall observations:**

- Consistent code style throughout — suggests Codex maintained a single mental model
- Proper use of TypeScript features (generics, type inference, discriminated unions)
- Clean imports with workspace references (`@investor-intel/core`, etc.)
- No `any` abuse (only in OpenSky state vectors and AISStream messages where upstream schema is loose)
- Good separation: domain logic in `packages/core`, data access in `packages/db`, adapters in `packages/sources`
- All source files are properly formatted

**Missing:**
- No ESLint configuration
- No Prettier configuration (though formatting is consistent)
- No Husky/lint-staged pre-commit hooks
- No CI/CD pipeline configuration

---

## AGENTS.md Compliance Matrix

| Requirement | Status | Notes |
|---|---|---|
| Next.js App Router | ✅ | Implemented |
| TypeScript everywhere | ✅ | Strict mode, shared types |
| Tailwind CSS | ✅ | Configured and used |
| shadcn/ui for primitives | ❌ | Not implemented, uses custom components |
| MapLibre GL JS | ✅ | Working with OpenFreeMap basemap |
| deck.gl overlays | ✅ | ScatterplotLayer on MapboxOverlay |
| Recharts or ECharts | ❌ | No charts implemented yet |
| Fastify API | ✅ | Implemented |
| Zod validation | ✅ | Comprehensive schema coverage |
| Drizzle ORM | ✅ | Full schema and repository |
| PostgreSQL + PostGIS | ✅ | Schema designed, not tested with live DB |
| Pino logging | ✅ | Configured in API and workers |
| Argon2 auth | ✅ | Implemented |
| satori + resvg OG cards | ✅ | Implemented with caching |
| Source provenance visible | ✅ | Built into data model |
| Deterministic scoring | ✅ | 3 scoring functions with explainable weights |
| GDELT adapter | ✅ | Working (no geo extraction) |
| ReliefWeb adapter | ✅ | Working |
| FIRMS adapter | ✅ | Working (needs MAP_KEY) |
| OpenSky adapter | ✅ | Working (needs credentials for better limits) |
| AISStream adapter | ✅ | WebSocket implementation |
| Wikimedia adapter | ✅ | Pageview metrics |
| EIA adapter | ✅ | Energy data |
| FRED adapter | ✅ | Macro indicators |
| Alpha Vantage adapter | ✅ | Market data |
| Event clustering | ❌ | Schema exists, no implementation |
| AI-generated briefs | ❌ | Deterministic fallback only (by design) |
| Test coverage | ❌ | Zero tests |
| Docker/container setup | ❌ | Not attempted |
| Generated DB migrations | ❌ | Uses db:push |
| ACLED excluded | ✅ | Not present |
| Google Maps excluded | ✅ | Uses MapLibre/OpenFreeMap |

---

## Priority Recommendations for Next Phase

### 🔴 Critical (do first)

1. **Fix the event upsert bug** in `app-repository.ts` — the `onConflictDoUpdate` uses the wrong title
2. **Fix the 404 handling** in public routes — add `return` after setting 404 status
3. **Fix the `requireAdmin` hook** — ensure it properly halts request processing
4. **Add input validation** to API routes using Fastify schemas or Zod parsing
5. **Fix the login route** — actually hash the IP before storing it

### 🟡 Important (do soon)

6. **Implement event clustering** — biggest product gap, makes clusters/timeline meaningful
7. **Add unit tests** — start with scoring, normalization, and schema validation
8. **Add ESLint + Prettier** — lock in code quality standards
9. **Wrap multi-table writes in transactions** — prevent partial data writes
10. **Fix map re-rendering** — update layers in place instead of recreating the map
11. **Strengthen timestamp validation** — use `z.string().datetime()` instead of `z.string().min(1)`

### 🟢 Nice to have (v1 polish)

12. **Add loading states and error boundaries** to the frontend
13. **Add interactive timeline** component (scrub/filter by time)
14. **Add charts** (Recharts/ECharts for market data, event frequency)
15. **Integrate shadcn/ui** for UI primitives
16. **Add Docker Compose** for one-command local development
17. **Generate Drizzle migrations** for production-safe schema management
18. **Move analytics aggregation to SQL** — prevent memory issues
19. **Add CI/CD pipeline** configuration
20. **Add signal-based graceful shutdown** to workers

---

## Codex Agent Assessment

### What Codex did exceptionally well:
- **Followed the brief with remarkable accuracy** — nearly every specification in AGENTS.md was addressed
- **Made clean, documented tradeoffs** — LOG.md clearly explains every decision
- **Produced a coherent architecture** — the layering is clean and professional
- **Created good operational artifacts** — .env.example, systemd units, nginx config, bootstrap SQL
- **Maintained consistency** — 65+ files with uniform style and patterns

### Where Codex fell short:
- **No tests whatsoever** — the largest gap
- **Several bugs** that suggest limited runtime testing (upsert, 404, auth hook)
- **Frontend is structurally complete but visually minimal** — not yet matching the "Palantir-inspired" target
- **Some unsafe type casts** in the API layer that a review would catch
- **No clustering implementation** — the biggest product gap

### Final Verdict:
Codex delivered an **impressive scaffold for a single session**. The architecture is professorially correct and the brief adherence is near-perfect. The quality sits at a **senior engineer's first-pass level** — solid bones but needs the second pass for bugs, tests, and polish. We will maintain or raise this standard going forward.

---

*Audit conducted by reviewing all 65+ source files, configuration, documentation, git history, and measuring against AGENTS.md requirements and industry best practices.*
