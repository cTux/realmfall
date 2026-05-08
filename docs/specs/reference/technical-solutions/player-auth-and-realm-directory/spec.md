# Player Auth And Realm Directory

## Scope

This spec covers the standalone auth-service package that verifies player Google ID tokens and serves the realm directory clients use to choose a world connection target.

## Current Solution

- `packages/server-auth` mirrors the existing `server-world` Node service package infra with Fastify, TypeScript build and typecheck scripts, Oxlint, Vitest, and the shared localhost HTTPS helper used by the other server package.
- `packages/server-auth/src/app.ts` exposes `GET /api/version`, `GET /api/realms`, and `POST /api/auth/google/verify`.
- `GET /api/realms` returns a structured realm directory with `id`, `name`, `status`, and `worldServerUrl` fields.
- The default realm directory contains one local realm entry pointing at `https://localhost:3001`, and `REALMFALL_AUTH_REALMS_JSON` can replace that directory with a deployed realm list.
- `POST /api/auth/google/verify` expects `{ "idToken": string }`, verifies the Google ID token against `REALMFALL_AUTH_GOOGLE_CLIENT_ID`, and returns a normalized player identity with the Google subject, email, verification flag, display name, and avatar URL.
- Google player verification is implemented through the official `google-auth-library` `OAuth2Client.verifyIdToken(...)` flow rather than a custom token parser.
- The verify endpoint returns `503` when the Google client id is not configured, `400` for malformed request bodies, and `401` for invalid or incomplete Google token payloads.
- `packages/server-auth/src/runtime.ts` defaults the auth service to `localhost:3002`, formats the HTTP or HTTPS listen URL, and validates any configured realm-directory override payload before the server starts.
- `packages/server-auth/src/dev.ts` and `packages/server-auth/scripts/serve-https.mjs` run the auth service on local HTTPS using the shared localhost certificate helper, while `packages/server-auth/src/index.ts` serves the plain HTTP production entrypoint.
- The auth service is not part of the default root `pnpm dev` and `pnpm serve` orchestration path yet; it runs through its own filtered package commands until the broader multi-service workflow needs it.

## Main Implementation Areas

- `packages/server-auth/package.json`
- `packages/server-auth/README.md`
- `packages/server-auth/scripts/serve-https.mjs`
- `packages/server-auth/src/app.ts`
- `packages/server-auth/src/dev.ts`
- `packages/server-auth/src/googleAuth.ts`
- `packages/server-auth/src/index.ts`
- `packages/server-auth/src/runtime.ts`
- `packages/server-auth/src/version.ts`
- `packages/server-auth/src/__tests__/*`
