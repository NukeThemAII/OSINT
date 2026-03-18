import { z } from 'zod';

import {
  adminAnalyticsSummarySchema,
  authSessionSchema,
  dashboardSummarySchema,
  eventClusterSchema,
  eventSchema,
  mapFeatureSchema,
  marketSignalSchema,
  sourceHealthSchema,
  timelineEntrySchema,
} from './domain';
import { bboxSchema, timestampSchema } from './common';

export const mapEventsQuerySchema = z.object({
  from: timestampSchema.optional(),
  to: timestampSchema.optional(),
  bbox: bboxSchema.optional(),
  kinds: z.array(z.enum(['event', 'cluster', 'asset_track', 'hotspot'])).optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const timelineQuerySchema = z.object({
  from: timestampSchema.optional(),
  to: timestampSchema.optional(),
  limit: z.number().int().positive().max(500).optional(),
});

export const marketSignalsQuerySchema = z.object({
  symbols: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const apiEnvelopeSchema = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.object({
    data: schema,
    meta: z.record(z.any()).optional(),
  });

export const dashboardSummaryResponseSchema = apiEnvelopeSchema(dashboardSummarySchema);
export const mapEventsResponseSchema = apiEnvelopeSchema(
  z.object({ items: z.array(mapFeatureSchema), bbox: bboxSchema.optional() }),
);
export const timelineResponseSchema = apiEnvelopeSchema(z.array(timelineEntrySchema));
export const marketSignalsResponseSchema = apiEnvelopeSchema(z.array(marketSignalSchema));
export const sourceHealthResponseSchema = apiEnvelopeSchema(z.array(sourceHealthSchema));
export const adminAnalyticsResponseSchema = apiEnvelopeSchema(adminAnalyticsSummarySchema);
export const authSessionResponseSchema = apiEnvelopeSchema(authSessionSchema);
export const eventDetailResponseSchema = apiEnvelopeSchema(eventSchema.nullable());
export const clusterDetailResponseSchema = apiEnvelopeSchema(eventClusterSchema.nullable());
