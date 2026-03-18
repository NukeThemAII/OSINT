# Phase 2: Post-Audit Development Plan

Fix critical bugs, add code quality tooling, implement core missing features, and add test coverage. Ship working improvements on every commit.

## User Review Required

> [!IMPORTANT]
> The plan is sequenced so every step results in a committable, working build. Each batch of changes will be committed and pushed independently.

---

## Proposed Changes

### Batch 1 — Critical Bug Fixes

Fix the 5 bugs identified in the audit. These are quick, high-impact fixes.

#### [MODIFY] [app-repository.ts](file:///c:/Users/matal/Documents/OSINT/packages/db/src/repositories/app-repository.ts)
- **Event upsert bug (line ~598-604)**: Replace hardcoded `eventRecords[0]?.title` in `onConflictDoUpdate` with a SQL expression that uses each row's own value ([sql\](file:///c:/Users/matal/Documents/OSINT/ops/db/bootstrap.sql)excluded.title\``).
- **[finishIngestRun](file:///c:/Users/matal/Documents/OSINT/packages/db/src/repositories/app-repository.ts#513-534) (line ~530)**: Compute actual duration from `startedAt` instead of always writing `0`.

#### [MODIFY] [public.ts](file:///c:/Users/matal/Documents/OSINT/apps/api/src/routes/public.ts)
- **404 handling (lines ~48-53, ~56-61)**: Add `return` after `reply.code(404)` before calling `.parse(null)`. Return a structured `{ data: null }` response instead of crashing on Zod parse of null.

#### [MODIFY] [admin.ts](file:///c:/Users/matal/Documents/OSINT/apps/api/src/routes/admin.ts)
- **requireAdmin hook (line ~22-28)**: Add `return reply` after sending 401 so that the Fastify lifecycle properly halts and the route handler does not execute.
- **Login route IP hashing (line ~39)**: Apply `stableHash()` to `request.ip` before storing.

#### [MODIFY] [reliefweb.ts](file:///c:/Users/matal/Documents/OSINT/packages/sources/src/adapters/reliefweb.ts)
- **Country code conversion (line ~56)**: Replace `.iso3?.slice(0, 2).toUpperCase()` with a proper ISO 3166-1 alpha-3 to alpha-2 lookup map.

#### [MODIFY] [auth-service.ts](file:///c:/Users/matal/Documents/OSINT/apps/api/src/services/auth-service.ts)
- **Memory leak**: Add periodic cleanup of expired in-memory sessions.

---

### Batch 2 — Code Quality Tooling (ESLint + Prettier)

#### [NEW] [.eslintrc.cjs](file:///c:/Users/matal/Documents/OSINT/.eslintrc.cjs)
- Basic ESLint config: `@typescript-eslint`, recommended rules, import ordering.

#### [NEW] [.prettierrc](file:///c:/Users/matal/Documents/OSINT/.prettierrc)
- Standard Prettier config: single quotes, trailing commas, 120 print width to match existing style.

#### [MODIFY] [package.json](file:///c:/Users/matal/Documents/OSINT/package.json)
- Add `lint` and `format` scripts. Add devDependencies for ESLint + Prettier.

---

### Batch 3 — Test Framework + Initial Tests

#### [NEW] [vitest.config.ts](file:///c:/Users/matal/Documents/OSINT/vitest.config.ts)
- Vitest config for the monorepo with workspace-aware resolution.

#### [NEW] [packages/core/src/domain/scoring.test.ts](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/scoring.test.ts)
- Unit tests for [scoreSeverity](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/scoring.ts#42-53), [scoreEscalation](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/scoring.ts#54-67), [scoreMarketRelevance](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/scoring.ts#68-74), [scoreBand](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/scoring.ts#34-41), [clampScore](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/scoring.ts#30-33).
- Test edge cases: zero inputs, max values, missing fields, strategic country codes.

#### [NEW] [packages/core/src/schemas/domain.test.ts](file:///c:/Users/matal/Documents/OSINT/packages/core/src/schemas/domain.test.ts)
- Contract tests: valid event candidate passes, invalid rejects, discriminated union resolves correctly.

#### [NEW] [packages/sources/src/adapters/gdelt.test.ts](file:///c:/Users/matal/Documents/OSINT/packages/sources/src/adapters/gdelt.test.ts)
- Adapter normalization test: mock HTTP response, verify normalized output shape.

#### [MODIFY] [package.json](file:///c:/Users/matal/Documents/OSINT/package.json)
- Add [test](file:///c:/Users/matal/Documents/OSINT/packages/db/src/repositories/app-repository.ts#321-334) script running Vitest.

---

### Batch 4 — Timestamp Validation & Schema Hardening

#### [MODIFY] [common.ts](file:///c:/Users/matal/Documents/OSINT/packages/core/src/schemas/common.ts)
- Tighten `timestampSchema` from `z.string().min(1)` to proper ISO 8601 validation with `z.string().datetime({ offset: true })` and a fallback `z.string().min(1)` union for backward compat.

#### [MODIFY] [public.ts](file:///c:/Users/matal/Documents/OSINT/apps/api/src/routes/public.ts)
- Add Zod validation to query params (limit, symbols) instead of unsafe [as](file:///c:/Users/matal/Documents/OSINT/apps/web/src/app/page.tsx#8-125) casts.

---

### Batch 5 — Event Clustering Engine

The biggest product gap. Implement geo-temporal clustering for events.

#### [NEW] [packages/core/src/domain/clustering.ts](file:///c:/Users/matal/Documents/OSINT/packages/core/src/domain/clustering.ts)
- Pure function: given an array of events with coordinates and timestamps, produce clusters via distance + time-window grouping.
- Simple spatial clustering: group events within configurable km radius and time window.
- Calculate cluster centroid, severity, escalation, and market relevance scores.

#### [MODIFY] [app-repository.ts](file:///c:/Users/matal/Documents/OSINT/packages/db/src/repositories/app-repository.ts)
- Add `runClusterPass()` method: fetch recent unclustered events, call clustering logic, upsert `event_cluster` rows, write `cluster_event_link` and `event_source_link` records.
- Wrap multi-table writes in a Drizzle transaction.

#### [NEW] [workers/src/jobs/cluster-events.ts](file:///c:/Users/matal/Documents/OSINT/workers/src/jobs/cluster-events.ts)
- New worker job that calls the clustering pass.

#### [MODIFY] [workers/src/cli.ts](file:///c:/Users/matal/Documents/OSINT/workers/src/cli.ts)
- Register new `cluster-events` command.

#### [MODIFY] [workers/package.json](file:///c:/Users/matal/Documents/OSINT/workers/package.json)
- Add `cluster` script entry.

#### [MODIFY] [package.json](file:///c:/Users/matal/Documents/OSINT/package.json)
- Add root `worker:cluster` script.

---

## Verification Plan

### Automated Tests

1. **TypeScript build**: `npm run build` — must pass with zero errors after every batch.
2. **Vitest suite** (after Batch 3): `npx vitest run` — all scoring, schema, and adapter tests pass.
3. **Type checking**: `npm run typecheck` — must pass after every batch.

### Manual Verification

1. **Bug fixes (Batch 1)**: After fixing the event upsert, verify by reading the updated code that [sql\](file:///c:/Users/matal/Documents/OSINT/ops/db/bootstrap.sql)excluded.title\`` is used instead of `eventRecords[0]?.title`. Verify 404 routes return properly. Verify `requireAdmin` returns reply.
2. **Linting (Batch 2)**: Run `npm run lint` and verify it exits without config errors.
3. **Tests (Batch 3)**: Run `npx vitest run` and confirm all tests pass.
4. **Build verification**: Run `npm run build` after all batches to confirm the Next.js and workspace build succeeds.

> [!NOTE]
> Each batch will be committed and pushed to GitHub independently so progress is always saved.
