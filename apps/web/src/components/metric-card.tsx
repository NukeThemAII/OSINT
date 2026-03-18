import { clsx } from 'clsx';

export function MetricCard(props: {
  label: string;
  score: number;
  band: string;
  summary?: string;
  accent?: 'sky' | 'orange' | 'emerald';
}) {
  const accent = props.accent === 'orange' ? 'from-orange-500/25 to-orange-500/5 text-orange-200' : props.accent === 'emerald' ? 'from-emerald-500/25 to-emerald-500/5 text-emerald-200' : 'from-sky-500/25 to-sky-500/5 text-sky-200';

  return (
    <div className="rounded-[24px] border border-slate-800/70 bg-slate-950/70 p-5">
      <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{props.label}</div>
      <div className="mt-4 flex items-end gap-4">
        <div className={clsx('rounded-2xl bg-gradient-to-br px-4 py-3 font-[family-name:var(--font-display)] text-4xl font-semibold', accent)}>
          {props.score}
        </div>
        <div className="pb-2 text-xs uppercase tracking-[0.24em] text-slate-400">{props.band}</div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{props.summary ?? 'No summary available.'}</p>
    </div>
  );
}
