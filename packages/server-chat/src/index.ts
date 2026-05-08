import process from 'node:process';
import { buildServer } from './app.js';
import { createChatMessageStore } from './chatService.js';
import { createChatListenUrl, createChatRuntimeConfig } from './runtime.js';
import { startChatNotificationServer } from './websocketServer.js';

async function start() {
  const runtimeConfig = createChatRuntimeConfig();
  const messageStore = createChatMessageStore();
  const notificationServer = await startChatNotificationServer({
    host: runtimeConfig.host,
    port: runtimeConfig.wsPort,
  });
  const server = buildServer({
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
