import { runCleanup } from './jobs/cleanup';
import { runFastRefresh } from './jobs/fast-refresh';
import { runGenerateBrief } from './jobs/generate-brief';
import { runHealthcheck } from './jobs/healthcheck';
import { runHourlyIngest } from './jobs/hourly-ingest';

const command = process.argv[2];

async function main(): Promise<void> {
  switch (command) {
    case 'fast-refresh':
      await runFastRefresh();
      break;
    case 'hourly-ingest':
      await runHourlyIngest();
      break;
    case 'generate-brief':
      await runGenerateBrief();
      break;
    case 'cleanup':
      await runCleanup();
      break;
    case 'healthcheck':
      await runHealthcheck();
      break;
    default:
      throw new Error(`Unknown worker command: ${command ?? 'undefined'}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
