import type { Brief, DashboardSummary, Event, MarketSignal } from '../schemas/domain';

import { scoreBand } from './scoring';

function summarizeEvent(event: Event): string {
  const occurredAt = event.occurredAt ? ` at ${event.occurredAt}` : '';
  return `- ${event.title}${occurredAt} [severity ${event.severityScore}/${scoreBand(event.severityScore)}]`;
}

function summarizeMarket(signal: MarketSignal): string {
  const delta = signal.changePct === undefined ? 'n/a' : `${signal.changePct.toFixed(2)}%`;
  return `- ${signal.symbol}: ${signal.price.toFixed(2)} (${delta})`;
}

export function buildFallbackBrief(summary: DashboardSummary): Omit<Brief, 'id'> {
  const topEvents = summary.events.slice(0, 5).map(summarizeEvent).join('\n');
  const topMarkets = summary.markets.slice(0, 5).map(summarizeMarket).join('\n');
  const markdown = [
    '# Iran Conflict Monitor Brief',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Severity: ${summary.severity.score} (${summary.severity.band})`,
    `Escalation: ${summary.escalation.score} (${summary.escalation.band})`,
    '',
    '## Key changes',
    ...(summary.keyChanges.length ? summary.keyChanges.map((line) => `- ${line}`) : ['- No material changes captured yet.']),
    '',
    '## Recent events',
    ...(topEvents ? topEvents.split('\n') : ['- No normalized events available yet.']),
    '',
    '## Market strip',
    ...(topMarkets ? topMarkets.split('\n') : ['- No market signals available yet.']),
  ].join('\n');

  return {
    scopeKey: 'iran-monitor:frontpage',
    generatedAt: summary.generatedAt,
    modelName: 'deterministic-template',
    promptVersion: 'fallback-v1',
    markdown,
    structuredJson: {
      severity: summary.severity,
      escalation: summary.escalation,
      keyChanges: summary.keyChanges,
      eventIds: summary.events.slice(0, 10).map((event) => event.id),
      marketSymbols: summary.markets.slice(0, 10).map((signal) => signal.symbol),
    },
  };
}
