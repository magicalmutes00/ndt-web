import { buildApp, describeConfig, prepareApp } from "./app.js";
import { config } from "./env.js";
import { closePool } from "./db/index.js";

/**
 * API entry point.
 *
 * Boot order matters: `prepareApp` (migrations + content bootstrap) must finish
 * before the socket opens, so a fresh database is never observed in a
 * half-initialised state by a request.
 */
async function main(): Promise<void> {
  const app = await buildApp();

  for (const line of describeConfig()) app.log.info(`[config] ${line}`);

  await prepareApp(app);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`[server] ${signal} received, shutting down`);
    try {
      await app.close();
      await closePool();
      process.exit(0);
    } catch (error) {
      app.log.error(error);
      process.exit(1);
    }
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();
