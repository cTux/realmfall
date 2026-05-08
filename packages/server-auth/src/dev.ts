import process from 'node:process';
import { buildServer } from './app.js';
import {
  createAuthListenUrl,
  createAuthRuntimeConfig,
} from './runtime.js';

type LocalhostHttpsCertificate = {
  certPath: string;
  keyPath: string;
};

async function ensureAuthServerLocalhostHttpsCertificate() {
  const moduleUrl = new URL(
    '../../client/scripts/localhost-https.mjs',
    import.meta.url,
  ).href;
  const { ensureLocalhostHttpsCertificate } = (await import(moduleUrl)) as {
    ensureLocalhostHttpsCertificate: () => Promise<LocalhostHttpsCertificate>;
  };

  return ensureLocalhostHttpsCertificate();
}

async function start() {
  const { certPath, keyPath } = await ensureAuthServerLocalhostHttpsCertificate();
  const server = buildServer({
    https: {
      certPath,
      keyPath,
    },
  });
  const { host, port } = createAuthRuntimeConfig();

  try {
    await server.listen({ host, port });
    server.log.info(
      `Realmfall auth server listening on ${createAuthListenUrl({ host, https: true, port })}`,
    );
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
