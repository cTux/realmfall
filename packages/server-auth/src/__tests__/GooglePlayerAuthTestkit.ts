import { expect } from 'vitest';
import { createGooglePlayerAuth } from '../googleAuth.js';

type VerifyIdTokenOptions = {
  audience: string;
  idToken: string;
};

type StubPayload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

export class GooglePlayerAuthTestkit {
  readonly expect = {
    mapsVerifiedPayloadToPlayerIdentity: async () => {
      const player = await this.createAuth().verifyPlayer('valid-player-token');

      expect(player).toEqual({
        avatarUrl: 'https://example.com/avatar.png',
        displayName: 'Realmfall Player',
        email: 'player@example.com',
        emailVerified: true,
        googleSubject: 'google-sub-123',
      });
    },
    rejectsPayloadsWithoutEmail: async () => {
      const auth = createGooglePlayerAuth({
        authClient: this.createStubAuthClient({
          email: undefined,
          sub: 'google-sub-123',
        }),
        googleClientId: 'realmfall-web-client-id',
      });

      await expect(
        auth.verifyPlayer('valid-player-token'),
      ).rejects.toMatchObject({
        message: 'Expected the Google token payload to contain an email.',
        statusCode: 401,
      });
    },
    rejectsVerificationWithoutGoogleClientId: async () => {
      const auth = createGooglePlayerAuth({
        authClient: this.createStubAuthClient(),
        googleClientId: null,
      });

      await expect(
        auth.verifyPlayer('valid-player-token'),
      ).rejects.toMatchObject({
        message: 'Google player auth is not configured.',
        statusCode: 503,
      });
    },
    verifiesTokensAgainstConfiguredAudience: async () => {
      const auth = createGooglePlayerAuth({
        authClient: this.createStubAuthClient(),
        googleClientId: 'realmfall-web-client-id',
      });

      await auth.verifyPlayer('valid-player-token');

      expect(this.verifyCalls).toEqual([
        {
          audience: 'realmfall-web-client-id',
          idToken: 'valid-player-token',
        },
      ]);
    },
  };

  private verifyCalls: VerifyIdTokenOptions[] = [];

  private createAuth() {
    return createGooglePlayerAuth({
      authClient: this.createStubAuthClient(),
      googleClientId: 'realmfall-web-client-id',
    });
  }

  private createStubAuthClient(payload: StubPayload = {}) {
    return {
      verifyIdToken: async (options: VerifyIdTokenOptions) => {
        this.verifyCalls.push(options);

        return {
          getPayload: () => ({
            email: 'player@example.com',
            email_verified: true,
            name: 'Realmfall Player',
            picture: 'https://example.com/avatar.png',
            sub: 'google-sub-123',
            ...payload,
          }),
        };
      },
    };
  }
}
