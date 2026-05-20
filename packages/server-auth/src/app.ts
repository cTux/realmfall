import { readFileSync } from 'node:fs';
import type { ServerOptions } from 'node:https';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import {
  GooglePlayerAuthError,
  createGooglePlayerAuth,
  type GooglePlayerAuthService,
} from './googleAuth.js';
import { createAuthRuntimeConfig, type AuthRuntimeConfig } from './runtime.js';
import { getAuthServiceVersion } from './version.js';

type HttpsServerConfig = {
  certPath: string;
  keyPath: string;
};

type BuildAuthServerOptions = {
  auth?: GooglePlayerAuthService;
  https?: HttpsServerConfig;
  runtimeConfig?: AuthRuntimeConfig;
  serviceVersion?: string;
};

type VerifyGooglePlayerRequestBody = {
  idToken: string;
};

function hasIdToken(body: unknown): body is VerifyGooglePlayerRequestBody {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Partial<VerifyGooglePlayerRequestBody>;

  return typeof candidate.idToken === 'string' && candidate.idToken.length > 0;
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
  runtimeConfig: AuthRuntimeConfig,
  auth: GooglePlayerAuthService,
  serviceVersion: string,
) {
  server.get('/api/version', async () => ({
    version: serviceVersion,
  }));

  server.get('/api/realms', async () => ({
    realms: runtimeConfig.realms,
  }));

  server.post('/api/auth/google/verify', async (request, reply) => {
    if (!runtimeConfig.googleClientId) {
      return reply.status(503).send({
        error: 'Google player auth is not configured.',
      });
    }

    if (!hasIdToken(request.body)) {
      return reply.status(400).send({
        error: 'Expected a request body with a non-empty idToken string.',
      });
    }

    try {
      const player = await auth.verifyPlayer(request.body.idToken);
      return {
        player,
      };
    } catch (error) {
      if (error instanceof GooglePlayerAuthError) {
        return reply.status(error.statusCode).send({
          error: error.message,
        });
      }

      request.log.error(error);

      return reply.status(500).send({
        error: 'Unexpected Google player auth failure.',
      });
    }
  });

  return server;
}

export function buildServer(options: BuildAuthServerOptions = {}) {
  const runtimeConfig = options.runtimeConfig ?? createAuthRuntimeConfig();
  const auth =
    options.auth ??
    createGooglePlayerAuth({
      googleClientId: runtimeConfig.googleClientId,
    });
  const serviceVersion = options.serviceVersion ?? getAuthServiceVersion();

  if (options.https) {
    return registerRoutes(
      Fastify({
        https: resolveHttpsServerOptions(options.https),
      }),
      runtimeConfig,
      auth,
      serviceVersion,
    );
  }

  return registerRoutes(Fastify(), runtimeConfig, auth, serviceVersion);
}
