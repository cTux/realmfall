import type { FastifyInstance } from 'fastify';
import { expect } from 'vitest';
import { buildServer, resolveHttpsServerOptions } from '../app.js';
import {
  GooglePlayerAuthError,
  type GooglePlayerAuthService,
  type GooglePlayerIdentity,
} from '../googleAuth.js';
import type { RealmDirectoryEntry } from '../runtime.js';
import { createHttpsFixture } from './utils/authServerFixtures.js';

type HttpsFixture = ReturnType<typeof createHttpsFixture>;

const DEFAULT_REALMS: RealmDirectoryEntry[] = [
  {
    id: 'local',
    name: 'Local Realm',
    status: 'online',
    worldServerUrl: 'https://localhost:3001',
  },
  {
    id: 'ptu-eu',
    name: 'European Test Realm',
    status: 'maintenance',
    worldServerUrl: 'https://eu-ptu.realmfall.example',
  },
];

const DEFAULT_PLAYER: GooglePlayerIdentity = {
  avatarUrl: 'https://example.com/avatar.png',
  displayName: 'Realmfall Player',
  email: 'player@example.com',
  emailVerified: true,
  googleSubject: 'google-sub-123',
};

function createStubGooglePlayerAuth(): GooglePlayerAuthService {
  return {
    async verifyPlayer(idToken) {
      if (idToken !== 'valid-player-token') {
        throw new GooglePlayerAuthError('Invalid Google ID token.', 401);
      }

      return DEFAULT_PLAYER;
    },
  };
}

export class AuthServerTestkit {
  readonly actions = {
    buildServer: (buildVersion = '0.2.470+abcdef123456') => {
      this.server = buildServer({
        auth: createStubGooglePlayerAuth(),
        runtimeConfig: {
          googleClientId: 'realmfall-web-client-id',
          host: 'localhost',
          port: 3002,
          realms: DEFAULT_REALMS,
        },
        serviceVersion: buildVersion,
      });
    },
    createHttpsFixture: () => createHttpsFixture(),
  };

  readonly expect = {
    googleVerifyRejectsInvalidTokens: async () => {
      const response = await this.requireServer().inject({
        method: 'POST',
        payload: {
          idToken: 'invalid-player-token',
        },
        url: '/api/auth/google/verify',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'Invalid Google ID token.',
      });
    },
    googleVerifyReportsMissingGoogleClientId: async () => {
      const server = buildServer({
        auth: createStubGooglePlayerAuth(),
        runtimeConfig: {
          googleClientId: null,
          host: 'localhost',
          port: 3002,
          realms: DEFAULT_REALMS,
        },
        serviceVersion: '0.2.470+abcdef123456',
      });

      try {
        const response = await server.inject({
          method: 'POST',
          payload: {
            idToken: 'valid-player-token',
          },
          url: '/api/auth/google/verify',
        });

        expect(response.statusCode).toBe(503);
        expect(response.json()).toEqual({
          error: 'Google player auth is not configured.',
        });
      } finally {
        await server.close();
      }
    },
    googleVerifyResponseMatchesConfiguredPlayer: async () => {
      const response = await this.requireServer().inject({
        method: 'POST',
        payload: {
          idToken: 'valid-player-token',
        },
        url: '/api/auth/google/verify',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        player: DEFAULT_PLAYER,
      });
    },
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
    realmDirectoryMatchesConfiguredRealms: async () => {
      const response = await this.requireServer().inject({
        method: 'GET',
        url: '/api/realms',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        realms: DEFAULT_REALMS,
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
