import process from 'node:process';
import { buildServer } from './app.js';
import { createChatMessageStore } from './chatService.js';
import { createChatListenUrl, createChatRuntimeConfig } from './runtime.js';
import { startChatNotificationServer } from './websocketServer.js';

type LocalhostHttpsCertificate = {
  certPath: string;
  keyPath: string;
};

async function ensureChatServerLocalhostHttpsCertificate() {
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
  const { certPath, keyPath } =
    await ensureChatServerLocalhostHttpsCertificate();
  const runtimeConfig = createChatRuntimeConfig();
  const messageStore = createChatMessageStore();
  const notificationServer = await startChatNotificationServer({
    host: runtimeConfig.host,
    port: runtimeConfig.wsPort,
  });
  const server = buildServer({
    https: {
      certPath,
      keyPath,
    },
    messageStore,
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
