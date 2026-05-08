import { expect } from 'vitest';
import WebSocket from 'ws';
import { startChatNotificationServer } from '../websocketServer.js';

type JsonMessage = {
  latestMessageId: string;
  totalMessages: number;
  type: 'messages-available';
};

export class ChatWebSocketTestkit {
  readonly actions = {
    startServer: async () => {
      this.server = await startChatNotificationServer({
        host: '127.0.0.1',
        port: 0,
      });
    },
  };

  readonly expect = {
    broadcastsMessagesAvailableToAllClients: async () => {
      const [clientA, clientB] = await Promise.all([
        this.connectClient(),
        this.connectClient(),
      ]);

      try {
        const messagesPromise = Promise.all([
          this.readMessage(clientA),
          this.readMessage(clientB),
        ]);

        this.requireServer().broadcastMessagesAvailable({
          latestMessageId: 'message-4',
          totalMessages: 4,
          type: 'messages-available',
        });

        await expect(messagesPromise).resolves.toEqual([
          {
            latestMessageId: 'message-4',
            totalMessages: 4,
            type: 'messages-available',
          },
          {
            latestMessageId: 'message-4',
            totalMessages: 4,
            type: 'messages-available',
          },
        ]);
      } finally {
        await Promise.all([
          this.closeClient(clientA),
          this.closeClient(clientB),
        ]);
      }
    },
  };

  private server: Awaited<
    ReturnType<typeof startChatNotificationServer>
  > | null = null;

  async restore() {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }

  private async closeClient(client: WebSocket) {
    if (
      client.readyState === WebSocket.CLOSING ||
      client.readyState === WebSocket.CLOSED
    ) {
      return;
    }

    await new Promise<void>((resolve) => {
      client.once('close', () => resolve());
      client.close();
    });
  }

  private async connectClient() {
    const client = new WebSocket(this.requireServer().url);

    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    return client;
  }

  private readMessage(client: WebSocket) {
    return new Promise<JsonMessage>((resolve, reject) => {
      client.once('message', (data: WebSocket.RawData) => {
        try {
          resolve(JSON.parse(data.toString()) as JsonMessage);
        } catch (error) {
          reject(error);
        }
      });
      client.once('error', reject);
    });
  }

  private requireServer() {
    if (!this.server) {
      throw new Error('Expected startServer() to run before assertions.');
    }

    return this.server;
  }
}
