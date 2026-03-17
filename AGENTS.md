# AGENTS.md — Investor Intel / Iran Conflict Monitor Dashboard

## Purpose

This file is the canonical build brief and operating policy for the **Investor Intel / Iran Conflict Monitor Dashboard**.

It is written for agentic coding tools such as Codex, Gemini CLI, Claude Code, OpenClaw, and similar assistants.

The goal is to build a **serious OSINT dashboard** that feels interactive, geospatial, and operator-grade, but is still practical to ship on a **Linux Ubuntu VPS** using mostly standard web tooling and **free/open data sources**.

This is not a toy demo.
It should become a product-quality intelligence surface for:

- monitoring conflict escalation,
- visualizing events on a live map,
- tracking chokepoints, aircraft, shipping, fires, and crisis indicators,
- and linking that intelligence to **market-sensitive investor signals** such as crude oil, ETFs, FX, rates, and volatility proxies.

This file intentionally gives strong defaults without over-constraining implementation details.
If a simpler approach clearly ships faster and keeps the product high quality, choose the simpler approach and document the tradeoff.

---

## Product vision

Build a web app that answers this question at a glance:

**“What is happening, where is it happening, how severe is it, what changed recently, and what might matter for markets?”**

The app should combine:

1. **Conflict / OSINT layer**
   - news/event clustering,
   - humanitarian / casualty indicators,
   - fires / satellite-derived hotspots,
   - air and maritime movement around key zones,
   - geolocated incidents,
   - timeline and escalation tracking.

2. **Investor layer**
   - crude oil and energy signals,
   - key equity / ETF / index prices,
   - optional FX and macro overlays,
   - “risk-on / risk-off” framing,
   - market-impact notes attached to event clusters.

3. **Operator layer**
   - admin ingestion diagnostics,
   - source health,
   - API usage,
   - request analytics,
   - human vs bot traffic split,
   - source confidence / provenance.

The aesthetic target is:

- dark, crisp, layered,
- data-dense but readable,
- “Palantir-inspired” in seriousness,
- not gimmicky,
- not cluttered,
- fast enough to feel live.

---

## Success criteria

A strong v1 should let a user:

- open the dashboard and instantly see current severity, latest changes, and most important events,
- scrub a timeline and watch the map/state update,
- inspect an event and see sources, coordinates, confidence, tags, and market implications,
- monitor **Hormuz / Gulf / Iraq / Syria / Israel / Lebanon / Yemen / Red Sea** zones,
- see aircraft and vessel overlays where available,
- see fire hotspot overlays and recent incident clusters,
- read hourly AI-generated but schema-constrained summaries,
- share event pages with auto-generated OG preview cards,
- and access an authenticated admin section with ingestion status and traffic analytics.

A strong v2 can expand into:

- more regions,
- more entity tracking,
- more macro and market overlays,
- anomaly detection,
- watchlists,
- alerts,
- satellite thumbnails,
- and multi-conflict support.

---

## Core product principles

1. **Open/free first**
   Prefer sources that are truly free or openly licensed.
   Avoid building dependencies around paid APIs unless explicitly marked optional.

2. **Source provenance is visible**
   Every derived event or summary should be traceable back to source items.

3. **Deterministic first, AI second**
   AI can help summarize and classify, but core ingestion, scoring, and dedupe must work without AI.

4. **Geospatial by default**
   The map is not decoration. It is the main operating surface.

5. **Fast shipping beats academic perfection**
   v1 should work well with robust heuristics.
   Do not block shipping waiting for ideal models or perfect extraction.

6. **No fragile scraping as the backbone**
   Prefer official APIs, feeds, or stable open endpoints.
   Website scraping can exist only as isolated adapters with kill switches.

7. **Human review remains possible**
   Store raw source payloads and normalization logs to support debugging and later audits.

---

## Recommended stack

Use this as the default unless there is a strong reason to diverge.

### Frontend

