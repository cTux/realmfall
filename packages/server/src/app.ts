import { readFileSync } from 'node:fs';
import type { ServerOptions } from 'node:https';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { getGameVersion } from './version.js';

type HttpsServerConfig = {
  certPath: string;
  keyPath: string;
};

type BuildServerOptions = {
  gameVersion?: string;
  https?: HttpsServerConfig;
};

export function resolveHttpsServerOptions(
  https: HttpsServerConfig,
): ServerOptions {
  return {
    cert: readFileSync(https.certPath),
    key: readFileSync(https.keyPath),
  };
}

function registerRoutes(server: FastifyInstance, gameVersion: string) {
  server.get('/api/version', async () => ({
    version: gameVersion,
  }));

  return server;
}

export function buildServer(options: BuildServerOptions = {}) {
  const gameVersion = options.gameVersion ?? getGameVersion();

  if (options.https) {
    return registerRoutes(
      Fastify({
        https: resolveHttpsServerOptions(options.https),
      }),
      gameVersion,
    );
  }

  return registerRoutes(Fastify(), gameVersion);
}
