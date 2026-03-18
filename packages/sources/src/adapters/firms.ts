import type { HotspotSignal, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { SourceAdapter } from '../base';
import { parseCsv } from '../utils/csv';
import { fetchText } from '../utils/http';

export const firmsAdapter: SourceAdapter = {
  key: 'firms',
  async fetchBatch(context) {
    const fetchedAt = context.now().toISOString();

    if (!context.config.firmsMapKey) {
      return {
        sourceKey: 'firms',
        fetchedAt,
        rawItems: [],
        sourceItems: [],
        normalizedRecords: [],
        health: {
          sourceName: 'NASA FIRMS',
          sourceKind: 'satellite',
          status: 'disabled',
          message: 'FIRMS_MAP_KEY is not configured.',
          lastAttemptAt: fetchedAt,
        },
      };
    }

    const startedAt = Date.now();
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${context.config.firmsMapKey}/${context.config.firmsSensor}/${context.config.firmsArea}/${context.config.firmsDays}`;
    const csvText = await fetchText(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 });
    const rawRows = parseCsv(csvText);

    const normalizedRecords: HotspotSignal[] = rawRows
      .filter((row) => row.latitude && row.longitude)
      .map((row) => ({
        kind: 'hotspot',
        sourceName: 'NASA FIRMS',
        sourceKind: 'satellite',
        sourceType: 'satellite-derived',
        confidence: 'medium',
        externalId: stableHash(row),
        observedAt: row.acq_date && row.acq_time
          ? `${row.acq_date}T${row.acq_time.padStart(4, '0').slice(0, 2)}:${row.acq_time.padStart(4, '0').slice(2, 4)}:00Z`
          : fetchedAt,
        lat: Number(row.latitude),
        lon: Number(row.longitude),
        instrument: row.instrument || context.config.firmsSensor,
        brightness: row.bright_ti4 ? Number(row.bright_ti4) : undefined,
        frp: row.frp ? Number(row.frp) : undefined,
        metadata: row,
      }));

    const sourceItems = normalizedRecords.map((record, index) => ({
      sourceName: 'NASA FIRMS',
      sourceKind: 'satellite' as const,
      sourceType: 'satellite-derived' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.observedAt,
      url: undefined,
      title: 'NASA FIRMS hotspot',
      bodyText: undefined,
      rawJson: rawRows[index] ?? {},
      language: undefined,
      hash: stableHash(rawRows[index] ?? record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    return {
      sourceKey: 'firms',
      fetchedAt,
      rawItems: rawRows,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'NASA FIRMS',
        sourceKind: 'satellite',
        status: 'ok',
        lastAttemptAt: fetchedAt,
        lastSuccessAt: fetchedAt,
        latencyMs: Date.now() - startedAt,
        recordsFetched: rawRows.length,
        recordsWritten: normalizedRecords.length,
        detail: { url },
      },
    };
  },
  async healthcheck(context) {
    return (await this.fetchBatch(context)).health;
  },
};