- **Next.js** (App Router) for the web app
- **TypeScript** everywhere
- **Tailwind CSS** for styling
- **shadcn/ui** for primitives
- **MapLibre GL JS** for the main 2D map
- **deck.gl** for high-volume overlays and timeline-aware rendering
- **Recharts** or **Apache ECharts** for charts

### Backend/API

- **Node.js**
- **Fastify** for the API server
- **Zod** for schema validation
- **Drizzle ORM** or **Prisma** for DB access
- **Pino** for logging

### Database

- **PostgreSQL**
- **PostGIS** required for spatial work
- **TimescaleDB optional** if time-series growth becomes heavy

### Jobs / scheduling

- **Ubuntu cron** or **systemd timers** for v1 job orchestration
- small Node worker scripts executed by cron
- optional queue later if ingestion becomes bursty

### Maps / tiles

- **MapLibre** frontend
- **OpenFreeMap** for quick start basemap during early development
- **OpenMapTiles self-hosted** later if traffic or styling needs grow
- do **not** rely on the public `tile.openstreetmap.org` servers for production traffic

### Image generation

- **satori** to render SVG cards
- **@resvg/resvg-js** to convert SVG to PNG

### Auth

- simple internal auth first:
  - username/email + password,
  - Argon2 password hashing,
  - signed HttpOnly session cookie,
  - admin-only route guard
- no external auth SaaS required for v1

### Analytics

- first-party request/event logging in Postgres
- optional **Umami** sidecar if desired
- keep own bot/human classification because the product explicitly needs a human/bot split view

---

## Why this map stack

Use **MapLibre + deck.gl** as the default stack.

Reasons:

- open-source,
- strong performance,
- good control over styling,
- works well with vector tiles and large overlays,
- no need to tie the product to expensive proprietary map billing,
- fits a VPS deployment model.

Avoid using Google Maps / Google Earth as the baseline because the goal here is a **free/open default architecture** and Google Maps Platform is pay-as-you-go with service-specific usage terms.

---

## Open data source registry

Below is the default source registry. Prefer these sources first.

### 1) GDELT — global event + news mining backbone

**Use for:**
- conflict-related article discovery,
- event extraction,
- keyword monitoring,
- geolocated event seeding,
- trend and narrative shifts.

**Why:**
- broad coverage,
- frequent updates,
- strong fit for “something happened somewhere” ingestion.

**Notes:**
- Use GDELT as an event/news discovery layer, not as the final truth.
- Normalize and cluster with your own logic.

**Links:**
- https://www.gdeltproject.org/
- https://www.gdeltproject.org/data.html
- https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/

### 2) ReliefWeb API — humanitarian and situation reports

**Use for:**
- official humanitarian updates,
- situation reports,
- assessments,
- displacement / aid reporting,
- crisis-reference documents.

**Why:**
- much cleaner and more authoritative for humanitarian context than generic news.

**Implementation notes:**
- include your app name in requests,
- ingest reports, not only headlines,
- use it to enrich event clusters and “humanitarian impact” cards.

**Links:**
- https://apidoc.reliefweb.int/
- https://reliefweb.int/help/api

### 3) HDX HAPI — structured humanitarian indicators

**Use for:**
- standardized crisis indicators,
- cross-source humanitarian datasets,
- later-stage analytic overlays.

**Why:**
- better for structured indicators than scraping reports.

**Links:**
- https://hapi.humdata.org/
- https://data.humdata.org/hapi
- https://data.humdata.org/faqs/devs

### 4) NASA FIRMS — fire / hotspot layer

**Use for:**
- near-real-time hotspot overlays,
- strike / explosion / burn-area proxy signals,
- suspicious clusters around facilities and infrastructure.

**Why:**
- very useful OSINT overlay,
- machine-readable,
- map-friendly.

**Caveat:**
- hotspots are not equal to confirmed strikes.
- present this as a remote-sensing signal, not direct attribution.

**Links:**
- https://firms.modaps.eosdis.nasa.gov/api/
- https://firms.modaps.eosdis.nasa.gov/api/data_availability/
- https://www.earthdata.nasa.gov/data/tools/firms

### 5) NASA EONET — natural event metadata

