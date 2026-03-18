import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8">
      <div className="rounded-[28px] border border-slate-800/80 bg-slate-950/70 p-8 text-center shadow-panel backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Not Found</div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-slate-50">Signal not found</h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
          The requested event or cluster is not available yet. Return to the dashboard for the latest normalized view.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
