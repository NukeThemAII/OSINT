import type { SourceHealth } from '@investor-intel/core';
import { sourceAdaptersByKey } from '@investor-intel/sources';

import { createWorkerContext } from './context';

export async function runAdapterBatch(workerName: string, adapterKeys: string[]): Promise<void> {
  const { logger, repository, sourceContext } = createWorkerContext(workerName);

  for (const key of adapterKeys) {
    const adapter = sourceAdaptersByKey[key];
    if (!adapter) {
      logger.warn({ key }, 'Unknown adapter key');
      continue;
    }

    const ingestRunId = await repository.createIngestRun(workerName, key);

    try {
      logger.info({ adapter: key }, 'Fetching source batch');
      const batch = await adapter.fetchBatch(sourceContext);
      const sourceItems = batch.sourceItems.map((item) => ({ ...item, ingestRunId }));
      await repository.saveSourceItems(sourceItems);
      const recordsWritten = await repository.saveNormalizedRecords(batch.normalizedRecords);
      await repository.saveSourceHealth([
        {
          ...batch.health,
          recordsWritten,
        },
      ] satisfies SourceHealth[]);
      await repository.finishIngestRun({
        id: ingestRunId,
        status: batch.health.status === 'ok' ? 'ok' : batch.health.status === 'disabled' ? 'partial' : 'failed',
        recordsFetched: batch.health.recordsFetched ?? batch.rawItems.length,
        recordsWritten,
      });
      logger.info({ adapter: key, fetched: batch.rawItems.length, written: recordsWritten }, 'Completed source batch');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown adapter failure';
      logger.error({ adapter: key, error }, 'Source batch failed');
      await repository.saveSourceHealth([
        {
          sourceName: key,
          sourceKind: 'ops',
          status: 'error',
          message,
          lastAttemptAt: new Date().toISOString(),
        },
      ]);
      await repository.finishIngestRun({
        id: ingestRunId,
        status: 'failed',
        recordsFetched: 0,
        recordsWritten: 0,
        errors: [message],
      });
    }
  }
}
