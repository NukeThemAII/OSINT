import WebSocket from 'ws';

import type { AssetTrack, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { SourceAdapter } from '../base';

export const aisstreamAdapter: SourceAdapter = {
  key: 'aisstream',
  async fetchBatch(context) {
    const fetchedAt = context.now().toISOString();

    if (!context.config.aisstreamApiKey) {
      return {
        sourceKey: 'aisstream',
        fetchedAt,
        rawItems: [],
        sourceItems: [],
        normalizedRecords: [],
        health: {
          sourceName: 'AISStream',
          sourceKind: 'maritime',
          status: 'disabled',
          message: 'AISSTREAM_API_KEY is not configured.',
          lastAttemptAt: fetchedAt,
        },
      };
    }

    const startedAt = Date.now();
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    const rawMessages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve();
      }, context.config.aisstreamSampleSeconds * 1000);

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            APIKey: context.config.aisstreamApiKey,
            BoundingBoxes: context.config.regionalBboxes.map((bbox) => [[bbox.south, bbox.west], [bbox.north, bbox.east]]),
            FilterMessageTypes: ['PositionReport'],
          }),
        );
      });

      ws.on('message', (message: WebSocket.RawData) => {
        try {
          rawMessages.push(JSON.parse(message.toString()));
        } catch {
          // Ignore malformed messages and keep the stream alive.
        }
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
      ws.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const normalizedRecords = rawMessages
      .map((message) => {
        const position = (message as any)?.Message?.PositionReport;
        const meta = (message as any)?.MetaData;
        if (!position || !meta) return null;
        const record: AssetTrack = {
          kind: 'asset_track' as const,
          sourceName: 'AISStream',
          sourceKind: 'maritime' as const,
          sourceType: 'crowdsourced' as const,
          confidence: 'medium' as const,
          externalId: String(meta.MMSI ?? meta.ShipID ?? stableHash(message)),
          trackType: 'vessel' as const,
          observedAt: meta.time_utc ? new Date(meta.time_utc).toISOString() : fetchedAt,
          ident: meta.CallSign,
          name: meta.ShipName,
          lat: Number(position.Latitude),
          lon: Number(position.Longitude),
          heading: position.Cog ? Number(position.Cog) : undefined,
          speedKts: position.Sog ? Number(position.Sog) : undefined,
          metadata: message as Record<string, unknown>,
        };
        return record;
      })
      .filter((record): record is AssetTrack => record !== null);

    const sourceItems = normalizedRecords.map((record, index) => ({
      sourceName: 'AISStream',
      sourceKind: 'maritime' as const,
      sourceType: 'crowdsourced' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.observedAt,
      url: undefined,
      title: record.name ?? record.ident ?? 'AIS vessel track',
      bodyText: undefined,
      rawJson: (rawMessages[index] as Record<string, unknown>) ?? {},
      language: undefined,
      hash: stableHash(rawMessages[index] ?? record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    return {
      sourceKey: 'aisstream',
      fetchedAt,
      rawItems: rawMessages,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'AISStream',
        sourceKind: 'maritime',
        status: 'ok',
        lastAttemptAt: fetchedAt,
        lastSuccessAt: fetchedAt,
        latencyMs: Date.now() - startedAt,
        recordsFetched: rawMessages.length,
        recordsWritten: normalizedRecords.length,
      },
    };
  },
  async healthcheck(context) {
    return (await this.fetchBatch(context)).health;
  },
};
