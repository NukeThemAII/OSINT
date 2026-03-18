import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import type { BoundingBox, SourceProvenance } from '@investor-intel/core';

const geometry = customType<{ data: string; driverData: string; config: { type?: string; srid?: number } }>({
  dataType(config) {
    return `geometry(${config?.type ?? 'Geometry'}, ${config?.srid ?? 4326})`;
  },
});

const emptyTextArray = sql`ARRAY[]::text[]`;
const emptyJsonbObject = sql`'{}'::jsonb`;
const emptyJsonbArray = sql`'[]'::jsonb`;

export const sourceTypeEnum = pgEnum('source_type', [
  'official',
  'humanitarian',
  'news',
  'crowdsourced',
  'satellite-derived',
  'inferred',
]);
export const confidenceEnum = pgEnum('confidence', ['low', 'medium', 'high']);
export const reviewStatusEnum = pgEnum('review_status', ['raw', 'normalized', 'clustered', 'analyst_reviewed']);
export const ingestStatusEnum = pgEnum('ingest_status', ['running', 'ok', 'partial', 'failed']);
export const assetClassEnum = pgEnum('asset_class', ['commodity', 'equity', 'etf', 'fx', 'rate', 'volatility', 'index', 'shipping']);
export const trackTypeEnum = pgEnum('track_type', ['aircraft', 'vessel']);
export const sourceKindEnum = pgEnum('source_kind', [
  'news',
  'humanitarian',
  'satellite',
  'air',
  'maritime',
  'encyclopedic',
  'energy',
  'macro',
  'market',
  'ops',
]);

export const ingestRuns = pgTable(
  'ingest_run',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workerName: text('worker_name').notNull(),
    sourceName: text('source_name'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: ingestStatusEnum('status').default('running').notNull(),
    recordsFetched: integer('records_fetched').default(0).notNull(),
    recordsWritten: integer('records_written').default(0).notNull(),
    errorsJson: jsonb('errors_json').$type<string[]>().default(emptyJsonbArray).notNull(),
    durationMs: integer('duration_ms'),
  },
  (table) => ({
    workerStartedIdx: index('ingest_run_worker_started_idx').on(table.workerName, table.startedAt),
  }),
);

export const sourceItems = pgTable(
  'source_item',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceName: text('source_name').notNull(),
    sourceKind: sourceKindEnum('source_kind').notNull(),
    sourceType: sourceTypeEnum('source_type').notNull(),
    externalId: text('external_id').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    url: text('url'),
    title: text('title'),
    bodyText: text('body_text'),
    rawJson: jsonb('raw_json').$type<Record<string, unknown>>().notNull(),
    language: varchar('language', { length: 16 }),
    hash: varchar('hash', { length: 64 }).notNull(),
    ingestRunId: uuid('ingest_run_id').references(() => ingestRuns.id, { onDelete: 'set null' }),
    confidence: confidenceEnum('confidence').default('medium').notNull(),
    reviewStatus: reviewStatusEnum('review_status').default('raw').notNull(),
  },
  (table) => ({
    sourceExternalUnique: uniqueIndex('source_item_source_external_unique').on(table.sourceName, table.externalId),
    hashIdx: index('source_item_hash_idx').on(table.hash),
    fetchedIdx: index('source_item_fetched_idx').on(table.fetchedAt),
  }),
);

export const locations = pgTable(
  'location',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    countryCode: varchar('country_code', { length: 2 }),
    admin1: text('admin1'),
    admin2: text('admin2'),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    geomPoint: geometry('geom_point', { type: 'Point', srid: 4326 }),
    geomBbox: jsonb('geom_bbox').$type<BoundingBox | null>(),
    geocoderSource: text('geocoder_source'),
    precisionLevel: varchar('precision_level', { length: 32 }).default('unknown').notNull(),
  },
  (table) => ({
    countryIdx: index('location_country_idx').on(table.countryCode),
    geomIdx: index('location_geom_idx').using('gist', table.geomPoint),
  }),
);

export const events = pgTable(
  'event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    eventType: text('event_type'),
    eventSubtype: text('event_subtype'),
    title: text('title').notNull(),
    summary: text('summary'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }),
    locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    geomPoint: geometry('geom_point', { type: 'Point', srid: 4326 }),
    severityScore: integer('severity_score').default(0).notNull(),
    confidence: confidenceEnum('confidence').default('medium').notNull(),
    sourceType: sourceTypeEnum('source_type').default('news').notNull(),
    reviewStatus: reviewStatusEnum('review_status').default('normalized').notNull(),
    sourceCount: integer('source_count').default(1).notNull(),
    casualtyKilled: integer('casualty_killed'),
    casualtyInjured: integer('casualty_injured'),
    assetsAffected: text('assets_affected'),
    tags: text('tags').array().default(emptyTextArray).notNull(),
    marketRelevanceScore: integer('market_relevance_score').default(0).notNull(),
    provenance: jsonb('provenance').$type<SourceProvenance[]>().default(emptyJsonbArray).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    fingerprintUnique: uniqueIndex('event_fingerprint_unique').on(table.fingerprint),
    occurredIdx: index('event_occurred_idx').on(table.occurredAt),
    geomIdx: index('event_geom_idx').using('gist', table.geomPoint),
    severityIdx: index('event_severity_idx').on(table.severityScore),
  }),
);

