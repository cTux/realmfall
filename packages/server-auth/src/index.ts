import { buildServer } from './app.js';
import {
  createAuthListenUrl,
  createAuthRuntimeConfig,
} from './runtime.js';

async function start() {
  const server = buildServer();
  const { host, port } = createAuthRuntimeConfig();

  try {
    await server.listen({ host, port });
    server.log.info(`Realmfall auth server listening on ${createAuthListenUrl({ host, port })}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
