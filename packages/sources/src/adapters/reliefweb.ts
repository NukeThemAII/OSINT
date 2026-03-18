import type { NormalizedEventCandidate, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';
import { z } from 'zod';

import type { SourceAdapter } from '../base';
import { buildQuery, fetchJson } from '../utils/http';
import { inferEventType, inferTags } from '../utils/infer';

const reliefwebResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      fields: z.object({
        title: z.string(),
        body: z.string().optional(),
        date: z.object({ original: z.string().optional() }).optional(),
        primary_country: z.object({ iso3: z.string().optional(), name: z.string().optional() }).optional(),
        source: z.array(z.object({ shortname: z.string().optional() })).optional(),
        url_alias: z.string().optional(),
      }),
    }),
  ).default([]),
});

export const reliefwebAdapter: SourceAdapter = {
  key: 'reliefweb',
  async fetchBatch(context) {
    const startedAt = Date.now();
    const query = buildQuery({
      appname: context.config.reliefwebAppName,
      'query[value]': context.config.reliefwebQuery,
      limit: context.config.reliefwebMaxRecords,
      sort: 'date:desc',
    });
    const url = `https://api.reliefweb.int/v1/reports?${query}`;
    const response = reliefwebResponseSchema.parse(
      await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 }),
    );

    const fetchedAt = context.now().toISOString();
    const normalizedRecords: NormalizedEventCandidate[] = response.data.map((item) => {
      const title = item.fields.title.trim();
      return {
        kind: 'event_candidate',
        sourceName: 'ReliefWeb',
        sourceKind: 'humanitarian',
        sourceType: 'humanitarian',
        confidence: 'high',
        reviewStatus: 'normalized',
        externalId: String(item.id),
        title,
        body: item.fields.body,
        summary: item.fields.source?.[0]?.shortname ? `Report from ${item.fields.source[0].shortname}` : undefined,
        publishedAt: item.fields.date?.original,
        placeName: item.fields.primary_country?.name,
        countryCode: item.fields.primary_country?.iso3?.slice(0, 2).toUpperCase(),
        eventType: inferEventType(title),
        tags: inferTags(`${title} ${item.fields.body ?? ''}`),
        urls: item.fields.url_alias ? [`https://reliefweb.int${item.fields.url_alias}`] : [],
        raw: item,
      };
    });

    const sourceItems = normalizedRecords.map((record, index) => ({
      sourceName: 'ReliefWeb',
      sourceKind: 'humanitarian' as const,
      sourceType: 'humanitarian' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.publishedAt,
      url: record.urls[0],
      title: record.title,
      bodyText: record.body,
      rawJson: response.data[index] ?? {},
      language: 'en',
      hash: stableHash(response.data[index] ?? record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    const health: SourceHealth = {
      sourceName: 'ReliefWeb',
      sourceKind: 'humanitarian',
      status: 'ok',
      lastAttemptAt: fetchedAt,
      lastSuccessAt: fetchedAt,
      latencyMs: Date.now() - startedAt,
      recordsFetched: response.data.length,
      recordsWritten: normalizedRecords.length,
      detail: { url },
    };

    return {
      sourceKey: 'reliefweb',
      fetchedAt,
      rawItems: response.data,
      sourceItems,
      normalizedRecords,
      health,
    };
  },
  async healthcheck(context) {
    return (await this.fetchBatch(context)).health;
  },
};
