import process from 'node:process';
import { ensureLocalhostHttpsCertificate } from '../../client/scripts/localhost-https.mjs';
import { buildServer } from '../dist/app.js';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3001;

export function createServerServeRuntimeConfig(environment = process.env) {
  return {
    host: environment.HOST || DEFAULT_HOST,
    port: Number.parseInt(environment.PORT ?? '', 10) || DEFAULT_PORT,
  };
}

async function start() {
  const { certPath, keyPath } = await ensureLocalhostHttpsCertificate();
  const server = buildServer({
    https: {
      certPath,
      keyPath,
    },
  });
  const { host, port } = createServerServeRuntimeConfig();

  try {
    await server.listen({ host, port });
    server.log.info(`Realmfall server listening on https://${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
