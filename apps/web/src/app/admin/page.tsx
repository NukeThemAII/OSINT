export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminLogoutButton } from '../../components/admin-logout-button';
import { Panel } from '../../components/panel';
import { getAdminAnalytics, getAdminSession, getDashboardBundle } from '../../lib/api';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const session = await getAdminSession(cookieHeader);

  if (!session.authenticated) {
    redirect('/admin/login');
  }

  const [analytics, dashboard] = await Promise.all([getAdminAnalytics(cookieHeader), getDashboardBundle()]);

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-sky-300/70">Operator Layer</div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-slate-50">Admin Console</h1>
            <div className="mt-2 text-sm text-slate-400">Authenticated as {session.email}</div>
          </div>
          <AdminLogoutButton />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Traffic Analytics" eyebrow="Humans vs Bots">
            {analytics ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Window</div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">{analytics.window}</div>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Human</div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">{analytics.humanRequests}</div>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Bot</div>
                  <div className="mt-2 text-xl font-semibold text-slate-100">{analytics.botRequests}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
                Admin analytics require the API and database to be reachable.
              </div>
            )}
          </Panel>

          <Panel title="Source Freshness" eyebrow="Recent Health">
            <div className="space-y-3">
              {dashboard.summary.sourceHealth.length ? (
                dashboard.summary.sourceHealth.map((item) => (
                  <div key={item.sourceName} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{item.sourceName}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.lastSuccessAt ?? item.message ?? 'No recent status'}</div>
                      </div>
                      <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
                  Source health snapshots will appear here once the worker jobs run.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
