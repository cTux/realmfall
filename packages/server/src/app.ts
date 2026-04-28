import Fastify from 'fastify';
import { getGameVersion } from './version.js';

type BuildServerOptions = {
  gameVersion?: string;
};

export function buildServer(options: BuildServerOptions = {}) {
  const server = Fastify();
  const gameVersion = options.gameVersion ?? getGameVersion();

  server.get('/api/version', async () => ({
    version: gameVersion,
  }));

  return server;
}
