import type { IndicatorSignal, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { SourceAdapter } from '../base';
import { fetchJson } from '../utils/http';

export const fredAdapter: SourceAdapter = {
  key: 'fred',
  async fetchBatch(context) {
    const fetchedAt = context.now().toISOString();
    if (!context.config.fredApiKey) {
      return {
        sourceKey: 'fred',
        fetchedAt,
        rawItems: [],
        sourceItems: [],
        normalizedRecords: [],
        health: {
          sourceName: 'FRED',
          sourceKind: 'macro',
          status: 'disabled',
          message: 'FRED_API_KEY is not configured.',
          lastAttemptAt: fetchedAt,
        },
      };
    }

    const startedAt = Date.now();
    const rawItems: unknown[] = [];
    const normalizedRecords: IndicatorSignal[] = [];

    for (const series of context.config.fredSeries) {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(series)}&api_key=${context.config.fredApiKey}&file_type=json&sort_order=desc&limit=1`;
      const response = (await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 })) as any;
      rawItems.push({ series, response });
      const point = response?.observations?.[0];
      if (!point?.date || point.value === undefined || point.value === '.') continue;
      normalizedRecords.push({
        kind: 'indicator',
        sourceName: 'FRED',
        sourceKind: 'macro',
        sourceType: 'official',
        confidence: 'high',
        externalId: stableHash({ series, point }),
        metricKey: series,
        observedAt: `${point.date}T00:00:00Z`,
        label: series,
        valueNum: Number(point.value),
        metadata: { series },
      });
    }

    const sourceItems = normalizedRecords.map((record) => ({
      sourceName: 'FRED',
      sourceKind: 'macro' as const,
      sourceType: 'official' as const,
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
      sourceKey: 'fred',
      fetchedAt,
      rawItems,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'FRED',
        sourceKind: 'macro',
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