export const eventSourceLinks = pgTable(
  'event_source_link',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    sourceItemId: uuid('source_item_id')
      .notNull()
      .references(() => sourceItems.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 24 }).default('primary').notNull(),
    extractionMethod: text('extraction_method').default('adapter').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.sourceItemId] }),
  }),
);

export const eventClusters = pgTable(
  'event_cluster',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    label: text('label').notNull(),
    clusterKind: text('cluster_kind').notNull(),
    centerLat: doublePrecision('center_lat'),
    centerLon: doublePrecision('center_lon'),
    centerGeom: geometry('center_geom', { type: 'Point', srid: 4326 }),
    bbox: jsonb('bbox').$type<BoundingBox | null>(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    severityScore: integer('severity_score').default(0).notNull(),
    escalationScore: integer('escalation_score').default(0).notNull(),
    eventCount: integer('event_count').default(0).notNull(),
    summary: text('summary'),
    tags: text('tags').array().default(emptyTextArray).notNull(),
    marketRelevanceScore: integer('market_relevance_score').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lastSeenIdx: index('event_cluster_last_seen_idx').on(table.lastSeenAt),
    centerGeomIdx: index('event_cluster_center_geom_idx').using('gist', table.centerGeom),
  }),
);

export const clusterEventLinks = pgTable(
  'cluster_event_link',
  {
    clusterId: uuid('cluster_id')
      .notNull()
      .references(() => eventClusters.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.clusterId, table.eventId] }),
  }),
);

