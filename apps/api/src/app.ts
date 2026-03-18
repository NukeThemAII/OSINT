import 'dotenv/config';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { isbot } from 'isbot';
import pino from 'pino';

import { AppRepository } from '@investor-intel/db';
import { stableHash } from '@investor-intel/core/hashing';

import { loadApiEnv } from './env';
import { registerAdminRoutes } from './routes/admin';
import { registerPublicRoutes } from './routes/public';
import { AuthService } from './services/auth-service';

export async function createApiApp() {
  const env = loadApiEnv();
  const logger = pino({ name: 'investor-intel-api' });
  const app = Fastify({ logger });
  const repository = new AppRepository();
  const authService = new AuthService(repository, env);

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  await app.register(cookie, { secret: env.SESSION_SECRET, hook: 'onRequest' });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.addHook('onResponse', async (request, reply) => {
    const ua = request.headers['user-agent'];
    const bot = Boolean(ua && isbot(ua));
    await repository.logRequestEvent({
      path: request.routeOptions.url ?? request.url,
      method: request.method,
      statusCode: reply.statusCode,
      referer: request.headers.referer,
      ua,
      ipHash: request.ip ? stableHash(request.ip) : undefined,
      isBot: bot,
      botReason: bot ? 'ua-match' : undefined,
      sessionId: request.cookies[env.SESSION_COOKIE_NAME],
    });
  });

  await registerPublicRoutes(app, repository, env);
  await registerAdminRoutes(app, repository, authService, env);

  return { app, env };
}
