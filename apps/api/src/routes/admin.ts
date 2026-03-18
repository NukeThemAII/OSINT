import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AppRepository } from '@investor-intel/db';
import { adminAnalyticsResponseSchema, authSessionResponseSchema, loginRequestSchema } from '@investor-intel/core';
import { stableHash } from '@investor-intel/core/hashing';

import type { ApiEnv } from '../env';
import { AuthService } from '../services/auth-service';

async function getSignedCookieValue(request: FastifyRequest, env: ApiEnv): Promise<string | undefined> {
  const rawValue = request.cookies[env.SESSION_COOKIE_NAME];
  if (!rawValue) return undefined;
  const unsigned = request.unsignCookie(rawValue);
  return unsigned.valid ? unsigned.value : undefined;
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authService: AuthService,
  env: ApiEnv,
): Promise<void> {
  async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = await getSignedCookieValue(request, env);
    const session = await authService.getSession(token);
    if (!session.authenticated) {
      return reply.code(401).send({ error: 'Unauthorized' }) as unknown as void;
    }
  }

  app.get('/api/admin/auth/session', async (request) => {
    const token = await getSignedCookieValue(request, env);
    return {
      data: authSessionResponseSchema.shape.data.parse(await authService.getSession(token)),
    };
  });

  app.post('/api/admin/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = loginRequestSchema.parse(request.body);
    const ipHash = request.ip ? stableHash(request.ip) : undefined;
    const result = await authService.login({
      email: input.email,
      password: input.password,
      userAgent: request.headers['user-agent'],
      ipHash,
    });

    if (!result) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    reply.setCookie(env.SESSION_COOKIE_NAME, result.token, {
      path: '/',
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      expires: result.session.expiresAt ? new Date(result.session.expiresAt) : undefined,
    });

    return { data: result.session };
  });

  app.post('/api/admin/auth/logout', async (request, reply) => {
    const token = await getSignedCookieValue(request, env);
    await authService.logout(token);
    reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
    return { data: { ok: true } };
  });

  app.get('/api/admin/analytics/summary', { preHandler: requireAdmin }, async (request) => {
    const window = ((request.query as { window?: '24h' | '7d' | '30d' }).window ?? '24h');
    return {
      data: adminAnalyticsResponseSchema.shape.data.parse(await repository.getAdminAnalyticsSummary(window)),
    };
  });
}
