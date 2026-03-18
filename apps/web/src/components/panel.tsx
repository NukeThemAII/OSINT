import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export function Panel(props: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        'rounded-[28px] border border-slate-800/80 bg-slate-950/70 p-5 shadow-panel backdrop-blur',
        props.className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          {props.eyebrow ? <div className="text-[11px] uppercase tracking-[0.28em] text-sky-300/70">{props.eyebrow}</div> : null}
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-slate-100">{props.title}</h2>
        </div>
      </div>
      {props.children}
    </section>
  );
}
