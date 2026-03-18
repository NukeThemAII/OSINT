import type { AssetTrack, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';
import { z } from 'zod';

import type { SourceAdapter } from '../base';
import { buildQuery, fetchJson } from '../utils/http';

const openskyResponseSchema = z.object({
  states: z.array(z.array(z.any())).default([]),
});

export const openskyAdapter: SourceAdapter = {
  key: 'opensky',
  async fetchBatch(context) {
    const startedAt = Date.now();
    const fetchedAt = context.now().toISOString();
    const bbox = context.config.regionalBboxes[4] ?? context.config.regionalBboxes[0] ?? {
      west: 51,
      south: 23,
      east: 62.5,
      north: 29.5,
    };
    const url = `https://opensky-network.org/api/states/all?${buildQuery({
      lamin: bbox.south,
      lomin: bbox.west,
      lamax: bbox.north,
      lomax: bbox.east,
    })}`;

    const headers: HeadersInit = {};
    if (context.config.openskyClientId && context.config.openskyClientSecret) {
      headers.authorization = `Basic ${Buffer.from(`${context.config.openskyClientId}:${context.config.openskyClientSecret}`).toString('base64')}`;
    }

    const response = openskyResponseSchema.parse(
      await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2, headers }),
    );

    const normalizedRecords: AssetTrack[] = response.states
      .filter((state) => state[5] !== null && state[6] !== null)
      .map((state) => ({
        kind: 'asset_track',
        sourceName: 'OpenSky Network',
        sourceKind: 'air',
        sourceType: 'crowdsourced',
        confidence: 'medium',
        externalId: String(state[0]),
        trackType: 'aircraft',
        observedAt: state[4] ? new Date(Number(state[4]) * 1000).toISOString() : fetchedAt,
        ident: typeof state[1] === 'string' ? state[1].trim() : undefined,
        name: typeof state[2] === 'string' ? state[2] : undefined,
        lat: Number(state[6]),
        lon: Number(state[5]),
        heading: state[10] ? Number(state[10]) : undefined,
        speedKts: state[9] ? Number(state[9]) * 1.94384 : undefined,
        altitudeFt: state[7] ? Math.round(Number(state[7]) * 3.28084) : undefined,
        metadata: { raw: state },
      }));

    const sourceItems = normalizedRecords.map((record, index) => ({
      sourceName: 'OpenSky Network',
      sourceKind: 'air' as const,
      sourceType: 'crowdsourced' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.observedAt,
      url: undefined,
      title: record.ident ?? record.name ?? 'OpenSky aircraft track',
      bodyText: undefined,
      rawJson: response.states[index] ?? [],
      language: undefined,
      hash: stableHash(response.states[index] ?? record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    return {
      sourceKey: 'opensky',
      fetchedAt,
      rawItems: response.states,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'OpenSky Network',
        sourceKind: 'air',
        status: 'ok',
        lastAttemptAt: fetchedAt,
        lastSuccessAt: fetchedAt,
        latencyMs: Date.now() - startedAt,
        recordsFetched: response.states.length,
        recordsWritten: normalizedRecords.length,
        detail: { url },
      },
    };
  },
  async healthcheck(context) {
    return (await this.fetchBatch(context)).health;
  },
};
