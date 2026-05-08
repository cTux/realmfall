import type { FastifyInstance } from 'fastify';
import { expect } from 'vitest';
import { buildServer, resolveHttpsServerOptions } from '../app.js';
import { createHttpsFixture } from './utils/appServerFixtures.js';

type HttpsFixture = ReturnType<typeof createHttpsFixture>;

export class AppServerTestkit {
  readonly actions = {
    buildServer: (gameVersion = '0.2.470+abcdef123456') => {
      this.server = buildServer({ gameVersion });
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
    versionEndpointMatchesConfiguredVersion: async (version: string) => {
      const response = await this.requireServer().inject({
        method: 'GET',
        url: '/api/version',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ version });
    },
  };

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
}
