# Version Checking

## Scope

This spec covers the shipped version metadata flow from `package.json` into the browser runtime, build output, in-game refresh indicator, and server version endpoint.

## Current Solution

- `package.json` is the canonical release-version source for the shipped line.
- `packages/client/vite.config.ts` derives the runtime build version by appending the current git short SHA to the package release version when that revision is available, defines that build version as `__APP_VERSION__`, and app bootstrap publishes it on the global `version` variable.
- The client Vite config serves `/version.json` during local development and emits `dist/version.json` during production builds with the shape `{ "version": "<package version plus git build metadata>" }`.
- `packages/server-world/src/version.ts` derives the world-service build version from the same root `package.json` source and the same git short SHA strategy, falling back to the plain release version when git metadata is unavailable.
- `packages/server-world/src/app.ts` exposes `GET /api/version`, returning `{ "version": "<package version plus git build metadata>" }`.
- `packages/server-auth/src/version.ts` derives the auth-service build version from the same root `package.json` source and the same git short SHA strategy, falling back to the plain release version when git metadata is unavailable.
- `packages/server-auth/src/app.ts` exposes `GET /api/version`, returning `{ "version": "<package version plus git build metadata>" }`.
- `pnpm dev` runs both the client Vite server and the server source runtime behind local HTTPS without a production build step, so secure-origin local checks use the live source path.
- `pnpm serve` runs the built `dist` output behind local HTTPS using a generated self-signed localhost certificate so release-like checks exercise the secure origin path.
- The app mounts an in-game version-status widget in the bottom-right corner, polls `/version.json`, shows yellow while checking, green when versions match, red when they differ, and exposes a reload action only for the mismatched state.
- Routine contributor commits increment the `package.json` patch version before the commit is created, making the package release version advance monotonically with local commit history.
- When the active pre-commit hook already covers the validation needed for a commit, contributors rely on that hook instead of rerunning the same manual checks immediately beforehand.

## Main Implementation Areas

- `package.json`
- `packages/client/scripts/build-version.helpers.ts`
- `scripts/commit-version-bump.mjs`
- `scripts/git-commit.mjs`
- `.husky/pre-commit`
- `packages/client/vite.config.ts`
- `packages/client/src/version.ts`
- `packages/client/src/main.tsx`
- `packages/server-world/src/app.ts`
- `packages/server-world/src/dev.ts`
- `packages/server-world/src/runtime.ts`
- `packages/server-world/src/version.ts`
- `packages/server-auth/src/app.ts`
- `packages/server-auth/src/dev.ts`
- `packages/server-auth/src/runtime.ts`
- `packages/server-auth/src/version.ts`
