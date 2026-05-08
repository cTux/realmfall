import process from 'node:process';
import { ensureLocalhostHttpsCertificate } from '../../client/scripts/localhost-https.mjs';

async function start() {
  const [
    { buildServer },
    { createAuthListenUrl, createAuthRuntimeConfig },
  ] = await Promise.all([
    import('../dist/app.js'),
    import('../dist/runtime.js'),
  ]);
  const { certPath, keyPath } = await ensureLocalhostHttpsCertificate();
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
