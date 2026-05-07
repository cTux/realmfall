import process from 'node:process';
import { ensureLocalhostHttpsCertificate } from '../../client/scripts/localhost-https.mjs';

async function start() {
  const [
    { buildServer },
    { createServerListenUrl, createServerRuntimeConfig },
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
  const { host, port } = createServerRuntimeConfig();

  try {
    await server.listen({ host, port });
    server.log.info(
      `Realmfall server listening on ${createServerListenUrl({ host, https: true, port })}`,
    );
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