**Use for:**
- contextual natural hazards,
- fires, dust, storms, other environmental conditions that may affect interpretation.

**Why:**
- useful supporting layer,
- especially when you later expand into supply-chain / regional risk intelligence.

**Links:**
- https://eonet.gsfc.nasa.gov/
- https://eonet.gsfc.nasa.gov/docs/v3
- https://eonet.gsfc.nasa.gov/how-to-guide

### 6) OpenSky Network — aircraft layer

**Use for:**
- aircraft state vectors,
- regional air activity overlays,
- airspace monitoring,
- anomaly cues near monitored zones.

**Why:**
- open/research-oriented source,
- better aligned with a free-data stack than proprietary flight APIs.

**Implementation notes:**
- respect authentication and rate limits,
- cache aggressively,
- support attribution,
- build regional polling boxes instead of global fetches.

**Links:**
- https://opensky-network.org/data/api
- https://opensky-network.org/data
- https://opensky-network.org/about/faq
- https://opensky-network.org/about/terms-of-use

### 7) AISStream and/or AISHub — maritime layer

**Use for:**
- live vessel movement in chokepoints,
- Strait of Hormuz,
- Gulf of Oman,
- Bab-el-Mandeb,
- Red Sea,
- Suez approaches.

**Why:**
- maritime movement matters directly for oil, insurance, and supply-chain risk.

**Default recommendation:**
- use **AISStream** first for a free websocket flow by geographic bounding box,
- keep **AISHub** as a secondary adapter if needed.

**Caveat:**
- free global vessel coverage is weaker and noisier than paid commercial AIS products.
- build the maritime layer as “best available free feed”, not as a guaranteed all-vessel truth source.

**Links:**
- https://aisstream.io/
- https://aisstream.io/documentation
- https://www.aishub.net/api

### 8) OpenStreetMap ecosystem — base geodata

**Use for:**
- boundaries,
- place names,
- roads,
- facilities,
- contextual geospatial reference.

**Why:**
- open,
- mature,
- fits the self-host/open stack.

**Important:**
- OSM data licensing and attribution requirements apply.
- Do not use the public OSM tile servers as your production basemap backend.

**Links:**
- https://www.openstreetmap.org/copyright
- https://operations.osmfoundation.org/policies/tiles/
- https://operations.osmfoundation.org/policies/nominatim/
- https://nominatim.org/release-docs/latest/api/Overview/
- https://overpass-api.de/
- https://dev.overpass-api.de/overpass-doc/en/

### 9) OpenFreeMap / OpenMapTiles — basemap delivery

**Use for:**
- practical basemap serving,
- styled vector tiles,
- eventual self-hosting and scale control.

**Recommended path:**
- early dev: OpenFreeMap,
- production scale: self-host OpenMapTiles / TileServer GL if needed.

**Links:**
- https://openfreemap.org/quick_start/
- https://openmaptiles.org/
- https://openmaptiles.org/docs/
- https://openmaptiles.org/docs/host/tileserver-gl/

### 10) Wikimedia APIs — casualty/context support and public attention proxy

**Use for:**
- pulling page content / summaries / revisions,
- parsing specific conflict pages when appropriate,
- optional casualty summaries from known pages,
- pageview spikes as a public-attention indicator.

**Caveat:**
- casualty extraction from Wikipedia is brittle and should be marked as **derived / lower-confidence** unless confirmed elsewhere.
- never present Wikipedia-derived numbers as the only authoritative statistic.

**Use cases:**
- daily or hourly pageview gauge for key pages,
- infobox/table extraction for context cards,
- revision-diff monitoring for notable page updates.

**Links:**
- https://www.mediawiki.org/wiki/API:Action_API
- https://www.mediawiki.org/wiki/API:REST_API
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html
- https://www.mediawiki.org/wiki/API:Etiquette
- https://query.wikidata.org/

### 11) EIA / FRED / Alpha Vantage — investor layer

**Use for:**
- crude and energy reference data,
- macro data,
- rate data,
- ETF / stock / FX overlays.

