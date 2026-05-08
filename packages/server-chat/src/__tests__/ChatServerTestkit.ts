import type { FastifyInstance } from 'fastify';
import { expect } from 'vitest';
import type { GooglePlayerAuthService } from '@realmfall/server-auth/src/googleAuth.js';
import { GooglePlayerAuthError } from '@realmfall/server-auth/src/googleAuth.js';
import { buildServer, resolveHttpsServerOptions } from '../app.js';
import { createChatMessageStore, type ChatMessage } from '../chatService.js';
import { createHttpsFixture } from './utils/chatServerFixtures.js';

type HttpsFixture = ReturnType<typeof createHttpsFixture>;
type NotificationEvent = {
  latestMessageId: string;
  totalMessages: number;
  type: 'messages-available';
};

const DEFAULT_MESSAGES = [
  {
    createdAt: '2026-05-08T10:00:00.000Z',
    id: 'message-1',
    message: 'First hello.',
    name: 'Alice',
    userId: 'google-sub-1',
  },
  {
    createdAt: '2026-05-08T11:00:00.000Z',
    id: 'message-2',
    message: 'Second hello.',
    name: 'Borin',
    userId: 'google-sub-2',
  },
  {
    createdAt: '2026-05-08T12:00:00.000Z',
    id: 'message-3',
    message: 'Third hello.',
    name: 'Cyra',
    userId: 'google-sub-3',
  },
] as const satisfies readonly ChatMessage[];

function createStubGooglePlayerAuth(): GooglePlayerAuthService {
  return {
    async verifyPlayer(idToken) {
      if (idToken !== 'valid-player-token') {
        throw new GooglePlayerAuthError('Invalid Google ID token.', 401);
      }

      return {
        avatarUrl: 'https://example.com/avatar.png',
        displayName: 'Realmfall Player',
        email: 'player@example.com',
        emailVerified: true,
        googleSubject: 'google-sub-123',
      };
    },
  };
}

export class ChatServerTestkit {
  readonly actions = {
    buildServer: (serviceVersion = '0.2.470+abcdef123456') => {
      this.notificationEvents = [];
      this.remainingIds = ['message-1', 'message-2', 'message-3', 'message-4'];
      this.remainingTimestamps = [
        '2026-05-08T10:00:00.000Z',
        '2026-05-08T11:00:00.000Z',
        '2026-05-08T12:00:00.000Z',
        '2026-05-08T13:00:00.000Z',
      ];
      this.messageStore = createChatMessageStore({
        createId: () => this.shiftRequired(this.remainingIds, 'message id'),
        now: () =>
          new Date(this.shiftRequired(this.remainingTimestamps, 'timestamp')),
      });

      for (const message of DEFAULT_MESSAGES) {
        this.messageStore.addMessage({
          message: message.message,
          name: message.name,
          userId: message.userId,
        });
      }

      this.server = buildServer({
        auth: createStubGooglePlayerAuth(),
        messageStore: this.messageStore,
        notifier: {
          broadcastMessagesAvailable: (event) => {
            this.notificationEvents.push(event);
          },
        },
        runtimeConfig: {
          googleClientId: 'realmfall-web-client-id',
          host: 'localhost',
          port: 8443,
          wsPort: 8080,
        },
        serviceVersion,
      });
    },
    createHttpsFixture: () => createHttpsFixture(),
  };

  readonly expect = {
    httpsOptionsReadCertificateBuffers: (fixture: HttpsFixture) => {
      expect(
        resolveHttpsServerOptions({
          certPath: fixture.certPath,
          keyPath: fixture.keyPath,
        }),
      ).toEqual({
        cert: Buffer.from(fixture.cert),
        key: Buffer.from(fixture.key),
      });
    },
    messagesEndpointReturnsRecentMessages: async () => {
      const response = await this.requireServer().inject({
        method: 'GET',
        query: {
          limit: '2',
        },
        url: '/api/messages',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        messages: DEFAULT_MESSAGES.slice(1),
      });
    },
    postMessageRejectsInvalidPayloads: async () => {
      const response = await this.requireServer().inject({
        method: 'POST',
        payload: {
          idToken: 'valid-player-token',
          message: 'Realmfall is live.',
          name: '   ',
        },
        url: '/api/messages',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error:
          'Expected a request body with non-empty idToken, name, and message strings.',
      });
    },
    postMessageRejectsInvalidTokens: async () => {
      const response = await this.requireServer().inject({
        method: 'POST',
        payload: {
          idToken: 'invalid-player-token',
          message: 'Realmfall is live.',
          name: 'Morgana',
        },
        url: '/api/messages',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'Invalid Google ID token.',
      });
    },
    postMessageReportsMissingGoogleClientId: async () => {
      const server = buildServer({
        auth: createStubGooglePlayerAuth(),
        messageStore: createChatMessageStore(),
        notifier: {
          broadcastMessagesAvailable: () => undefined,
        },
        runtimeConfig: {
          googleClientId: null,
          host: 'localhost',
          port: 8443,
          wsPort: 8080,
        },
        serviceVersion: '0.2.470+abcdef123456',
      });

      try {
        const response = await server.inject({
          method: 'POST',
          payload: {
            idToken: 'valid-player-token',
            message: 'Realmfall is live.',
            name: 'Morgana',
          },
          url: '/api/messages',
        });

        expect(response.statusCode).toBe(503);
        expect(response.json()).toEqual({
          error: 'Google player auth is not configured.',
        });
      } finally {
        await server.close();
      }
    },
    postMessageStoresVerifiedMessageAndBroadcasts: async () => {
      const response = await this.requireServer().inject({
        method: 'POST',
        payload: {
          idToken: 'valid-player-token',
          message: '  Realmfall is live.  ',
          name: '  Morgana  ',
        },
        url: '/api/messages',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        message: {
          createdAt: '2026-05-08T13:00:00.000Z',
          id: 'message-4',
          message: 'Realmfall is live.',
          name: 'Morgana',
          userId: 'google-sub-123',
        },
      });
      expect(this.notificationEvents).toEqual([
        {
          latestMessageId: 'message-4',
          totalMessages: 4,
          type: 'messages-available',
        },
      ]);
    },
    versionEndpointMatchesConfiguredVersion: async (version: string) => {
      const response = await this.requireServer().inject({
        method: 'GET',
        url: '/api/version',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ version });
    },
  };

  private messageStore = createChatMessageStore();
  private notificationEvents: NotificationEvent[] = [];
  private remainingIds = ['message-1', 'message-2', 'message-3', 'message-4'];
  private remainingTimestamps = [
    '2026-05-08T10:00:00.000Z',
    '2026-05-08T11:00:00.000Z',
    '2026-05-08T12:00:00.000Z',
    '2026-05-08T13:00:00.000Z',
  ];
  private server: FastifyInstance | null = null;

  async restore() {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }

  private requireServer() {
    if (!this.server) {
      throw new Error('Expected buildServer() to run before assertions.');
    }

    return this.server;
  }

  private shiftRequired(values: string[], label: string) {
    const value = values.shift();

    if (!value) {
      throw new Error(`Expected a queued ${label}.`);
    }

    return value;
  }
}
