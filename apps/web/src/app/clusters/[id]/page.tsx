import { notFound } from 'next/navigation';

import { MapSurface } from '../../../components/map-surface';
import { Panel } from '../../../components/panel';
import { getCluster } from '../../../lib/api';

export default async function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cluster = await getCluster(id);

  if (!cluster) notFound();

  const mapItems = cluster.center
    ? [{ id: cluster.id, kind: 'cluster' as const, title: cluster.label, point: cluster.center, severityScore: cluster.severityScore, tags: cluster.tags }]
    : [];

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <header>
          <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Cluster Detail</div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-slate-50">{cluster.label}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{cluster.summary ?? 'No summary attached yet.'}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Footprint" eyebrow="Map">
            <MapSurface items={mapItems} />
          </Panel>

          <Panel title="Cluster Metrics" eyebrow="Deterministic Fields">
            <div className="space-y-3 text-sm text-slate-300">
              <div>Severity: {cluster.severityScore}</div>
              <div>Escalation: {cluster.escalationScore}</div>
              <div>Market relevance: {cluster.marketRelevanceScore}</div>
              <div>Last seen: {cluster.lastSeenAt ?? 'unknown'}</div>
              <div>Event count: {cluster.eventCount}</div>
              <div>Tags: {cluster.tags.join(', ') || 'none'}</div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
