import { z } from 'zod';

import {
  assetTrackKindSchema,
  bboxSchema,
  confidenceSchema,
  marketAssetClassSchema,
  pointSchema,
  recordKindSchema,
  reviewStatusSchema,
  sourceKindSchema,
  sourceProvenanceSchema,
  sourceTypeSchema,
  timestampSchema,
} from './common';

export const normalizedEventCandidateSchema = z.object({
  kind: z.literal('event_candidate'),
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema.default('news'),
  sourceType: sourceTypeSchema,
  confidence: confidenceSchema,
  reviewStatus: reviewStatusSchema.default('normalized'),
  externalId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  summary: z.string().optional(),
  publishedAt: timestampSchema.optional(),
  occurredAt: timestampSchema.optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  placeName: z.string().optional(),
  countryCode: z.string().max(2).optional(),
  eventType: z.string().optional(),
  eventSubtype: z.string().optional(),
  tags: z.array(z.string()).default([]),
  killed: z.number().nullable().optional(),
  injured: z.number().nullable().optional(),
  damageSummary: z.string().nullable().optional(),
  urls: z.array(z.string().url()).default([]),
  raw: z.record(z.any()).optional(),
});

export const marketSignalSchema = z.object({
  kind: z.literal('market_signal'),
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema.default('market'),
  sourceType: sourceTypeSchema,
  confidence: confidenceSchema,
  externalId: z.string().min(1),
  symbol: z.string().min(1),
  assetClass: marketAssetClassSchema,
  observedAt: timestampSchema,
  label: z.string().optional(),
  currency: z.string().optional(),
  price: z.number(),
  changePct: z.number().optional(),
  volume: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const indicatorSignalSchema = z.object({
  kind: z.literal('indicator'),
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema.default('macro'),
  sourceType: sourceTypeSchema,
  confidence: confidenceSchema,
  externalId: z.string().min(1),
  metricKey: z.string().min(1),
  observedAt: timestampSchema,
  regionKey: z.string().optional(),
  label: z.string().optional(),
  valueNum: z.number().optional(),
  valueText: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const assetTrackSchema = z.object({
  kind: z.literal('asset_track'),
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema.default('air'),
  sourceType: sourceTypeSchema,
  confidence: confidenceSchema,
  externalId: z.string().min(1),
  trackType: assetTrackKindSchema,
  observedAt: timestampSchema,
  lat: z.number(),
  lon: z.number(),
  ident: z.string().optional(),
  name: z.string().optional(),
  heading: z.number().optional(),
  speedKts: z.number().optional(),
  altitudeFt: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const hotspotSignalSchema = z.object({
  kind: z.literal('hotspot'),
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema.default('satellite'),
  sourceType: sourceTypeSchema,
  confidence: confidenceSchema,
  externalId: z.string().min(1),
  observedAt: timestampSchema,
  lat: z.number(),
  lon: z.number(),
  instrument: z.string().optional(),
  brightness: z.number().optional(),
  frp: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const normalizedRecordSchema = z.discriminatedUnion('kind', [
  normalizedEventCandidateSchema,
  marketSignalSchema,
  indicatorSignalSchema,
  assetTrackSchema,
  hotspotSignalSchema,
]);

export const sourceItemSchema = z.object({
  id: z.string().uuid(),
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema,
  sourceType: sourceTypeSchema,
  externalId: z.string().min(1),
  fetchedAt: timestampSchema,
  publishedAt: timestampSchema.optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  bodyText: z.string().optional(),
  rawJson: z.record(z.any()),
  language: z.string().optional(),
  hash: z.string().min(1),
  ingestRunId: z.string().uuid().optional(),
  confidence: confidenceSchema,
  reviewStatus: reviewStatusSchema,
});

export const locationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  countryCode: z.string().max(2).optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
  geomPoint: pointSchema.optional(),
  geomBbox: bboxSchema.optional(),
  geocoderSource: z.string().optional(),
  precisionLevel: z.enum(['exact', 'city', 'admin1', 'country', 'unknown']),
});

export const eventSchema = z.object({
  id: z.string().uuid(),
  fingerprint: z.string().min(1),
  eventType: z.string().optional(),
  eventSubtype: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  occurredAt: timestampSchema.optional(),
  locationId: z.string().uuid().optional(),
  geomPoint: pointSchema.optional(),
  severityScore: z.number().int().min(0).max(100),
  confidence: confidenceSchema,
  sourceType: sourceTypeSchema,
  reviewStatus: reviewStatusSchema,
  sourceCount: z.number().int().min(0),
  casualtyKilled: z.number().int().min(0).nullable().optional(),
  casualtyInjured: z.number().int().min(0).nullable().optional(),
  assetsAffected: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  marketRelevanceScore: z.number().int().min(0).max(100),
  provenance: z.array(sourceProvenanceSchema).default([]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const eventClusterSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  clusterKind: z.string().min(1),
  center: pointSchema.optional(),
  bbox: bboxSchema.optional(),
  startedAt: timestampSchema.optional(),
  lastSeenAt: timestampSchema.optional(),
  severityScore: z.number().int().min(0).max(100),
  escalationScore: z.number().int().min(0).max(100),
  eventCount: z.number().int().min(0),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  marketRelevanceScore: z.number().int().min(0).max(100),
});

export const timelineEntrySchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  clusterId: z.string().uuid().optional(),
  entryType: z.string().min(1),
  title: z.string().min(1),
  occurredAt: timestampSchema,
  severityScore: z.number().int().min(0).max(100),
  escalationScore: z.number().int().min(0).max(100).optional(),
  marketRelevanceScore: z.number().int().min(0).max(100).optional(),
  geomPoint: pointSchema.optional(),
  tags: z.array(z.string()).default([]),
  provenance: z.array(sourceProvenanceSchema).default([]),
  payload: z.record(z.any()).optional(),
});

export const sourceHealthSchema = z.object({
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema,
  status: z.enum(['ok', 'degraded', 'error', 'disabled']),
  message: z.string().optional(),
  lastAttemptAt: timestampSchema.optional(),
  lastSuccessAt: timestampSchema.optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  recordsFetched: z.number().int().nonnegative().optional(),
  recordsWritten: z.number().int().nonnegative().optional(),
  detail: z.record(z.any()).optional(),
});

export const ingestRunSchema = z.object({
  id: z.string().uuid(),
  workerName: z.string().min(1),
  sourceName: z.string().optional(),
  startedAt: timestampSchema,
  finishedAt: timestampSchema.optional(),
  status: z.enum(['running', 'ok', 'partial', 'failed']),
  recordsFetched: z.number().int().nonnegative().default(0),
  recordsWritten: z.number().int().nonnegative().default(0),
  errors: z.array(z.string()).default([]),
  durationMs: z.number().int().nonnegative().optional(),
});

export const briefSchema = z.object({
  id: z.string().uuid(),
  scopeKey: z.string().min(1),
  generatedAt: timestampSchema,
  modelName: z.string().min(1),
  promptVersion: z.string().min(1),
  markdown: z.string().min(1),
  structuredJson: z.record(z.any()),
});

export const dashboardMetricSchema = z.object({
  label: z.string().min(1),
  score: z.number().int().min(0).max(100),
  band: z.enum(['low', 'elevated', 'significant', 'severe', 'critical']),
  delta: z.number().optional(),
  summary: z.string().optional(),
});

export const mapFeatureSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['event', 'cluster', 'asset_track', 'hotspot']),
  title: z.string().min(1),
  point: pointSchema,
  severityScore: z.number().int().min(0).max(100).optional(),
  confidence: confidenceSchema.optional(),
  occurredAt: timestampSchema.optional(),
  tags: z.array(z.string()).default([]),
});

export const adminAnalyticsSummarySchema = z.object({
  window: z.enum(['24h', '7d', '30d']),
  totalRequests: z.number().int().nonnegative(),
  humanRequests: z.number().int().nonnegative(),
  botRequests: z.number().int().nonnegative(),
  topHumanPaths: z.array(z.object({ path: z.string(), count: z.number().int().nonnegative() })),
  topBotAgents: z.array(z.object({ ua: z.string(), count: z.number().int().nonnegative() })),
  topReferrers: z.array(z.object({ referer: z.string(), count: z.number().int().nonnegative() })),
});

export const dashboardSummarySchema = z.object({
  generatedAt: timestampSchema,
  severity: dashboardMetricSchema,
  escalation: dashboardMetricSchema,
  latestBrief: briefSchema.nullable(),
  keyChanges: z.array(z.string()).default([]),
  events: z.array(eventSchema).default([]),
  clusters: z.array(eventClusterSchema).default([]),
  timeline: z.array(timelineEntrySchema).default([]),
  markets: z.array(marketSignalSchema).default([]),
  sourceHealth: z.array(sourceHealthSchema).default([]),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authSessionSchema = z.object({
  authenticated: z.boolean(),
  email: z.string().email().optional(),
  expiresAt: timestampSchema.optional(),
});

export type NormalizedEventCandidate = z.infer<typeof normalizedEventCandidateSchema>;
export type MarketSignal = z.infer<typeof marketSignalSchema>;
export type IndicatorSignal = z.infer<typeof indicatorSignalSchema>;
export type AssetTrack = z.infer<typeof assetTrackSchema>;
export type HotspotSignal = z.infer<typeof hotspotSignalSchema>;
export type NormalizedRecord = z.infer<typeof normalizedRecordSchema>;
export type SourceItem = z.infer<typeof sourceItemSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventCluster = z.infer<typeof eventClusterSchema>;
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;
export type SourceHealth = z.infer<typeof sourceHealthSchema>;
export type IngestRun = z.infer<typeof ingestRunSchema>;
export type Brief = z.infer<typeof briefSchema>;
export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type MapFeature = z.infer<typeof mapFeatureSchema>;
export type AdminAnalyticsSummary = z.infer<typeof adminAnalyticsSummarySchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
