import 'dotenv/config';

import pino from 'pino';

import { AppRepository, getDatabase } from '@investor-intel/db';
import { loadSourceRuntimeConfig, type SourceAdapterContext } from '@investor-intel/sources';

export function createWorkerContext(workerName: string) {
  const logger = pino({ name: workerName });
  const config = loadSourceRuntimeConfig();
  const repository = new AppRepository();
  const sourceContext: SourceAdapterContext = {
    config,
    logger,
    now: () => new Date(),
  };

  return {
    logger,
    config,
    repository,
    database: getDatabase(),
    sourceContext,
  };
}
