import { readFileSync } from 'node:fs';
import type { ServerOptions } from 'node:https';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import {
  GooglePlayerAuthError,
  createGooglePlayerAuth,
  type GooglePlayerAuthService,
} from '@realmfall/server-auth/src/googleAuth.js';
import {
  createChatMessageStore,
  type ChatMessageStore,
} from './chatService.js';
import { createChatRuntimeConfig, type ChatRuntimeConfig } from './runtime.js';
import { getChatServiceVersion } from './version.js';

type HttpsServerConfig = {
  certPath: string;
  keyPath: string;
};

type BuildChatServerOptions = {
  auth?: GooglePlayerAuthService;
  https?: HttpsServerConfig;
  messageStore?: ChatMessageStore;
  notifier?: {
    broadcastMessagesAvailable: (notification: {
      latestMessageId: string;
      totalMessages: number;
      type: 'messages-available';
    }) => void;
  };
  runtimeConfig?: ChatRuntimeConfig;
  serviceVersion?: string;
};

type GetMessagesQuerystring = {
  limit?: string;
};

type PostMessageRequestBody = {
  idToken: string;
  message: string;
  name: string;
};

function normalizeNonEmptyString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function hasPostMessageRequestBody(
  body: unknown,
): body is PostMessageRequestBody {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Partial<PostMessageRequestBody>;

  return (
    normalizeNonEmptyString(candidate.idToken) !== null &&
    normalizeNonEmptyString(candidate.message) !== null &&
    normalizeNonEmptyString(candidate.name) !== null
  );
}

function parseMessageLimit(rawLimit: string | undefined) {
  if (rawLimit === undefined) {
    return 50;
  }

  const limit = Number.parseInt(rawLimit, 10);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Expected limit to be an integer between 1 and 100.');
  }

  return limit;
}

export function resolveHttpsServerOptions(
  https: HttpsServerConfig,
): ServerOptions {
  return {
    cert: readFileSync(https.certPath),
    key: readFileSync(https.keyPath),
  };
}

function registerRoutes(
  server: FastifyInstance,
  runtimeConfig: ChatRuntimeConfig,
  auth: GooglePlayerAuthService,
  messageStore: ChatMessageStore,
  notifier: NonNullable<BuildChatServerOptions['notifier']>,
  serviceVersion: string,
) {
  server.get('/api/version', async () => ({
    version: serviceVersion,
  }));

  server.get<{ Querystring: GetMessagesQuerystring }>(
    '/api/messages',
    async (request, reply) => {
      try {
        const limit = parseMessageLimit(request.query.limit);

        return {
          messages: messageStore.listRecentMessages(limit),
        };
      } catch (error) {
        return reply.status(400).send({
          error:
            error instanceof Error
              ? error.message
              : 'Expected limit to be an integer between 1 and 100.',
        });
      }
    },
  );

  server.post<{ Body: PostMessageRequestBody }>(
    '/api/messages',
    async (request, reply) => {
      if (!runtimeConfig.googleClientId) {
        return reply.status(503).send({
          error: 'Google player auth is not configured.',
        });
      }

      if (!hasPostMessageRequestBody(request.body)) {
        return reply.status(400).send({
          error:
            'Expected a request body with non-empty idToken, name, and message strings.',
        });
      }

      const idToken = normalizeNonEmptyString(request.body.idToken);
      const message = normalizeNonEmptyString(request.body.message);
      const name = normalizeNonEmptyString(request.body.name);

      if (!idToken || !message || !name) {
        return reply.status(400).send({
          error:
            'Expected a request body with non-empty idToken, name, and message strings.',
        });
      }

      try {
        const player = await auth.verifyPlayer(idToken);
        const chatMessage = messageStore.addMessage({
          message,
          name,
          userId: player.googleSubject,
        });

        notifier.broadcastMessagesAvailable({
          latestMessageId: chatMessage.id,
          totalMessages: messageStore.countMessages(),
          type: 'messages-available',
        });

        return {
          message: chatMessage,
        };
      } catch (error) {
        if (error instanceof GooglePlayerAuthError) {
          return reply.status(error.statusCode).send({
            error: error.message,
          });
        }

        request.log.error(error);

        return reply.status(500).send({
          error: 'Unexpected chat message submission failure.',
        });
      }
    },
  );

  return server;
}

export function buildServer(options: BuildChatServerOptions = {}) {
  const runtimeConfig = options.runtimeConfig ?? createChatRuntimeConfig();
  const auth =
    options.auth ??
    createGooglePlayerAuth({
      googleClientId: runtimeConfig.googleClientId,
    });
  const messageStore = options.messageStore ?? createChatMessageStore();
  const notifier = options.notifier ?? {
    broadcastMessagesAvailable: () => undefined,
  };
  const serviceVersion = options.serviceVersion ?? getChatServiceVersion();

  if (options.https) {
    return registerRoutes(
      Fastify({
        https: resolveHttpsServerOptions(options.https),
      }),
      runtimeConfig,
      auth,
      messageStore,
      notifier,
      serviceVersion,
    );
  }

  return registerRoutes(
    Fastify(),
    runtimeConfig,
    auth,
    messageStore,
    notifier,
    serviceVersion,
  );
}
