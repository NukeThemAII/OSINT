import { notFound } from 'next/navigation';

import { MapSurface } from '../../../components/map-surface';
import { Panel } from '../../../components/panel';
import { getEvent } from '../../../lib/api';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const mapItems = event.geomPoint
    ? [{ id: event.id, kind: 'event' as const, title: event.title, point: event.geomPoint, severityScore: event.severityScore, tags: event.tags }]
    : [];

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <header>
          <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Event Detail</div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-slate-50">{event.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{event.summary ?? 'No summary attached yet.'}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Location" eyebrow="Map">
            <MapSurface items={mapItems} />
          </Panel>

          <Panel title="Structured Facts" eyebrow="Deterministic Fields">
            <div className="space-y-3 text-sm text-slate-300">
              <div>Severity: {event.severityScore}</div>
              <div>Market relevance: {event.marketRelevanceScore}</div>
              <div>Occurred at: {event.occurredAt ?? 'unknown'}</div>
              <div>Confidence: {event.confidence}</div>
              <div>Source count: {event.sourceCount}</div>
              <div>Tags: {event.tags.join(', ') || 'none'}</div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
