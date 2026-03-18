import { runAdapterBatch } from '../run-adapters';

export async function runFastRefresh(): Promise<void> {
  await runAdapterBatch('worker-fast-refresh', ['gdelt', 'opensky', 'aisstream', 'alphavantage']);
}
