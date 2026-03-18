import { randomUUID } from 'node:crypto';

import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';

import {
  buildFallbackBrief,
  scoreBand,
  scoreMarketRelevance,
  scoreSeverity,
  type AdminAnalyticsSummary,
  type AssetTrack,
  type AuthSession,
  type BoundingBox,
  type Brief,
  type DashboardSummary,
  type Event,
  type EventCluster,
  type HotspotSignal,
  type IndicatorSignal,
  type MapFeature,
  type MarketSignal,
  type NormalizedEventCandidate,
  type NormalizedRecord,
  type SourceHealth,
  type SourceItem,
  type SourceProvenance,
  type TimelineEntry,
} from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import { getDatabase } from '../client';
import {
  adminSessions,
  adminUsers,
  assetTracks,
  briefs,
  eventClusters,
  events,
  hotspotSignals,
  indicatorSnapshots,
  ingestRuns,
  marketSnapshots,
  requestEvents,
  sourceHealthSnapshots,
  sourceItems,
  timelineEntries,
} from '../schema';

type WindowKey = '24h' | '7d' | '30d';

export interface RequestEventInput {
  path: string;
  method: string;
  statusCode: number;
  referer?: string;
  ua?: string;
  ipHash?: string;
  countryCode?: string;
  isBot: boolean;
  botReason?: string;
  sessionId?: string;
}