**Recommended split:**
- **EIA** for oil/energy context,
- **FRED** for macro and rates,
- **Alpha Vantage** for equity / ETF / FX / commodities where suitable.

**Caveat:**
- do not design the financial layer around unofficial Yahoo scraping.
- keep a market data adapter boundary so you can swap vendors later.

**Links:**
- https://www.eia.gov/opendata/documentation.php
- https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm
- https://fred.stlouisfed.org/docs/api/fred/
- https://fred.stlouisfed.org/docs/api/fred/overview.html
- https://www.alphavantage.co/
- https://www.alphavantage.co/documentation/

### 12) GDACS and USGS — optional global hazard overlays

**Use for:**
- earthquakes,
- disaster alerts,
- cross-hazard overlays.

**Why:**
- not central to the Iran monitor, but good optional enrichment.

**Links:**
- https://www.gdacs.org/
- https://earthquake.usgs.gov/fdsnws/event/1/
- https://earthquake.usgs.gov/earthquakes/feed/

### 13) Copernicus Data Space / OpenAerialMap — optional satellite imagery layer

**Use for:**
- later-stage imagery overlays,
- scene discovery,
- before/after visual workflows,
- source thumbnails on event detail pages.

**Why:**
- useful, but heavier than v1 and should not block shipping.

**Caveat:**
- imagery availability, cloud cover, latency, and operational complexity vary.
- treat this as a v2 or operator-mode enhancement unless a narrow use case is obvious.

**Links:**
- https://documentation.dataspace.copernicus.eu/
- https://documentation.dataspace.copernicus.eu/APIs.html
- https://dataspace.copernicus.eu/
- https://docs.openaerialmap.org/api/api/

---

## Explicit exclusions / caution list

### ACLED

Do **not** make ACLED part of the free default commercial product path.
Commercial entities may require a separate corporate license.
Only use it if licensing has been reviewed and approved.

### MarineTraffic / ADS-B Exchange commercial products

These are useful ecosystems, but do not build v1 around them because the goal is a free/open baseline.
They can be evaluated later as optional premium adapters.

### Public CCTV / webcams as a core dependency

Do not make scattered public webcams a required source.
Coverage is inconsistent, URLs break, licensing varies, and many streams are not suitable for reliable automated ingestion.
They are fine as curated optional embeds or analyst bookmarks, not as the backbone of the product.

### Google Maps / Google Earth as the foundation

Avoid as baseline for this product because the project goal is open/free-first infrastructure and long-term control.

---

## Licensing / compliance policy

Agents must respect source terms.

### Required behaviors

- preserve and show attribution where needed,
- keep a `sources` registry in code with license/attribution metadata,
- record which derived objects came from which upstream source IDs or URLs,
- never hide uncertainty,
- never present estimated or inferred data as confirmed fact,
- never scrape a source if its terms prohibit it,
- never commit secrets or API keys.

### Data labeling policy

Every event or metric should have at least one of:

- `source_type: official`
- `source_type: humanitarian`
- `source_type: news`
- `source_type: crowdsourced`
- `source_type: satellite-derived`
- `source_type: inferred`

And one confidence score:

- `confidence: low | medium | high`

And one review flag:

- `review_status: raw | normalized | clustered | analyst_reviewed`

---

## High-level architecture

### Services

#### 1) Web app
- renders dashboard, map, timeline, charts, event pages, admin pages

#### 2) API server
- serves normalized entities,
- event clusters,
- metrics,
- market data,
- OG images,
- auth/session APIs,
- admin diagnostics.

#### 3) Ingestion workers
- fetch upstream data,
- normalize records,
- geocode / reverse-geocode where needed,
- dedupe,
- cluster,
- compute scores,
- write to DB.

#### 4) Scheduler
- cron or systemd timers invoking worker scripts on schedule.

#### 5) Database
- stores source records, normalized entities, geospatial features, market metrics, analytics, sessions.

#### 6) Optional object storage
- local filesystem first,
- MinIO / S3-compatible later,
- store OG cards, thumbnails, cached imagery, raw source snapshots.

