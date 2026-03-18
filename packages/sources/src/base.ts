import type { Logger } from 'pino';

import type { NormalizedRecord, SourceHealth, SourceItem } from '@investor-intel/core';

import type { SourceRuntimeConfig } from './config';

export interface SourceAdapterContext {
  config: SourceRuntimeConfig;
  logger: Pick<Logger, 'info' | 'warn' | 'error' | 'debug'>;
  now: () => Date;
}

export interface SourceBatch<TRaw = unknown> {
  sourceKey: string;
  fetchedAt: string;
  rawItems: TRaw[];
  sourceItems: Array<Omit<SourceItem, 'id'>>;
  normalizedRecords: NormalizedRecord[];
  health: SourceHealth;
}

export interface SourceAdapter<TRaw = unknown, TParams = void> {
  key: string;
  fetchBatch(context: SourceAdapterContext, params?: TParams): Promise<SourceBatch<TRaw>>;
  healthcheck(context: SourceAdapterContext): Promise<SourceHealth>;
}
