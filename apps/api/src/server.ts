import { createApiApp } from './app';

async function main(): Promise<void> {
  const { app, env } = await createApiApp();
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
