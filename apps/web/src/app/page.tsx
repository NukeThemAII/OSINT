import Link from 'next/link';

import { Panel } from '../components/panel';
import { MetricCard } from '../components/metric-card';
import { MapSurface } from '../components/map-surface';
import { getDashboardBundle } from '../lib/api';

export default async function DashboardPage() {
  const { summary, mapItems } = await getDashboardBundle();

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="rounded-[32px] border border-slate-800/70 bg-slate-950/70 px-6 py-6 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Conflict / Markets / Provenance</div>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight text-slate-50 md:text-5xl">
                Investor Intel / Iran Conflict Monitor
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                A serious OSINT operating surface for regional escalation, chokepoints, aircraft, shipping, hotspots, and the market-sensitive transmission paths around them.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Updated</div>
                <div className="mt-2 font-[family-name:var(--font-mono)] text-sm text-slate-100">{summary.generatedAt}</div>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Events</div>
                <div className="mt-2 text-xl font-semibold text-slate-100">{summary.events.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Markets</div>
                <div className="mt-2 text-xl font-semibold text-slate-100">{summary.markets.length}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1.6fr_1.1fr]">
          <div className="space-y-6">
            <MetricCard label={summary.severity.label} score={summary.severity.score} band={summary.severity.band} summary={summary.severity.summary} accent="orange" />
            <MetricCard label={summary.escalation.label} score={summary.escalation.score} band={summary.escalation.band} summary={summary.escalation.summary} accent="sky" />
            <Panel title="Key Changes" eyebrow="Front Page Brief">
              <div className="space-y-3 text-sm text-slate-300">
                {summary.keyChanges.length ? summary.keyChanges.map((item) => <div key={item} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">{item}</div>) : <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-slate-500">Waiting for the first normalized changeset.</div>}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Operational Map" eyebrow="Primary Surface" className="overflow-hidden">
              <MapSurface items={mapItems} />
            </Panel>
            <Panel title="Timeline" eyebrow="Recent Activity">
              <div className="grid gap-3 md:grid-cols-2">
                {summary.timeline.length ? summary.timeline.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{entry.entryType}</div>
                    <div className="mt-2 font-medium text-slate-100">{entry.title}</div>
                    <div className="mt-2 font-[family-name:var(--font-mono)] text-xs text-slate-400">{entry.occurredAt}</div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">Timeline entries will appear here once ingest and normalization runs are writing to the database.</div>}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Latest Events" eyebrow="Normalized Feed">
              <div className="space-y-3">
                {summary.events.length ? summary.events.slice(0, 6).map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="block rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 transition hover:border-slate-600">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-100">{event.title}</div>
                        <div className="mt-2 text-xs text-slate-400">{event.occurredAt ?? 'Timestamp pending'} · {event.sourceCount} source(s)</div>
                      </div>
                      <div className="rounded-full bg-orange-500/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-orange-200">{event.severityScore}</div>
                    </div>
                  </Link>
                )) : <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">No normalized event rows yet.</div>}
              </div>
            </Panel>
            <Panel title="Market Impact" eyebrow="Investor Layer">
              <div className="space-y-3">
                {summary.markets.length ? summary.markets.slice(0, 6).map((signal) => (
                  <div key={signal.externalId} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-100">{signal.symbol}</div>
                        <div className="mt-1 text-xs text-slate-400">{signal.label ?? signal.assetClass}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-[family-name:var(--font-mono)] text-sm text-slate-100">{signal.price.toFixed(2)}</div>
                        <div className="mt-1 text-xs text-slate-400">{signal.changePct?.toFixed(2) ?? 'n/a'}%</div>
                      </div>
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">Configure the market adapters to populate this strip.</div>}
              </div>
            </Panel>
            <Panel title="Source Health" eyebrow="Operator Layer">
              <div className="space-y-3">
                {summary.sourceHealth.length ? summary.sourceHealth.slice(0, 6).map((item) => (
                  <div key={item.sourceName} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{item.sourceName}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.message ?? item.lastSuccessAt ?? 'No recent status message.'}</div>
                      </div>
                      <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">{item.status}</div>
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">Health snapshots will appear after the worker jobs run.</div>}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