### Recommended monorepo layout

```text
/apps
  /web               # Next.js UI
  /api               # Fastify API
/packages
  /db                # schema, migrations, queries
  /core              # shared types, zod schemas, scoring logic
  /ui                # optional shared components
  /maps              # map helpers, layer definitions
  /sources           # source adapters
/workers
  /ingest-gdelt
  /ingest-reliefweb
  /ingest-firms
  /ingest-opensky
  /ingest-ais
  /ingest-markets
  /cluster-events
  /generate-brief
  /generate-og
/ops
  /cron
  /systemd
  /deploy
/docs
  /source-registry.md
  /runbooks
```

---

## Database model

Use Postgres + PostGIS. Keep schemas explicit and boring.

### Core tables

#### `source_item`
Raw upstream records.

Fields:
- id
- source_name
- source_kind
- external_id
- fetched_at
- published_at
- url
- title
- body_text
- raw_json
- language
- hash
- ingest_run_id

#### `location`
Canonical geospatial references.

Fields:
- id
- name
- country_code
- admin1
- admin2
- geom_point
- geom_bbox
- geocoder_source
- precision_level

#### `event`
Normalized atomic event.

Fields:
- id
- event_type
- event_subtype
- title
- summary
- occurred_at
- location_id
- geom_point
- severity_score
- confidence
- source_count
- casualty_killed
- casualty_injured
- assets_affected
- tags[]
- market_relevance_score
- created_at
- updated_at

#### `event_source_link`
Links normalized events to supporting sources.

Fields:
- event_id
- source_item_id
- role (`primary`, `supporting`, `context`)
- extraction_method

#### `event_cluster`
Higher-level grouped incidents.

Fields:
- id
- label
- cluster_kind
- center_geom
- started_at
- last_seen_at
- severity_score
- escalation_score
- event_count
- summary

#### `market_snapshot`
Time-series financial data.

Fields:
- id
- symbol
- asset_class
- ts
- price
- change_pct
- volume_nullable
- source_name

#### `indicator_snapshot`
General time-series indicators.

Fields:
- id
- metric_key
- ts
- value_num
- value_text_nullable
- source_name
- region_key_nullable

#### `brief`
Generated narrative summaries.

Fields:
- id
- scope_key
- generated_at
- model_name
- prompt_version
- structured_json
- markdown

#### `request_event`
Traffic analytics.

Fields:
- id
- ts
- path
- method
- status_code
- referer
- ua
- ip_hash
- country_code_nullable
- is_bot
- bot_reason_nullable
- session_id_nullable

#### `ingest_run`
Operational visibility for jobs.

Fields:
- id
- worker_name
- started_at
- finished_at
- status
- records_fetched
- records_written
- errors_json
- duration_ms

---

## Event normalization model

Every source adapter should output a common event candidate shape before clustering.

```ts
{
  sourceName: string;
  externalId: string;
  title: string;
  body?: string;
  publishedAt?: string;
  occurredAt?: string;
  lat?: number;
  lon?: number;
  placeName?: string;
  countryCode?: string;
  eventType?: string;
  tags?: string[];
  killed?: number | null;
  injured?: number | null;
  damageSummary?: string | null;
  urls: string[];
  confidence: 'low' | 'medium' | 'high';
  sourceType: 'official' | 'humanitarian' | 'news' | 'crowdsourced' | 'satellite-derived' | 'inferred';
}
```

Normalization rules:

- prefer source-provided coordinates,
- else use explicit place extraction,
- else geocode with caution,
- preserve original text,
- never overwrite raw values destructively,
- keep all extraction decisions inspectable.

---

## Scoring model

### Severity score

The severity score should be deterministic and explainable.

Use a 0–100 composite score combining signals such as:

- event type weight,
- casualty counts,
- infrastructure relevance,
- location sensitivity,
- source diversity,
- source credibility,
- recency,
- proximity to strategic assets,
- sustained repeat incidents in same cluster.

Example buckets:

- 0–19 low
- 20–39 elevated
- 40–59 significant
- 60–79 severe
- 80–100 critical