export interface AdminSessionRecord {
  id: string;
  email: string;
  expiresAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toOptionalIso(value: Date | string | null | undefined): string | undefined {
  return value ? toIso(value) : undefined;
}

function toOptionalNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function toProvenance(candidate: NormalizedEventCandidate): SourceProvenance[] {
  return [
    {
      sourceName: candidate.sourceName,
      sourceKind: candidate.sourceKind,
      sourceType: candidate.sourceType,
      externalId: candidate.externalId,
      url: candidate.urls[0],
      retrievedAt: candidate.publishedAt ?? candidate.occurredAt,
      confidence: candidate.confidence,
      reviewStatus: candidate.reviewStatus,
    },
  ];
}

function mapEvent(row: typeof events.$inferSelect): Event {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    eventType: row.eventType ?? undefined,
    eventSubtype: row.eventSubtype ?? undefined,
    title: row.title,
    summary: row.summary ?? undefined,
    occurredAt: toOptionalIso(row.occurredAt),
    locationId: row.locationId ?? undefined,
    geomPoint: row.lat !== null && row.lon !== null ? { lat: row.lat, lon: row.lon } : undefined,
    severityScore: row.severityScore,
    confidence: row.confidence,
    sourceType: row.sourceType,
    reviewStatus: row.reviewStatus,
    sourceCount: row.sourceCount,
    casualtyKilled: row.casualtyKilled,
    casualtyInjured: row.casualtyInjured,
    assetsAffected: row.assetsAffected ?? undefined,
    tags: row.tags,
    marketRelevanceScore: row.marketRelevanceScore,
    provenance: row.provenance,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCluster(row: typeof eventClusters.$inferSelect): EventCluster {
  return {
    id: row.id,
    label: row.label,
    clusterKind: row.clusterKind,
    center: row.centerLat !== null && row.centerLon !== null ? { lat: row.centerLat, lon: row.centerLon } : undefined,
    bbox: row.bbox ?? undefined,
    startedAt: toOptionalIso(row.startedAt),
    lastSeenAt: toOptionalIso(row.lastSeenAt),
    severityScore: row.severityScore,
    escalationScore: row.escalationScore,
    eventCount: row.eventCount,
    summary: row.summary ?? undefined,
    tags: row.tags,
    marketRelevanceScore: row.marketRelevanceScore,
  };
}

function mapTimeline(row: typeof timelineEntries.$inferSelect): TimelineEntry {
  return {
    id: row.id,
    eventId: row.eventId ?? undefined,
    clusterId: row.clusterId ?? undefined,
    entryType: row.entryType,
    title: row.title,
    occurredAt: toIso(row.occurredAt),
    severityScore: row.severityScore,
    escalationScore: row.escalationScore ?? undefined,
    marketRelevanceScore: row.marketRelevanceScore ?? undefined,
    geomPoint: row.lat !== null && row.lon !== null ? { lat: row.lat, lon: row.lon } : undefined,
    tags: row.tags,
    provenance: row.provenance,
    payload: row.payload,
  };
}

function mapMarket(row: typeof marketSnapshots.$inferSelect): MarketSignal {
  return {
    kind: 'market_signal',
    sourceName: row.sourceName,
    sourceKind: 'market',
    sourceType: row.sourceType,
    confidence: row.confidence,
    externalId: row.externalId,
    symbol: row.symbol,
    assetClass: row.assetClass,
    observedAt: toIso(row.ts),
    label: row.label ?? undefined,
    currency: row.currency ?? undefined,
    price: Number(row.price),
    changePct: toOptionalNumber(row.changePct),
    volume: toOptionalNumber(row.volume),
    metadata: row.metadata,
  };
}

function mapSourceHealth(row: typeof sourceHealthSnapshots.$inferSelect): SourceHealth {
  return {
    sourceName: row.sourceName,
    sourceKind: row.sourceKind,
    status: row.status as SourceHealth['status'],
    message: row.message ?? undefined,
    lastAttemptAt: toOptionalIso(row.lastAttemptAt ?? row.checkedAt),
    lastSuccessAt: toOptionalIso(row.lastSuccessAt),
    latencyMs: row.latencyMs ?? undefined,
    recordsFetched: row.recordsFetched ?? undefined,
    recordsWritten: row.recordsWritten ?? undefined,
    detail: row.detail,
  };
}

function emptySummary(): DashboardSummary {
  const generatedAt = nowIso();
  return {
    generatedAt,
    severity: {
      label: 'Regional severity',
      score: 0,
      band: scoreBand(0),
      summary: 'No normalized incidents available yet.',
    },
    escalation: {
      label: 'Escalation tempo',
      score: 0,
      band: scoreBand(0),
      summary: 'No rolling trend data available yet.',
    },
    latestBrief: null,
    keyChanges: [],
    events: [],
    clusters: [],
    timeline: [],
    markets: [],
    sourceHealth: [],
  };
}

function buildMarketMap(rows: (typeof marketSnapshots.$inferSelect)[], symbols?: string[]): MarketSignal[] {
  const latest = new Map<string, typeof marketSnapshots.$inferSelect>();
  for (const row of rows) {
    if (symbols?.length && !symbols.includes(row.symbol)) continue;
    if (!latest.has(row.symbol)) latest.set(row.symbol, row);
  }
  return Array.from(latest.values()).map(mapMarket);
}

function windowStart(window: WindowKey): Date {
  const now = Date.now();
  if (window === '24h') return new Date(now - 24 * 60 * 60 * 1000);
  if (window === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  return new Date(now - 30 * 24 * 60 * 60 * 1000);
}

export class AppRepository {
  private readonly database = getDatabase();

  get configured(): boolean {
    return Boolean(this.database);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    if (!this.database) return emptySummary();

    const [eventRows, clusterRows, timelineRows, marketRows, briefRows, healthRows] = await Promise.all([
      this.database.db.select().from(events).orderBy(desc(events.occurredAt), desc(events.updatedAt)).limit(8),
      this.database.db.select().from(eventClusters).orderBy(desc(eventClusters.lastSeenAt), desc(eventClusters.updatedAt)).limit(5),
      this.database.db.select().from(timelineEntries).orderBy(desc(timelineEntries.occurredAt)).limit(12),
      this.database.db.select().from(marketSnapshots).orderBy(desc(marketSnapshots.ts)).limit(40),
      this.database.db.select().from(briefs).orderBy(desc(briefs.generatedAt)).limit(1),
      this.database.db.select().from(sourceHealthSnapshots).orderBy(desc(sourceHealthSnapshots.checkedAt)).limit(40),
    ]);

    const mappedEvents = eventRows.map(mapEvent);
    const mappedClusters = clusterRows.map(mapCluster);
    const mappedTimeline = timelineRows.map(mapTimeline);
    const markets = buildMarketMap(marketRows).slice(0, 12);
    const latestHealth = new Map<string, typeof sourceHealthSnapshots.$inferSelect>();
    for (const row of healthRows) {
      if (!latestHealth.has(row.sourceName)) latestHealth.set(row.sourceName, row);
    }
    const sourceHealth = Array.from(latestHealth.values()).map(mapSourceHealth);
    const latestBrief = briefRows[0]
      ? {
          id: briefRows[0].id,
          scopeKey: briefRows[0].scopeKey,
          generatedAt: toIso(briefRows[0].generatedAt),
          modelName: briefRows[0].modelName,
          promptVersion: briefRows[0].promptVersion,
          markdown: briefRows[0].markdown,
          structuredJson: briefRows[0].structuredJson,
        }
      : null;

    const severityScore = Math.max(mappedClusters[0]?.severityScore ?? 0, mappedEvents[0]?.severityScore ?? 0);
    const escalationScore = mappedClusters[0]?.escalationScore ?? 0;

    return {
      generatedAt: nowIso(),
      severity: {
        label: 'Regional severity',
        score: severityScore,
        band: scoreBand(severityScore),
        summary: mappedEvents[0]?.title ?? 'Awaiting normalized incident flow.',
      },
      escalation: {
        label: 'Escalation tempo',
        score: escalationScore,
        band: scoreBand(escalationScore),
        summary: mappedClusters[0]?.label ?? 'Awaiting cluster tempo signals.',
      },
      latestBrief,
      keyChanges: mappedEvents.slice(0, 5).map((event) => event.title),
      events: mappedEvents,
      clusters: mappedClusters,
      timeline: mappedTimeline,
      markets,
      sourceHealth,
    };
  }

  async getEventDetail(id: string): Promise<Event | null> {
    if (!this.database) return null;
    const row = await this.database.db.query.events.findFirst({ where: eq(events.id, id) });
    return row ? mapEvent(row) : null;
  }

  async getClusterDetail(id: string): Promise<EventCluster | null> {
    if (!this.database) return null;
    const row = await this.database.db.query.eventClusters.findFirst({ where: eq(eventClusters.id, id) });
    return row ? mapCluster(row) : null;
  }

  async getLatestBriefs(limit = 12): Promise<Brief[]> {
    if (!this.database) return [];
    const rows = await this.database.db.select().from(briefs).orderBy(desc(briefs.generatedAt)).limit(limit);
    return rows.map((row) => ({
      id: row.id,
      scopeKey: row.scopeKey,
      generatedAt: toIso(row.generatedAt),
      modelName: row.modelName,
      promptVersion: row.promptVersion,
      markdown: row.markdown,
      structuredJson: row.structuredJson,
    }));
  }

  async getTimeline(limit = 100): Promise<TimelineEntry[]> {
    if (!this.database) return [];
    const rows = await this.database.db.select().from(timelineEntries).orderBy(desc(timelineEntries.occurredAt)).limit(limit);
    return rows.map(mapTimeline);
  }

  async getMapFeatures(options: { limit?: number; kinds?: Array<MapFeature['kind']> }): Promise<{ items: MapFeature[]; bbox?: BoundingBox }> {
    if (!this.database) return { items: [] };

    const limit = options.limit ?? 400;
    const requestedKinds = new Set(options.kinds ?? ['event', 'cluster', 'asset_track', 'hotspot']);
    const features: MapFeature[] = [];

    if (requestedKinds.has('event')) {
      const rows = await this.database.db.select().from(events).orderBy(desc(events.occurredAt)).limit(limit);
      for (const row of rows) {
        if (row.lat === null || row.lon === null) continue;
        features.push({
          id: row.id,
          kind: 'event',
          title: row.title,
          point: { lat: row.lat, lon: row.lon },
          severityScore: row.severityScore,
          confidence: row.confidence,
          occurredAt: toOptionalIso(row.occurredAt),
          tags: row.tags,
        });
      }
    }

    if (requestedKinds.has('cluster')) {
      const rows = await this.database.db.select().from(eventClusters).orderBy(desc(eventClusters.lastSeenAt)).limit(Math.min(limit, 100));
      for (const row of rows) {
        if (row.centerLat === null || row.centerLon === null) continue;
        features.push({
          id: row.id,
          kind: 'cluster',
          title: row.label,
          point: { lat: row.centerLat, lon: row.centerLon },
          severityScore: row.severityScore,
          occurredAt: toOptionalIso(row.lastSeenAt),
          tags: row.tags,
        });
      }
    }

    if (requestedKinds.has('asset_track')) {
      const rows = await this.database.db.select().from(assetTracks).orderBy(desc(assetTracks.observedAt)).limit(limit);
      for (const row of rows) {
        features.push({
          id: row.id,
          kind: 'asset_track',
          title: row.name ?? row.ident ?? `${row.trackType}:${row.externalId}`,
          point: { lat: row.lat, lon: row.lon },
          confidence: row.confidence,
          occurredAt: toIso(row.observedAt),
          tags: [row.trackType],
        });
      }
    }

    if (requestedKinds.has('hotspot')) {
      const rows = await this.database.db.select().from(hotspotSignals).orderBy(desc(hotspotSignals.observedAt)).limit(limit);
      for (const row of rows) {
        features.push({
          id: row.id,
          kind: 'hotspot',
          title: row.instrument ? `FIRMS ${row.instrument}` : 'FIRMS hotspot',
          point: { lat: row.lat, lon: row.lon },
          confidence: row.confidence,
          occurredAt: toIso(row.observedAt),
          tags: ['fire_hotspot'],
        });
      }
    }

    return { items: features.slice(0, limit) };
  }

  async getMarketSignals(options?: { symbols?: string[]; limit?: number }): Promise<MarketSignal[]> {
    if (!this.database) return [];
    const rows = await this.database.db.select().from(marketSnapshots).orderBy(desc(marketSnapshots.ts)).limit(100);
    return buildMarketMap(rows, options?.symbols).slice(0, options?.limit ?? 15);
  }

  async getSourceHealth(): Promise<SourceHealth[]> {
    if (!this.database) return [];
    const rows = await this.database.db.select().from(sourceHealthSnapshots).orderBy(desc(sourceHealthSnapshots.checkedAt)).limit(100);
    const latest = new Map<string, typeof sourceHealthSnapshots.$inferSelect>();
    for (const row of rows) {
      if (!latest.has(row.sourceName)) latest.set(row.sourceName, row);
    }
    return Array.from(latest.values()).map(mapSourceHealth);
  }

  async getAdminAnalyticsSummary(window: WindowKey = '24h'): Promise<AdminAnalyticsSummary> {
    if (!this.database) {
      return {
        window,
        totalRequests: 0,
        humanRequests: 0,
        botRequests: 0,
        topHumanPaths: [],
        topBotAgents: [],
        topReferrers: [],
      };
    }

    const since = windowStart(window);
    const rows = await this.database.db.select().from(requestEvents).where(gte(requestEvents.ts, since));

    const totalRequests = rows.length;
    const humanRequests = rows.filter((row) => !row.isBot).length;
    const botRequests = totalRequests - humanRequests;

    const pathMap = new Map<string, number>();
    const botAgentMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();

    for (const row of rows) {
      if (!row.isBot) pathMap.set(row.path, (pathMap.get(row.path) ?? 0) + 1);
      if (row.isBot && row.ua) botAgentMap.set(row.ua, (botAgentMap.get(row.ua) ?? 0) + 1);
      if (row.referer) referrerMap.set(row.referer, (referrerMap.get(row.referer) ?? 0) + 1);
    }

    const topHumanPaths = Array.from(pathMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
    const topBotAgents = Array.from(botAgentMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ua, count]) => ({ ua, count }));
    const topReferrers = Array.from(referrerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([referer, count]) => ({ referer, count }));

    return {
      window,
      totalRequests,
      humanRequests,
      botRequests,
      topHumanPaths,
      topBotAgents,
      topReferrers,
    };
  }

  async logRequestEvent(input: RequestEventInput): Promise<void> {
    if (!this.database) return;
    await this.database.db.insert(requestEvents).values({
      path: input.path,
      method: input.method,
      statusCode: input.statusCode,
      referer: input.referer,
      ua: input.ua,
      ipHash: input.ipHash,
      countryCode: input.countryCode,
      isBot: input.isBot,
      botReason: input.botReason,
      sessionId: input.sessionId,
    });
  }

  async createIngestRun(workerName: string, sourceName?: string): Promise<string> {
    if (!this.database) return randomUUID();
    const rows = await this.database.db
      .insert(ingestRuns)
      .values({ workerName, sourceName })
      .returning({ id: ingestRuns.id });
    const row = rows[0];
    if (!row) {
      throw new Error('Failed to create ingest run.');
    }
    return row.id;
  }

  async finishIngestRun(options: {
    id: string;
    status: 'ok' | 'partial' | 'failed';
    recordsFetched: number;
    recordsWritten: number;
    errors?: string[];
  }): Promise<void> {
    if (!this.database) return;
    const finishedAt = new Date();
    // Fetch the run's startedAt to compute real duration
    const run = await this.database.db.query.ingestRuns.findFirst({ where: eq(ingestRuns.id, options.id) });
    const durationMs = run ? finishedAt.getTime() - run.startedAt.getTime() : 0;
    await this.database.db
      .update(ingestRuns)
      .set({
        status: options.status,
        recordsFetched: options.recordsFetched,
        recordsWritten: options.recordsWritten,
        errorsJson: options.errors ?? [],
        finishedAt,
        durationMs,
      })
      .where(eq(ingestRuns.id, options.id));
  }

  async saveSourceItems(items: Array<Omit<SourceItem, 'id'>>): Promise<void> {
    if (!this.database || items.length === 0) return;
    await this.database.db
      .insert(sourceItems)
      .values(
        items.map((item) => ({
          sourceName: item.sourceName,
          sourceKind: item.sourceKind,
          sourceType: item.sourceType,
          externalId: item.externalId,
          fetchedAt: new Date(item.fetchedAt),
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          url: item.url,
          title: item.title,
          bodyText: item.bodyText,
          rawJson: item.rawJson,
          language: item.language,
          hash: item.hash,
          ingestRunId: item.ingestRunId,
          confidence: item.confidence,
          reviewStatus: item.reviewStatus,
        })),
      )
      .onConflictDoNothing();
  }

  async saveNormalizedRecords(records: NormalizedRecord[]): Promise<number> {
    if (!this.database || records.length === 0) return 0;

    let written = 0;
    const eventRecords = records.filter((record): record is NormalizedEventCandidate => record.kind === 'event_candidate');
    const marketRecords = records.filter((record): record is MarketSignal => record.kind === 'market_signal');
    const indicatorRecords = records.filter((record): record is IndicatorSignal => record.kind === 'indicator');
    const assetRecords = records.filter((record): record is AssetTrack => record.kind === 'asset_track');
    const hotspotRecords = records.filter((record): record is HotspotSignal => record.kind === 'hotspot');

    if (eventRecords.length) {
      await this.database.db
        .insert(events)
        .values(
          eventRecords.map((record) => ({
            fingerprint: stableHash({ sourceName: record.sourceName, externalId: record.externalId }),
            eventType: record.eventType,
            eventSubtype: record.eventSubtype,
            title: record.title,
            summary: record.summary ?? record.body,
            occurredAt: record.occurredAt ? new Date(record.occurredAt) : record.publishedAt ? new Date(record.publishedAt) : null,
            lat: record.lat,
            lon: record.lon,
            geomPoint: record.lat !== undefined && record.lon !== undefined ? `SRID=4326;POINT(${record.lon} ${record.lat})` : null,
            severityScore: scoreSeverity(record),
            confidence: record.confidence,
            sourceType: record.sourceType,
            reviewStatus: record.reviewStatus,
            sourceCount: 1,
            casualtyKilled: record.killed ?? null,
            casualtyInjured: record.injured ?? null,
            assetsAffected: record.damageSummary ?? null,
            tags: record.tags,
            marketRelevanceScore: scoreMarketRelevance(record),
            provenance: toProvenance(record),
          })),
        )
        .onConflictDoUpdate({
          target: events.fingerprint,
          set: {
            title: sql`excluded.title`,
            summary: sql`excluded.summary`,
            severityScore: sql`excluded.severity_score`,
            marketRelevanceScore: sql`excluded.market_relevance_score`,
            sourceCount: sql`excluded.source_count`,
            updatedAt: new Date(),
          },
        });

      await this.database.db
        .insert(timelineEntries)
        .values(
          eventRecords.map((record) => ({
            fingerprint: stableHash({ type: 'timeline', sourceName: record.sourceName, externalId: record.externalId }),
            entryType: record.eventType ?? 'event',
            title: record.title,
            occurredAt: record.occurredAt ? new Date(record.occurredAt) : record.publishedAt ? new Date(record.publishedAt) : new Date(),
            severityScore: scoreSeverity(record),
            marketRelevanceScore: scoreMarketRelevance(record),
            lat: record.lat,
            lon: record.lon,
            geomPoint: record.lat !== undefined && record.lon !== undefined ? `SRID=4326;POINT(${record.lon} ${record.lat})` : null,
            tags: record.tags,
            provenance: toProvenance(record),
            payload: record.raw ?? {},
          })),
        )
        .onConflictDoNothing();

      written += eventRecords.length;
    }

    if (marketRecords.length) {
      await this.database.db
        .insert(marketSnapshots)
        .values(
          marketRecords.map((record) => ({
            fingerprint: stableHash({ sourceName: record.sourceName, externalId: record.externalId, observedAt: record.observedAt }),
            externalId: record.externalId,
            symbol: record.symbol,
            assetClass: record.assetClass,
            ts: new Date(record.observedAt),
            price: String(record.price),
            changePct: record.changePct === undefined ? null : String(record.changePct),
            volume: record.volume === undefined ? null : String(record.volume),
            sourceName: record.sourceName,
            sourceType: record.sourceType,
            confidence: record.confidence,
            label: record.label,
            currency: record.currency,
            metadata: record.metadata ?? {},
          })),
        )
        .onConflictDoNothing();
      written += marketRecords.length;
    }

    if (indicatorRecords.length) {
      await this.database.db
        .insert(indicatorSnapshots)
        .values(
          indicatorRecords.map((record) => ({
            fingerprint: stableHash({ sourceName: record.sourceName, externalId: record.externalId, observedAt: record.observedAt }),
            externalId: record.externalId,
            metricKey: record.metricKey,
            ts: new Date(record.observedAt),
            valueNum: record.valueNum === undefined ? null : String(record.valueNum),
            valueText: record.valueText,
            sourceName: record.sourceName,
            sourceType: record.sourceType,
            confidence: record.confidence,
            regionKey: record.regionKey,
            label: record.label,
            metadata: record.metadata ?? {},
          })),
        )
        .onConflictDoNothing();
      written += indicatorRecords.length;
    }

    if (assetRecords.length) {
      await this.database.db
        .insert(assetTracks)
        .values(
          assetRecords.map((record) => ({
            fingerprint: stableHash({ sourceName: record.sourceName, externalId: record.externalId, observedAt: record.observedAt }),
            sourceName: record.sourceName,
            sourceType: record.sourceType,
            confidence: record.confidence,
            externalId: record.externalId,
            trackType: record.trackType,
            observedAt: new Date(record.observedAt),
            name: record.name,
            ident: record.ident,
            lat: record.lat,
            lon: record.lon,
            geomPoint: `SRID=4326;POINT(${record.lon} ${record.lat})`,
            heading: record.heading === undefined ? null : String(record.heading),
            speedKts: record.speedKts === undefined ? null : String(record.speedKts),
            altitudeFt: record.altitudeFt ?? null,
            metadata: record.metadata ?? {},
          })),
        )
        .onConflictDoNothing();
      written += assetRecords.length;
    }

    if (hotspotRecords.length) {
      await this.database.db
        .insert(hotspotSignals)
        .values(
          hotspotRecords.map((record) => ({
            fingerprint: stableHash({ sourceName: record.sourceName, externalId: record.externalId, observedAt: record.observedAt }),
            sourceName: record.sourceName,
            sourceType: record.sourceType,
            confidence: record.confidence,
            externalId: record.externalId,
            observedAt: new Date(record.observedAt),
            lat: record.lat,
            lon: record.lon,
            geomPoint: `SRID=4326;POINT(${record.lon} ${record.lat})`,
            instrument: record.instrument,
            brightness: record.brightness === undefined ? null : String(record.brightness),
            frp: record.frp === undefined ? null : String(record.frp),
            metadata: record.metadata ?? {},
          })),
        )
        .onConflictDoNothing();
      written += hotspotRecords.length;
    }

    return written;
  }

  async saveSourceHealth(entries: SourceHealth[]): Promise<void> {
    if (!this.database || entries.length === 0) return;
    await this.database.db.insert(sourceHealthSnapshots).values(
      entries.map((entry) => ({
        sourceName: entry.sourceName,
        sourceKind: entry.sourceKind,
        status: entry.status,
        message: entry.message,
        lastAttemptAt: entry.lastAttemptAt ? new Date(entry.lastAttemptAt) : null,
        lastSuccessAt: entry.lastSuccessAt ? new Date(entry.lastSuccessAt) : null,
        latencyMs: entry.latencyMs ?? null,
        recordsFetched: entry.recordsFetched ?? null,
        recordsWritten: entry.recordsWritten ?? null,
        detail: entry.detail ?? {},
      })),
    );
  }

  async saveBrief(brief: Omit<Brief, 'id'>): Promise<Brief> {
    if (!this.database) {
      return { id: randomUUID(), ...brief };
    }
    const rows = await this.database.db
      .insert(briefs)
      .values({
        scopeKey: brief.scopeKey,
        generatedAt: new Date(brief.generatedAt),
        modelName: brief.modelName,
        promptVersion: brief.promptVersion,
        structuredJson: brief.structuredJson,
        markdown: brief.markdown,
      })
      .returning();
    const row = rows[0];
    if (!row) {
      throw new Error('Failed to save brief.');
    }

    return {
      id: row.id,
      scopeKey: row.scopeKey,
      generatedAt: toIso(row.generatedAt),
      modelName: row.modelName,
      promptVersion: row.promptVersion,
      markdown: row.markdown,
      structuredJson: row.structuredJson,
    };
  }

  async generateAndSaveFallbackBrief(): Promise<Brief> {
    const summary = await this.getDashboardSummary();
    return this.saveBrief(buildFallbackBrief(summary));
  }

  async findAdminUserByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null> {
    if (!this.database) return null;
    const row = await this.database.db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
    if (!row) return null;
    return { id: row.id, email: row.email, passwordHash: row.passwordHash };
  }

  async createAdminSession(options: {
    tokenHash: string;
    email: string;
    expiresAt: string;
    adminUserId?: string;
    userAgent?: string;
    ipHash?: string;
  }): Promise<AdminSessionRecord> {
    if (!this.database) {
      return {
        id: randomUUID(),
        email: options.email,
        expiresAt: options.expiresAt,
      };
    }

    const rows = await this.database.db
      .insert(adminSessions)
      .values({
        tokenHash: options.tokenHash,
        adminUserId: options.adminUserId,
        subjectEmail: options.email,
        expiresAt: new Date(options.expiresAt),
        userAgent: options.userAgent,
        ipHash: options.ipHash,
      })
      .returning();
    const row = rows[0];
    if (!row) {
      throw new Error('Failed to create admin session.');
    }

    return {
      id: row.id,
      email: row.subjectEmail,
      expiresAt: toIso(row.expiresAt),
    };
  }

  async getAdminSession(tokenHash: string): Promise<AdminSessionRecord | null> {
    if (!this.database) return null;
    const row = await this.database.db.query.adminSessions.findFirst({ where: eq(adminSessions.tokenHash, tokenHash) });
    if (!row) return null;
    if (row.expiresAt.getTime() <= Date.now()) return null;
    return {
      id: row.id,
      email: row.subjectEmail,
      expiresAt: toIso(row.expiresAt),
    };
  }

  async deleteAdminSession(tokenHash: string): Promise<void> {
    if (!this.database) return;
    await this.database.db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
  }
}
