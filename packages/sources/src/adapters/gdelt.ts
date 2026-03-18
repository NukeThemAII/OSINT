import type { NormalizedEventCandidate, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';
import { z } from 'zod';

import type { SourceAdapter } from '../base';
import { buildQuery, fetchJson } from '../utils/http';
import { inferEventType, inferTags } from '../utils/infer';

const gdeltResponseSchema = z.object({
  articles: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      seendate: z.string().optional(),
      sourcecountry: z.string().optional(),
      domain: z.string().optional(),
      language: z.string().optional(),
    }),
  ).default([]),
});

function parseGdeltTimestamp(value?: string): string | undefined {
  if (!value || value.length < 14) return undefined;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

export const gdeltAdapter: SourceAdapter = {
  key: 'gdelt',
  async fetchBatch(context) {
    const startedAt = Date.now();
    const query = buildQuery({
      query: context.config.gdeltQuery,
      mode: 'artlist',
      format: 'json',
      maxrecords: context.config.gdeltMaxRecords,
      sort: 'datedesc',
    });
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?${query}`;
    const response = gdeltResponseSchema.parse(
      await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 }),
    );

    const fetchedAt = context.now().toISOString();
    const normalizedRecords: NormalizedEventCandidate[] = response.articles.map((article) => {
      const title = article.title.trim();
      return {
        kind: 'event_candidate',
        sourceName: 'GDELT',
        sourceKind: 'news',
        sourceType: 'news',
        confidence: 'medium',
        reviewStatus: 'normalized',
        externalId: stableHash(article.url),
        title,
        summary: article.domain ? `Discovered via ${article.domain}` : undefined,
        publishedAt: parseGdeltTimestamp(article.seendate),
        countryCode: article.sourcecountry?.toUpperCase(),
        eventType: inferEventType(title),
        tags: inferTags(title),
        urls: [article.url],
        raw: article,
      };
    });

    const sourceItems = normalizedRecords.map((record, index) => ({
      sourceName: 'GDELT',
      sourceKind: 'news' as const,
      sourceType: 'news' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.publishedAt,
      url: record.urls[0],
      title: record.title,
      bodyText: record.summary,
      rawJson: response.articles[index] ?? {},
      language: response.articles[index]?.language,
      hash: stableHash(response.articles[index] ?? record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    const health: SourceHealth = {
      sourceName: 'GDELT',
      sourceKind: 'news',
      status: 'ok',
      lastAttemptAt: fetchedAt,
      lastSuccessAt: fetchedAt,
      latencyMs: Date.now() - startedAt,
      recordsFetched: response.articles.length,
      recordsWritten: normalizedRecords.length,
      detail: { url },
    };

    return {
      sourceKey: 'gdelt',
      fetchedAt,
      rawItems: response.articles,
      sourceItems,
      normalizedRecords,
      health,
    };
  },
  async healthcheck(context) {
    return (await this.fetchBatch(context)).health;
  },
};