### Escalation score

This is not the same as severity.
It should reflect **change in tempo and intensity**.

Suggested features:

- event frequency delta over rolling windows,
- share of high-severity incidents,
- widening geography,
- new strategic target categories,
- increases in air / maritime anomalies,
- crude price response,
- pageview spike / public attention spike,
- humanitarian report acceleration.

### Market relevance score

Use a separate 0–100 score for investor usefulness.

Suggested features:

- distance to oil/gas facilities,
- distance to chokepoints,
- relation to ports / shipping lanes,
- relation to regional airspace,
- whether energy, logistics, export, or sanctions language appears,
- whether crude / tanker / shipping moves react in time window.

---

## AI usage policy

AI is optional but valuable for briefs and tag enrichment.

### Good AI use cases

- generating hourly or on-demand summaries,
- producing “what changed since last run” text,
- classifying market relevance,
- converting a cluster into a clean narrative,
- extracting structured fields from messy humanitarian text.

### Bad AI use cases

- inventing coordinates,
- inventing casualty counts,
- overwriting deterministic facts,
- turning uncertain input into overconfident output.

### AI implementation rules

- all AI outputs must target a strict schema,
- reject invalid JSON,
- keep prompt versions in code,
- store model name and prompt version,
- always preserve source links in the final narrative object,
- summaries must say when evidence is mixed or limited.

### Fallback behavior

If AI fails:
- the dashboard still works,
- deterministic event clustering still runs,
- the app falls back to template-based summaries.

---

## Ingestion schedule defaults

Use cron/systemd first. Keep it boring.

### Every 5–15 minutes
- GDELT discovery
- event clustering pass
- severity / escalation recompute
- market price refresh where free source allows

### Every 15–60 minutes
- ReliefWeb
- Wikimedia pageview metrics
- OpenSky regional polling
- maritime aggregation / chokepoint density snapshots
- OG regeneration for front-page summary card if changed

### Near-real-time / continuous where practical
- AIS websocket consumer

### Every 1–3 hours
- NASA FIRMS pull
- brief generation
- admin housekeeping

### Daily
- cleanup / retention jobs
- derived aggregate materializations
- sitemap / page regeneration
- backup / export

---

## Geographic focus defaults

v1 should not pretend to cover the world equally.
Focus first on the most market-relevant and conflict-relevant areas.

### Primary AOIs
- Iran
- Iraq
- Syria
- Israel / Palestine
- Lebanon
- Jordan
- Yemen
- Saudi east coast context
- UAE maritime context
- Oman / Gulf of Oman
- Strait of Hormuz
- Red Sea
- Bab-el-Mandeb
- Eastern Mediterranean context

### Key chokepoints / facilities overlays
- Strait of Hormuz
- Bab-el-Mandeb
- Suez approaches
- major export terminals
- refineries
- LNG and oil infrastructure where open data is reasonably available
- major ports
- military airfields only if sourced cleanly from open data and labeled properly

---

## Map UX requirements

The map is the centerpiece.

### Required capabilities

- clustering and declustering,
- timeline-aware replay,
- layer toggles,
- hover tooltips,
- click-to-open detail drawer,
- heatmap and point modes,
- severity-based styling,
- source confidence indicator,
- bounding-box deep-linking in URL.

### Recommended layers

- basemap
- event points / clusters
- severity heat layer
- fire hotspots
- aircraft positions / density
- vessel positions / density
- chokepoints / strategic zones
- optional natural hazards
- optional market-sensitive infrastructure

### Interaction design

- left panel: filters
- center: map
- right drawer: event/cluster detail
- bottom: timeline scrubber
- top ribbon: KPIs and market strip

### Styling direction

- dark by default,
- subtle glows,
- crisp typography,
- restrained color palette,
- avoid “cyberpunk toy” look,
- use motion sparingly.

---

## Dashboard pages

### `/`
Main command dashboard.

Must include:
- severity gauge,
- escalation gauge,
- last updated,
- key changes,
- map,
- timeline,
- major event list,
- investor strip.

