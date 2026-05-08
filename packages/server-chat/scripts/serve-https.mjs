import process from 'node:process';
import { ensureLocalhostHttpsCertificate } from '../../client/scripts/localhost-https.mjs';

async function start() {
  const [
    { buildServer },
    { createChatMessageStore },
    { createChatListenUrl, createChatRuntimeConfig },
    { startChatNotificationServer },
  ] = await Promise.all([
    import('../dist/app.js'),
    import('../dist/chatService.js'),
    import('../dist/runtime.js'),
    import('../dist/websocketServer.js'),
  ]);
  const { certPath, keyPath } = await ensureLocalhostHttpsCertificate();
  const runtimeConfig = createChatRuntimeConfig();
  const notificationServer = await startChatNotificationServer({
    host: runtimeConfig.host,
    port: runtimeConfig.wsPort,
  });
  const server = buildServer({
    https: {
      certPath,
      keyPath,
    },
    messageStore: createChatMessageStore(),
    notifier: notificationServer,
    runtimeConfig,
  });

  try {
    await server.listen({
      host: runtimeConfig.host,
      port: runtimeConfig.port,
    });
    server.log.info(
      `Realmfall chat server listening on ${createChatListenUrl({
        host: runtimeConfig.host,
        https: true,
        port: runtimeConfig.port,
      })}`,
    );
    server.log.info(
      `Realmfall chat websocket listening on ${notificationServer.url}`,
    );
  } catch (error) {
    server.log.error(error);
    await notificationServer.close();
    process.exit(1);
  }
}

void start();
