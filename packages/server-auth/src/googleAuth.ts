import { OAuth2Client } from 'google-auth-library';

type GoogleIdTokenPayload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

type GoogleLoginTicket = {
  getPayload: () => GoogleIdTokenPayload | undefined;
};

type VerifyIdTokenOptions = {
  audience: string;
  idToken: string;
};

export type GooglePlayerIdentity = {
  avatarUrl: string | null;
  displayName: string | null;
  email: string;
  emailVerified: boolean;
  googleSubject: string;
};

export type GoogleAuthClient = {
  verifyIdToken: (
    options: VerifyIdTokenOptions,
  ) => Promise<GoogleLoginTicket>;
};

export type GooglePlayerAuthService = {
  verifyPlayer: (idToken: string) => Promise<GooglePlayerIdentity>;
};

export class GooglePlayerAuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'GooglePlayerAuthError';
  }
}

type CreateGooglePlayerAuthOptions = {
  authClient?: GoogleAuthClient;
  googleClientId: string | null;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return value;
}

function normalizePlayerIdentity(
  payload: GoogleIdTokenPayload | undefined,
): GooglePlayerIdentity {
  if (!payload?.sub) {
    throw new GooglePlayerAuthError(
      'Expected the Google token payload to contain a subject.',
      401,
    );
  }

  if (typeof payload.email !== 'string' || payload.email.length === 0) {
    throw new GooglePlayerAuthError(
      'Expected the Google token payload to contain an email.',
      401,
    );
  }

  return {
    avatarUrl: normalizeOptionalString(payload.picture),
    displayName: normalizeOptionalString(payload.name),
    email: payload.email,
    emailVerified: payload.email_verified === true,
    googleSubject: payload.sub,
  };
}

export function createGooglePlayerAuth({
  authClient,
  googleClientId,
}: CreateGooglePlayerAuthOptions): GooglePlayerAuthService {
  const client =
    authClient ?? new OAuth2Client(googleClientId ?? undefined);

  return {
    async verifyPlayer(idToken) {
      if (!googleClientId) {
        throw new GooglePlayerAuthError(
          'Google player auth is not configured.',
          503,
        );
      }

      try {
        const ticket = await client.verifyIdToken({
          audience: googleClientId,
          idToken,
        });

        return normalizePlayerIdentity(ticket.getPayload());
      } catch (error) {
        if (error instanceof GooglePlayerAuthError) {
          throw error;
        }

        throw new GooglePlayerAuthError('Invalid Google ID token.', 401);
      }
    },
  };
}