### `/events/[id]`
Event detail page.

Must include:
- title,
- time,
- location,
- map,
- structured facts,
- supporting sources,
- confidence,
- market relevance,
- related events,
- OG image.

### `/clusters/[id]`
Cluster detail page.

Must include:
- cluster summary,
- event list,
- timeline,
- severity trend,
- geography footprint.

### `/markets`
Investor intelligence page.

Must include:
- crude,
- key ETFs / indices,
- risk dashboard,
- correlation notes,
- event-to-market linkage cards.

### `/briefs`
Narrative summaries archive.

### `/admin`
Admin home.

Must include:
- auth guard,
- ingestion health,
- worker runs,
- source freshness,
- API errors,
- traffic analytics,
- human/bot split.

---

## Investor intelligence module

This should be useful, not decorative.

### Core investor metrics for v1

- Brent / WTI context
- front-page energy snapshot
- 3–10 watchlist symbols / ETFs
- DXY or equivalent dollar proxy if available
- 10Y yields or selected rates proxy if available
- optional gold proxy
- optional shipping / airline / defense watchlists

### Suggested watchlist buckets

#### Energy
- crude benchmarks
- broad energy ETF
- major oil producers if desired

#### Defense / aerospace
- broad defense basket or selected names if desired

#### Broad risk
- world ETF
- US equity index ETF
- volatility proxy where available

#### Regional / logistics
- shipping / transport proxy if useful

### Product behavior

Every major event cluster can have:
- “why markets may care” note,
- exposed chokepoint/infrastructure relation,
- linked symbols/watchlist items.

Do not overclaim causality.
Phrase it as exposure / relevance / possible transmission path.

---

## Human vs bot analytics requirements

Because the product explicitly needs a human/bot traffic split, implement your own first-party request analytics.

### Minimum viable design

Middleware logs:
- timestamp
- path
- method
- status
- ua
- referer
- hashed IP
- session id if present
- bot verdict
- bot reason

### Bot detection heuristics

Combine:
- `isbot`-style UA matching,
- obvious crawler strings,
- headless/browser automation markers,
- very high request velocity,
- datacenter ASN/IP flags later if desired.

### Privacy

- hash IPs,
- do not store raw IP longer than operationally needed,
- keep cookies minimal,
- document retention.

### Admin views

- total requests
- human requests
- bot requests
- human/bot split over time
- top bot UAs
- top paths by humans
- referrers
- 24h / 7d / 30d windows

Optional:
- run Umami side-by-side for quick product analytics, but your own request table remains the source of truth for bot split.

---

## OG card requirements

Every shareable page should have a strong OG card.

### Implementation default

- render with **satori** to SVG
- convert SVG to PNG with **resvg-js**
- cache results on disk or object storage
- bust cache when source data changes materially

### OG card variants

- front-page overall severity card
- event detail card
- cluster summary card
- market snapshot card

### Design guidance

Use:
- dark theme,
- timestamp,
- title,
- severity badge,
- small sparkline or micro-map when useful,
- not too much text.

---

## Source adapter rules

Every source integration must live behind a clear adapter boundary.

### Adapter contract

Each adapter should expose functions similar to:

```ts
fetchRaw(params) => Promise<RawSourcePayload[]>
normalize(raw) => Promise<NormalizedCandidate[]>
healthcheck() => Promise<HealthStatus>
```

### Adapter requirements

- retries with backoff,
- timeout defaults,
- rate limit awareness,
- source-specific user agent if needed,
- raw payload retention,
- stable hashing for dedupe,
- tests with recorded fixtures where practical.

---

## Deduping and clustering rules

This part matters a lot.

### Deduping

Use a layered strategy:
- exact URL/external ID match,
- normalized title hash,
- body similarity,
- location/time proximity,
- event-type match.

### Clustering

Group items by:
- spatiotemporal proximity,
- shared tags,
- related infrastructure/facilities,
- source overlap,
- semantic similarity.

Keep it explainable.
Every cluster should be traceable to its children.

---

