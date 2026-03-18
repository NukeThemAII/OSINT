import { createWorkerContext } from '../context';

export async function runGenerateBrief(): Promise<void> {
  const { logger, repository } = createWorkerContext('worker-generate-brief');
  const brief = await repository.generateAndSaveFallbackBrief();
  logger.info({ briefId: brief.id, scopeKey: brief.scopeKey }, 'Generated fallback brief');
}
