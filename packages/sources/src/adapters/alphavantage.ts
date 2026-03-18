import type { MarketSignal, SourceHealth } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { SourceAdapter } from '../base';
import { fetchJson } from '../utils/http';

export const alphaVantageAdapter: SourceAdapter = {
  key: 'alphavantage',
  async fetchBatch(context) {
    const fetchedAt = context.now().toISOString();
    if (!context.config.alphaVantageApiKey) {
      return {
        sourceKey: 'alphavantage',
        fetchedAt,
        rawItems: [],
        sourceItems: [],
        normalizedRecords: [],
        health: {
          sourceName: 'Alpha Vantage',
          sourceKind: 'market',
          status: 'disabled',
          message: 'ALPHA_VANTAGE_API_KEY is not configured.',
          lastAttemptAt: fetchedAt,
        },
      };
    }

    const startedAt = Date.now();
    const rawItems: unknown[] = [];
    const normalizedRecords: MarketSignal[] = [];

    for (const symbol of context.config.marketWatchlist) {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${context.config.alphaVantageApiKey}`;
      const response = (await fetchJson<unknown>(url, { timeoutMs: context.config.requestTimeoutMs, retries: 2 })) as any;
      rawItems.push({ symbol, response });
      const quote = response?.['Global Quote'];
      if (!quote?.['05. price']) continue;
      normalizedRecords.push({
        kind: 'market_signal',
        sourceName: 'Alpha Vantage',
        sourceKind: 'market',
        sourceType: 'official',
        confidence: 'medium',
        externalId: stableHash({ symbol, latestTradingDay: quote['07. latest trading day'] }),
        symbol,
        assetClass: 'etf',
        observedAt: `${quote['07. latest trading day']}T00:00:00Z`,
        label: symbol,
        currency: 'USD',
        price: Number(quote['05. price']),
        changePct: quote['10. change percent'] ? Number(String(quote['10. change percent']).replace('%', '')) : undefined,
        volume: quote['06. volume'] ? Number(quote['06. volume']) : undefined,
        metadata: { symbol },
      });
    }

    const sourceItems = normalizedRecords.map((record) => ({
      sourceName: 'Alpha Vantage',
      sourceKind: 'market' as const,
      sourceType: 'official' as const,
      externalId: record.externalId,
      fetchedAt,
      publishedAt: record.observedAt,
      url: undefined,
      title: `${record.symbol} quote`,
      bodyText: undefined,
      rawJson: record.metadata ?? {},
      language: 'en',
      hash: stableHash(record),
      confidence: record.confidence,
      reviewStatus: 'raw' as const,
    }));

    return {
      sourceKey: 'alphavantage',
      fetchedAt,
      rawItems,
      sourceItems,
      normalizedRecords,
      health: {
        sourceName: 'Alpha Vantage',
        sourceKind: 'market',
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