## Engineering defaults

### Code style
- strict TypeScript
- small focused modules
- no giant utility dumps
- meaningful naming
- comments only where they help

### Testing
- unit tests for scoring, normalization, dedupe
- contract tests for source adapters
- smoke tests for critical pages and APIs

### Observability
- structured logs
- health endpoint
- DB-backed ingest run history
- admin-visible recent errors

### Error handling
- fail soft on source outages
- partial degradation is acceptable
- the dashboard should not go blank because one adapter failed

---

## Deployment target

Ubuntu VPS is the default target.

### Recommended production topology

- Nginx reverse proxy
- Node process manager (systemd or PM2)
- Postgres locally or managed
- cron/systemd timers for workers
- optional Redis later
- local object storage directory first

### Deployment preferences

- simple shell deploy or Docker Compose, whichever is faster to keep reliable
- no Kubernetes
- no over-engineering

### Environment files

Keep:
- `.env.example`
- explicit required variables
- no secrets in repo

Potential env vars:
- DATABASE_URL
- SESSION_SECRET
- OPENAI_API_KEY / other AI provider keys optional
- ALPHA_VANTAGE_API_KEY optional
- FIRMS_MAP_KEY optional
- OPENSKY_CLIENT_ID / SECRET if needed
- AISSTREAM_API_KEY if used
- RELIEFWEB_APPNAME

---

## Performance goals

### UI
- main dashboard interactive quickly on a normal VPS
- map layer toggles should feel immediate
- cache expensive aggregates

### Backend
- pre-aggregate commonly requested metrics
- paginate event feeds
- avoid N+1 queries
- use spatial indexes properly

### Caching
- API response caching where safe
- DB materialized views or precomputed tables for summaries
- OG image cache

---

## Security requirements

- admin routes protected
- session cookies HttpOnly and Secure in production
- CSRF-safe patterns for mutations
- rate limit admin auth endpoints
- sanitize any user-generated text
- never expose raw secrets to client bundles

---

## Roadmap guidance

### Phase 1 — shippable foundation
Build first:
- monorepo skeleton
- Postgres/PostGIS
- source adapters: GDELT, ReliefWeb, FIRMS, markets
- event normalization and clustering
- dashboard page with live map and timeline
- event detail page
- hourly brief generation
- OG image generation
- admin health page
- basic human/bot analytics

### Phase 2 — tactical overlays
Add:
- OpenSky regional aircraft layer
- AIS chokepoint vessel layer
- pageview attention metrics
- better market linkage cards
- alerting hooks

### Phase 3 — analyst mode
Add:
- source diff views
- event review queue
- richer imagery support
- saved watchlists
- multi-region support

---

## What agents should optimize for

When working in this repository, agents should prioritize:

1. **Shipping vertical slices** over endless scaffolding
2. **Keeping the map experience excellent**
3. **Preserving provenance**
4. **Making data adapters replaceable**
5. **Not blocking on premium services**
6. **A product that is useful to an investor/operator today**

---

## What agents should avoid

- giant abstract architecture with no UI
- fake “live” claims when data is not truly live
- hard-coding scraped HTML selectors everywhere
- trusting one source blindly
- presenting inferred data as confirmed
- bloating the stack with unnecessary infra
- building the whole world before the first working AOI

---

## Definition of done for a strong first release

A release is strong when:

- the dashboard ingests multiple free sources on schedule,
- events appear on a real map with usable filters,
- severity and escalation indicators update automatically,
- a market strip and investor relevance logic exist,
- event pages are shareable with OG cards,
- the admin page shows source freshness and traffic split,
- and the system runs reliably on an Ubuntu VPS without premium infrastructure.

---

## Final build posture

This product should feel like:

- a compact private intelligence terminal,
- built with open infrastructure,
- useful to a serious retail investor / analyst,
- honest about uncertainty,
- visually strong,
- and extensible.

If a decision is unclear, choose the path that:

- preserves source provenance,
- keeps the app responsive,
- avoids vendor lock-in,
- and gets a real working dashboard in front of the user fastest.
