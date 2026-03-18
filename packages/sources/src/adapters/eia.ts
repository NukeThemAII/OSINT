import type { IndicatorSignal, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { SourceAdapter } from '../base';
import { fetchJson } from '../utils/http';

export const eiaAdapter: SourceAdapter = {
  key: 'eia',
  async fetchBatch(context) {
    const fetchedAt = context.now().toISOString();
    if (!context.config.eiaApiKey) {
      return {
        sourceKey: 'eia',
        fetchedAt,
        rawItems: [],
        sourceItems: [],
        normalizedRecords: [],
        health: {
          sourceName: 'EIA',
          sourceKind: 'energy',
          status: 'disabled',
          message: 'EIA_API_KEY is not configured.',
          lastAttemptAt: fetchedAt,
        },
      };
    }

    const startedAt = Date.now();
    const rawItems: unknown[] = [];
    const normalizedRecords: IndicatorSignal[] = [];

    for (const series of context.config.eiaSeries) {
      const url = `https://api.eia.gov/series/?api_key=${context.config.eiaApiKey}&series_id=${encodeURIComponent(series)}`;
      const response = (await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 })) as any;
      rawItems.push({ series, response });
      const point = response?.series?.[0]?.data?.[0];
      if (!point) continue;
      normalizedRecords.push({
        kind: 'indicator',
        sourceName: 'EIA',
        sourceKind: 'energy',
        sourceType: 'official',
        confidence: 'high',
        externalId: stableHash({ series, point }),
        metricKey: series,
        observedAt: `${String(point[0]).slice(0, 4)}-01-01T00:00:00Z`,
        label: response?.series?.[0]?.name ?? series,
        valueNum: Number(point[1]),
        metadata: { series },
      });
    }

    const sourceItems = normalizedRecords.map((record) => ({
      sourceName: 'EIA',
      sourceKind: 'energy' as const,
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
      sourceKey: 'eia',
      fetchedAt,
      rawItems,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'EIA',
        sourceKind: 'energy',
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