export const marketSnapshots = pgTable(
  'market_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    externalId: text('external_id').notNull(),
    symbol: text('symbol').notNull(),
    assetClass: assetClassEnum('asset_class').notNull(),
    ts: timestamp('ts', { withTimezone: true }).notNull(),
    price: numeric('price', { precision: 18, scale: 6 }).notNull(),
    changePct: numeric('change_pct', { precision: 10, scale: 4 }),
    volume: numeric('volume', { precision: 20, scale: 4 }),
    sourceName: text('source_name').notNull(),
    sourceType: sourceTypeEnum('source_type').default('official').notNull(),
    confidence: confidenceEnum('confidence').default('medium').notNull(),
    label: text('label'),
    currency: varchar('currency', { length: 8 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(emptyJsonbObject).notNull(),
  },
  (table) => ({
    fingerprintUnique: uniqueIndex('market_snapshot_fingerprint_unique').on(table.fingerprint),
    symbolTsIdx: index('market_snapshot_symbol_ts_idx').on(table.symbol, table.ts),
  }),
);

export const indicatorSnapshots = pgTable(
  'indicator_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    externalId: text('external_id').notNull(),
    metricKey: text('metric_key').notNull(),
    ts: timestamp('ts', { withTimezone: true }).notNull(),
    valueNum: numeric('value_num', { precision: 18, scale: 6 }),
    valueText: text('value_text'),
    sourceName: text('source_name').notNull(),
    sourceType: sourceTypeEnum('source_type').default('official').notNull(),
    confidence: confidenceEnum('confidence').default('medium').notNull(),
    regionKey: text('region_key'),
    label: text('label'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(emptyJsonbObject).notNull(),
  },
  (table) => ({
    fingerprintUnique: uniqueIndex('indicator_snapshot_fingerprint_unique').on(table.fingerprint),
    metricTsIdx: index('indicator_snapshot_metric_ts_idx').on(table.metricKey, table.ts),
  }),
);

export const assetTracks = pgTable(
  'asset_track_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    sourceName: text('source_name').notNull(),
    sourceType: sourceTypeEnum('source_type').default('crowdsourced').notNull(),
    confidence: confidenceEnum('confidence').default('medium').notNull(),
    externalId: text('external_id').notNull(),
    trackType: trackTypeEnum('track_type').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    name: text('name'),
    ident: text('ident'),
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    geomPoint: geometry('geom_point', { type: 'Point', srid: 4326 }).notNull(),
    heading: numeric('heading', { precision: 10, scale: 2 }),
    speedKts: numeric('speed_kts', { precision: 10, scale: 2 }),
    altitudeFt: integer('altitude_ft'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(emptyJsonbObject).notNull(),
  },
  (table) => ({
    fingerprintUnique: uniqueIndex('asset_track_snapshot_fingerprint_unique').on(table.fingerprint),
    observedIdx: index('asset_track_snapshot_observed_idx').on(table.observedAt),
    geomIdx: index('asset_track_snapshot_geom_idx').using('gist', table.geomPoint),
  }),
);

export const hotspotSignals = pgTable(
  'hotspot_signal',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    sourceName: text('source_name').notNull(),
    sourceType: sourceTypeEnum('source_type').default('satellite-derived').notNull(),
    confidence: confidenceEnum('confidence').default('medium').notNull(),
    externalId: text('external_id').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    geomPoint: geometry('geom_point', { type: 'Point', srid: 4326 }).notNull(),
    instrument: text('instrument'),
    brightness: numeric('brightness', { precision: 12, scale: 4 }),
    frp: numeric('frp', { precision: 12, scale: 4 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(emptyJsonbObject).notNull(),
  },
  (table) => ({
    fingerprintUnique: uniqueIndex('hotspot_signal_fingerprint_unique').on(table.fingerprint),
    observedIdx: index('hotspot_signal_observed_idx').on(table.observedAt),
    geomIdx: index('hotspot_signal_geom_idx').using('gist', table.geomPoint),
  }),
);

export const timelineEntries = pgTable(
  'timeline_entry',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    clusterId: uuid('cluster_id').references(() => eventClusters.id, { onDelete: 'set null' }),
    entryType: text('entry_type').notNull(),
    title: text('title').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    severityScore: integer('severity_score').default(0).notNull(),
    escalationScore: integer('escalation_score'),
    marketRelevanceScore: integer('market_relevance_score'),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    geomPoint: geometry('geom_point', { type: 'Point', srid: 4326 }),
    tags: text('tags').array().default(emptyTextArray).notNull(),
    provenance: jsonb('provenance').$type<SourceProvenance[]>().default(emptyJsonbArray).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default(emptyJsonbObject).notNull(),
  },
  (table) => ({
    fingerprintUnique: uniqueIndex('timeline_entry_fingerprint_unique').on(table.fingerprint),
    occurredIdx: index('timeline_entry_occurred_idx').on(table.occurredAt),
  }),
);

export const briefs = pgTable(
  'brief',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeKey: text('scope_key').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
    modelName: text('model_name').notNull(),
    promptVersion: text('prompt_version').notNull(),
    structuredJson: jsonb('structured_json').$type<Record<string, unknown>>().notNull(),
    markdown: text('markdown').notNull(),
  },
  (table) => ({
    scopeGeneratedIdx: index('brief_scope_generated_idx').on(table.scopeKey, table.generatedAt),
  }),
);

export const requestEvents = pgTable(
  'request_event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    path: text('path').notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    statusCode: integer('status_code').notNull(),
    referer: text('referer'),
    ua: text('ua'),
    ipHash: varchar('ip_hash', { length: 64 }),
    countryCode: varchar('country_code', { length: 2 }),
    isBot: boolean('is_bot').default(false).notNull(),
    botReason: text('bot_reason'),
    sessionId: text('session_id'),
  },
  (table) => ({
    tsIdx: index('request_event_ts_idx').on(table.ts),
    pathIdx: index('request_event_path_idx').on(table.path),
  }),
);

export const sourceHealthSnapshots = pgTable(
  'source_health_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceName: text('source_name').notNull(),
    sourceKind: sourceKindEnum('source_kind').notNull(),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
    status: varchar('status', { length: 16 }).notNull(),
    message: text('message'),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    latencyMs: integer('latency_ms'),
    recordsFetched: integer('records_fetched'),
    recordsWritten: integer('records_written'),
    detail: jsonb('detail').$type<Record<string, unknown>>().default(emptyJsonbObject).notNull(),
  },
  (table) => ({
    sourceCheckedIdx: index('source_health_snapshot_source_checked_idx').on(table.sourceName, table.checkedAt),
  }),
);

export const adminUsers = pgTable(
  'admin_user',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    role: varchar('role', { length: 24 }).default('admin').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
  },
  (table) => ({
    emailUnique: uniqueIndex('admin_user_email_unique').on(table.email),
  }),
);

export const adminSessions = pgTable(
  'admin_session',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    adminUserId: uuid('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
    subjectEmail: text('subject_email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    userAgent: text('user_agent'),
    ipHash: varchar('ip_hash', { length: 64 }),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex('admin_session_token_hash_unique').on(table.tokenHash),
    expiresIdx: index('admin_session_expires_idx').on(table.expiresAt),
  }),
);
