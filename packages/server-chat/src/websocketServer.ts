import type { AddressInfo } from 'node:net';
import WebSocket, { WebSocketServer } from 'ws';
import { createChatWebSocketUrl } from './runtime.js';

export type MessagesAvailableNotification = {
  latestMessageId: string;
  totalMessages: number;
  type: 'messages-available';
};

type StartChatNotificationServerOptions = {
  host: string;
  port: number;
};

export type ChatNotificationServer = {
  broadcastMessagesAvailable: (
    notification: MessagesAvailableNotification,
  ) => void;
  close: () => Promise<void>;
  port: number;
  url: string;
};

export async function startChatNotificationServer({
  host,
  port,
}: StartChatNotificationServerOptions): Promise<ChatNotificationServer> {
  const server = new WebSocketServer({
    host,
    port,
  });

  await new Promise<void>((resolve, reject) => {
    server.once('listening', () => resolve());
    server.once('error', reject);
  });

  const address = server.address() as AddressInfo;
  const resolvedPort = address.port;

  return {
    broadcastMessagesAvailable(notification) {
      const payload = JSON.stringify(notification);

      for (const client of server.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    port: resolvedPort,
    url: createChatWebSocketUrl({
      host,
      port: resolvedPort,
    }),
  };
}
