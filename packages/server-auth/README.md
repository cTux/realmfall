# Realmfall Auth Server

`@realmfall/server-auth` is the standalone Node service package for player authentication and realm-directory responses. It mirrors the existing `server-world` package infra so the auth service can evolve without introducing a one-off toolchain.

## Current API

- `GET /api/version`: returns `{ "version": "<root package version with git short SHA when available>" }`
- `GET /api/realms`: returns `{ "realms": RealmDirectoryEntry[] }`
- `POST /api/auth/google/verify`: accepts `{ "idToken": "<google id token>" }` and returns `{ "player": GooglePlayerIdentity }` for a verified player token

## Environment

- `REALMFALL_AUTH_GOOGLE_CLIENT_ID`: Google OAuth client id used as the expected ID-token audience
- `REALMFALL_AUTH_REALMS_JSON`: JSON array override for the realm directory returned by `GET /api/realms`
- `HOST`
- `PORT`

## Local Commands

- `pnpm --filter @realmfall/server-auth dev`
- `pnpm --filter @realmfall/server-auth build`
- `pnpm --filter @realmfall/server-auth serve`
- `pnpm --filter @realmfall/server-auth start`
- `pnpm --filter @realmfall/server-auth typecheck`
- `pnpm --filter @realmfall/server-auth lint`
- `pnpm --filter @realmfall/server-auth test`

## Notes

- `pnpm --filter @realmfall/server-auth dev` runs the source auth service on `https://localhost:3002` with the shared localhost certificate helper.
- `pnpm --filter @realmfall/server-auth serve` runs the built auth service on the same HTTPS origin so release-like local checks use matching TLS behavior.
- The default realm directory contains one local realm that points at `https://localhost:3001` until `REALMFALL_AUTH_REALMS_JSON` overrides it.
- Google player verification uses the official `google-auth-library` token-verification path and returns `503` until `REALMFALL_AUTH_GOOGLE_CLIENT_ID` is configured.
- The auth service is intentionally separate from the default `pnpm dev` and `pnpm serve` multi-service workspace runner for now.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Player auth and realm directory spec: [`docs/specs/reference/technical-solutions/player-auth-and-realm-directory/spec.md`](../../docs/specs/reference/technical-solutions/player-auth-and-realm-directory/spec.md)
