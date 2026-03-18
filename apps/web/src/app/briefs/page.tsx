import { Panel } from '../../components/panel';
import { getBriefs } from '../../lib/api';

export default async function BriefsPage() {
  const briefs = await getBriefs();

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <header>
          <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Narrative Layer</div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-slate-50">Briefs Archive</h1>
        </header>

        <Panel title="Generated Briefs" eyebrow="Deterministic Fallback + AI Ready">
          <div className="space-y-4">
            {briefs.length ? (
              briefs.map((brief) => (
                <article key={brief.id} className="rounded-[24px] border border-slate-800/70 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-100">{brief.scopeKey}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {brief.generatedAt} · {brief.modelName}
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                      {brief.promptVersion}
                    </div>
                  </div>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-950/80 p-4 font-[family-name:var(--font-mono)] text-xs leading-6 text-slate-300">
                    {brief.markdown}
                  </pre>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-8 text-sm text-slate-500">
                Run `npm run worker:summary` after ingest data is flowing to generate the first brief.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </main>
  );
}
