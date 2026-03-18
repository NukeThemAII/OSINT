# OSINT Dashboard — Audit & Development Tasks

## Phase 1: Full Codebase Audit ✅
- [x] Explore project structure and monorepo layout
- [x] Read all core schemas, DB schema, adapters, API, frontend, workers
- [x] Write AUDIT.md with findings and Codex rating (7.5/10)
- [x] Push AUDIT.md to GitHub

## Phase 2: Post-Audit Development

### Batch 1 — Critical Bug Fixes
- [ ] Fix event upsert (wrong title in onConflictDoUpdate)
- [ ] Fix 404 handling (missing return in public routes)
- [ ] Fix [requireAdmin](file:///c:/Users/matal/Documents/OSINT/apps/api/src/routes/admin.ts#22-29) hook (doesnt halt processing)
- [ ] Fix login IP hashing (raw IP stored as ipHash)
- [ ] Fix ReliefWeb ISO3→ISO2 country code conversion
- [ ] Fix in-memory session cleanup (memory leak)
- [ ] Commit + push Batch 1

### Batch 2 — Code Quality Tooling
- [ ] Add ESLint config (.eslintrc.cjs)
- [ ] Add Prettier config (.prettierrc)
- [ ] Add lint/format scripts to root package.json
- [ ] Commit + push Batch 2

### Batch 3 — Test Framework + Initial Tests
- [ ] Add Vitest config (vitest.config.ts)
- [ ] Write scoring unit tests (scoreSeverity, scoreEscalation, etc.)
- [ ] Write Zod schema contract tests
- [ ] Write GDELT adapter normalization test
- [ ] Add test script to root package.json
- [ ] Commit + push Batch 3

### Batch 4 — Schema Hardening
- [ ] Tighten timestampSchema to ISO 8601 validation
- [ ] Add Zod validation to API query parameters
- [ ] Commit + push Batch 4

### Batch 5 — Event Clustering Engine
- [ ] Implement geo-temporal clustering logic
- [ ] Add `runClusterPass()` to repository with transactions
- [ ] Add cluster-events worker job
- [ ] Register in CLI and root scripts
- [ ] Commit + push Batch 5
