import { z } from 'zod';

export const timestampSchema = z.string().min(1);

export const sourceTypeSchema = z.enum([
  'official',
  'humanitarian',
  'news',
  'crowdsourced',
  'satellite-derived',
  'inferred',
]);

export const confidenceSchema = z.enum(['low', 'medium', 'high']);
export const reviewStatusSchema = z.enum(['raw', 'normalized', 'clustered', 'analyst_reviewed']);
export const sourceKindSchema = z.enum([
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
export const recordKindSchema = z.enum([
  'event_candidate',
  'market_signal',
  'indicator',
  'asset_track',
  'hotspot',
]);
export const assetTrackKindSchema = z.enum(['aircraft', 'vessel']);
export const marketAssetClassSchema = z.enum([
  'commodity',
  'equity',
  'etf',
  'fx',
  'rate',
  'volatility',
  'index',
  'shipping',
]);
export const ingestStatusSchema = z.enum(['ok', 'partial', 'failed']);

export const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const bboxSchema = z.object({
  west: z.number().min(-180).max(180),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  north: z.number().min(-90).max(90),
});

export const sourceProvenanceSchema = z.object({
  sourceName: z.string().min(1),
  sourceKind: sourceKindSchema,
  sourceType: sourceTypeSchema,
  externalId: z.string().min(1),
  url: z.string().url().optional(),
  retrievedAt: timestampSchema.optional(),
  confidence: confidenceSchema,
  reviewStatus: reviewStatusSchema,
});

export type Timestamp = z.infer<typeof timestampSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type SourceKind = z.infer<typeof sourceKindSchema>;
export type RecordKind = z.infer<typeof recordKindSchema>;
export type AssetTrackKind = z.infer<typeof assetTrackKindSchema>;
export type MarketAssetClass = z.infer<typeof marketAssetClassSchema>;
export type IngestStatus = z.infer<typeof ingestStatusSchema>;
export type Point = z.infer<typeof pointSchema>;
export type BoundingBox = z.infer<typeof bboxSchema>;
export type SourceProvenance = z.infer<typeof sourceProvenanceSchema>;
