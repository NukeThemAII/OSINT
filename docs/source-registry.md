# Source Registry

The canonical machine-readable source registry lives in `packages/core/src/domain/source-registry.ts`.
This document mirrors the current v1 adapter set and the operational expectations around it.

| Key | Source | Purpose | Cadence | Env required | Notes |
| --- | --- | --- | --- | --- | --- |
| `gdelt` | GDELT | Conflict/news discovery backbone | 5-15 minutes | none | Discovery input only; not treated as final truth. |
| `reliefweb` | ReliefWeb | Humanitarian reports and situation context | 15-60 minutes | `RELIEFWEB_APPNAME` | Stronger humanitarian provenance than generic news. |
| `firms` | NASA FIRMS | Fire and hotspot remote-sensing layer | 1-3 hours | `FIRMS_MAP_KEY` | Labeled as `satellite-derived`; not direct strike confirmation. |
| `opensky` | OpenSky Network | Regional aircraft state vectors | 15-60 minutes | `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET` | Regional polling only; cache aggressively. |
| `aisstream` | AISStream | Vessel movements near chokepoints | continuous / sampled | `AISSTREAM_API_KEY` | Best-effort free maritime picture, not guaranteed full coverage. |
| `wikimedia` | Wikimedia | Public-attention proxy and context enrichment | 15-60 minutes | none | Treated as inferred/supporting context. |
| `eia` | EIA | Oil and energy reference series | 15-60 minutes | `EIA_API_KEY` | Investor-layer energy context. |
| `fred` | FRED | Rates and macro indicators | 15-60 minutes | `FRED_API_KEY` | Macro/risk overlay inputs. |
| `alphavantage` | Alpha Vantage | Equity, ETF, FX, and quote refresh | 5-15 minutes | `ALPHA_VANTAGE_API_KEY` | Adapter boundary keeps vendor swappable later. |

## Adapter contract
Every source adapter implements the boundary defined in `packages/sources/src/base.ts`:
- `fetchBatch(context)` for fetch + normalize + health output
- `healthcheck(context)` for operator visibility

Each batch preserves:
- raw payload storage candidates
- normalized records
- source health status
- upstream identifiers and URLs for provenance

## Current runtime behavior
- Adapters fail soft and write health snapshots rather than blanking the dashboard.
- Adapters validate upstream payloads with Zod where practical.
- Optional credentials disable individual sources cleanly instead of crashing the ingest pass.
- Stable hashing is used for dedupe-ready fingerprints on normalized records.

## Attribution and compliance
The app keeps attribution and docs URLs in the source registry so the UI and admin surfaces can expose provenance later.
Do not treat inferred or satellite-derived signals as confirmed facts.
