import type { FastifyInstance } from 'fastify';

import { AppRepository } from '@investor-intel/db';
import { clusterDetailResponseSchema, dashboardSummaryResponseSchema, eventDetailResponseSchema } from '@investor-intel/core';

import type { ApiEnv } from '../env';
import { renderOgCard } from '../services/og-card';

export async function registerPublicRoutes(app: FastifyInstance, repository: AppRepository, env: ApiEnv): Promise<void> {
  app.get('/health', async () => ({
    ok: true,
    dbConfigured: repository.configured,
    timestamp: new Date().toISOString(),
  }));

  app.get('/api/dashboard/summary', async () => ({
    data: dashboardSummaryResponseSchema.shape.data.parse(await repository.getDashboardSummary()),
  }));

  app.get('/api/events/map', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? '400');
    return {
      data: await repository.getMapFeatures({ limit }),
    };
  });

  app.get('/api/timeline', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? '100');
    return {
      data: await repository.getTimeline(limit),
    };
  });

  app.get('/api/markets/signals', async (request) => {
    const query = request.query as { symbols?: string; limit?: string };
    return {
      data: await repository.getMarketSignals({
        symbols: query.symbols ? query.symbols.split(',').map((symbol) => symbol.trim()) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      }),
    };
  });

  app.get('/api/sources/health', async () => ({
    data: await repository.getSourceHealth(),
  }));

  app.get('/api/events/:id', async (request, reply) => {
    const event = await repository.getEventDetail((request.params as { id: string }).id);
    if (!event) {
      reply.code(404);
    }
    return { data: eventDetailResponseSchema.shape.data.parse(event) };
  });

  app.get('/api/clusters/:id', async (request, reply) => {
    const cluster = await repository.getClusterDetail((request.params as { id: string }).id);
    if (!cluster) {
      reply.code(404);
    }
    return { data: clusterDetailResponseSchema.shape.data.parse(cluster) };
  });

  app.get('/api/briefs', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? '12');
    return {
      data: await repository.getLatestBriefs(limit),
    };
  });

  app.get('/og/dashboard.png', async (request, reply) => {
    const summary = await repository.getDashboardSummary();
    const png = await renderOgCard({
      cacheDir: env.OG_CACHE_DIR,
      cacheKey: 'dashboard',
      title: 'Iran Conflict Monitor',
      subtitle: summary.keyChanges[0] ?? 'Severity, escalation, sources, and market-sensitive context in one surface.',
      badge: `Severity ${summary.severity.score}`,
      footer: `Updated ${summary.generatedAt}`,
    });
    reply.type('image/png').send(png);
  });

  app.get('/og/events/:id.png', async (request, reply) => {
    const event = await repository.getEventDetail((request.params as { id: string }).id);
    const png = await renderOgCard({
      cacheDir: env.OG_CACHE_DIR,
      cacheKey: `event-${(request.params as { id: string }).id}`,
      title: event?.title ?? 'Event detail unavailable',
      subtitle: event?.summary ?? 'Open the dashboard for the latest normalized source context and market relevance.',
      badge: event ? `Severity ${event.severityScore}` : 'Awaiting data',
      footer: event?.occurredAt ?? new Date().toISOString(),
    });
    reply.type('image/png').send(png);
  });

  app.get('/og/clusters/:id.png', async (request, reply) => {
    const cluster = await repository.getClusterDetail((request.params as { id: string }).id);
    const png = await renderOgCard({
      cacheDir: env.OG_CACHE_DIR,
      cacheKey: `cluster-${(request.params as { id: string }).id}`,
      title: cluster?.label ?? 'Cluster detail unavailable',
      subtitle: cluster?.summary ?? 'Open the dashboard for the latest cluster timeline and supporting events.',
      badge: cluster ? `Escalation ${cluster.escalationScore}` : 'Awaiting data',
      footer: cluster?.lastSeenAt ?? new Date().toISOString(),
    });
    reply.type('image/png').send(png);
  });
}
