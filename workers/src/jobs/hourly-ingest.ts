import { runAdapterBatch } from '../run-adapters';

export async function runHourlyIngest(): Promise<void> {
  await runAdapterBatch('worker-hourly-ingest', ['reliefweb', 'firms', 'wikimedia', 'eia', 'fred']);
}
