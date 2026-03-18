import type { IndicatorSignal, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { SourceAdapter } from '../base';
import { fetchJson } from '../utils/http';

export const wikimediaAdapter: SourceAdapter = {
  key: 'wikimedia',
  async fetchBatch(context) {
    const startedAt = Date.now();
    const fetchedAt = context.now().toISOString();
    const end = new Date();
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endKey = end.toISOString().slice(0, 10).replaceAll('-', '');
    const startKey = start.toISOString().slice(0, 10).replaceAll('-', '');

    const rawItems: unknown[] = [];
    const normalizedRecords: IndicatorSignal[] = [];

    for (const page of context.config.wikimediaPages) {
      const encodedPage = encodeURIComponent(page.replaceAll(' ', '_'));
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodedPage}/daily/${startKey}/${endKey}`;
      const response = (await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 })) as { items?: Array<{ views?: number; timestamp?: string }> };
      rawItems.push({ page, response });
      for (const item of response.items ?? []) {
        if (!item.timestamp || item.views === undefined) continue;
        normalizedRecords.push({
          kind: 'indicator',
          sourceName: 'Wikimedia',
          sourceKind: 'encyclopedic',
          sourceType: 'inferred',
          confidence: 'low',
          externalId: stableHash({ page, timestamp: item.timestamp }),
          metricKey: 'wikipedia_pageviews',
          observedAt: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}T00:00:00Z`,
          regionKey: page,
          label: `Wikipedia pageviews: ${page}`,
          valueNum: item.views,
          metadata: { page },
        });
      }
    }

    const sourceItems = normalizedRecords.map((record) => ({
      sourceName: 'Wikimedia',
      sourceKind: 'encyclopedic' as const,
      sourceType: 'inferred' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.observedAt,
      url: undefined,
      title: record.label,
      bodyText: undefined,
      rawJson: record.metadata ?? {},
      language: 'en',
      hash: stableHash(record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    return {
      sourceKey: 'wikimedia',
      fetchedAt,
      rawItems,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'Wikimedia',
        sourceKind: 'encyclopedic',
        status: 'ok',
        lastAttemptAt: fetchedAt,
        lastSuccessAt: fetchedAt,
        latencyMs: Date.now() - startedAt,
        recordsFetched: rawItems.length,
        recordsWritten: normalizedRecords.length,
      },
    };
  },
  async healthcheck(context) {
    return (await this.fetchBatch(context)).health;
  },
};
