import { Panel } from '../../components/panel';
import { getDashboardBundle, getMarketSignals } from '../../lib/api';

export default async function MarketsPage() {
  const [signals, dashboard] = await Promise.all([getMarketSignals(), getDashboardBundle()]);

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        <header>
          <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Investor Layer</div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-slate-50">Markets</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Tie event tempo to energy, ETF, dollar, rates, and broad-risk proxies without overstating causality.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Signal Board" eyebrow="Quotes">
            <div className="space-y-3">
              {signals.length ? (
                signals.map((signal) => (
                  <div key={signal.externalId} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
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
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-slate-500">
                  No market rows available yet.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Transmission Paths" eyebrow="Why Markets May Care">
            <div className="space-y-3 text-sm text-slate-300">
              {dashboard.summary.events.slice(0, 5).length ? (
                dashboard.summary.events.slice(0, 5).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                    <div className="font-medium text-slate-100">{event.title}</div>
                    <div className="mt-2 text-slate-400">
                      Market relevance {event.marketRelevanceScore}/100. Watch chokepoints, export terminals, and risk-off proxies around this cluster.
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-slate-500">
                  Event-to-market linkage cards will appear once normalized events are available.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
