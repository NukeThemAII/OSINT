import { z } from 'zod';

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SESSION_COOKIE_NAME: z.string().default('investor_intel_admin'),
  SESSION_SECRET: z.string().min(32).default('change-me-before-production-session-secret-0000'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  OG_CACHE_DIR: z.string().default('data/og'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

let cachedEnv: ApiEnv | undefined;

export function loadApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = apiEnvSchema.parse(env);
  return cachedEnv;
}
