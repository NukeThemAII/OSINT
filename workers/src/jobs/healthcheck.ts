import type { SourceHealth } from '@investor-intel/core';
import { sourceAdapters } from '@investor-intel/sources';

import { createWorkerContext } from '../context';

export async function runHealthcheck(): Promise<void> {
  const { logger, repository, sourceContext } = createWorkerContext('worker-healthcheck');
  const healthEntries: SourceHealth[] = [];

  for (const adapter of sourceAdapters) {
    try {
      healthEntries.push(await adapter.healthcheck(sourceContext));
    } catch (error) {
      logger.error({ adapter: adapter.key, error }, 'Healthcheck failed');
      healthEntries.push({
        sourceName: adapter.key,
        sourceKind: 'ops',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown healthcheck failure',
        lastAttemptAt: new Date().toISOString(),
      });
    }
  }

  await repository.saveSourceHealth(healthEntries);
  logger.info({ services: healthEntries.length }, 'Healthcheck snapshot completed');
}
