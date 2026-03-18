import { lt } from 'drizzle-orm';

import { adminSessions, requestEvents } from '@investor-intel/db';

import { createWorkerContext } from '../context';

export async function runCleanup(): Promise<void> {
  const { logger, database } = createWorkerContext('worker-cleanup');
  if (!database) {
    logger.info('DATABASE_URL is not configured; cleanup skipped.');
    return;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await database.db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
  await database.db.delete(requestEvents).where(lt(requestEvents.ts, thirtyDaysAgo));
  logger.info('Expired admin sessions and old request analytics removed.');
}
