import type {
  AdminAnalyticsSummary,
  AuthSession,
  Brief,
  DashboardSummary,
  Event,
  EventCluster,
  MapFeature,
  MarketSignal,
} from '@investor-intel/core';

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function emptySummary(): DashboardSummary {
  return {
    generatedAt: new Date().toISOString(),
    severity: { label: 'Regional severity', score: 0, band: 'low', summary: 'API unavailable.' },
    escalation: { label: 'Escalation tempo', score: 0, band: 'low', summary: 'API unavailable.' },
    latestBrief: null,
    keyChanges: [],
    events: [],
    clusters: [],
    timeline: [],
    markets: [],
    sourceHealth: [],
  };
}

async function fetchApi<T>(path: string, options?: { cookie?: string; noStore?: boolean }): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: options?.noStore ? 'no-store' : 'force-cache',
      headers: options?.cookie ? { cookie: options.cookie } : undefined,
      next: options?.noStore ? undefined : { revalidate: 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getDashboardBundle(): Promise<{ summary: DashboardSummary; mapItems: MapFeature[] }> {
  const [summaryResponse, mapResponse] = await Promise.all([
    fetchApi<{ data: DashboardSummary }>('/api/dashboard/summary'),
    fetchApi<{ data: { items: MapFeature[] } }>('/api/events/map'),
  ]);

  return {
    summary: summaryResponse?.data ?? emptySummary(),
    mapItems: mapResponse?.data.items ?? [],
  };
}

export async function getMarketSignals(): Promise<MarketSignal[]> {
  const response = await fetchApi<{ data: MarketSignal[] }>('/api/markets/signals');
  return response?.data ?? [];
}

export async function getBriefs(): Promise<Brief[]> {
  const response = await fetchApi<{ data: Brief[] }>('/api/briefs');
  return response?.data ?? [];
}

export async function getEvent(id: string): Promise<Event | null> {
  const response = await fetchApi<{ data: Event | null }>(`/api/events/${id}`);
  return response?.data ?? null;
}

export async function getCluster(id: string): Promise<EventCluster | null> {
  const response = await fetchApi<{ data: EventCluster | null }>(`/api/clusters/${id}`);
  return response?.data ?? null;
}

export async function getAdminSession(cookie?: string): Promise<AuthSession> {
  const response = await fetchApi<{ data: AuthSession }>('/api/admin/auth/session', { cookie, noStore: true });
  return response?.data ?? { authenticated: false };
}

export async function getAdminAnalytics(cookie?: string): Promise<AdminAnalyticsSummary | null> {
  const response = await fetchApi<{ data: AdminAnalyticsSummary }>('/api/admin/analytics/summary', { cookie, noStore: true });
  return response?.data ?? null;
}
