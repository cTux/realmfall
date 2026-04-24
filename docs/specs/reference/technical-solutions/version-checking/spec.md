# Version Checking

## Scope

This spec covers the shipped version metadata flow from `package.json` into the browser runtime, build output, and in-game refresh indicator.

## Current Solution

- `package.json` is the canonical release-version source for the shipped line.
- Vite derives the runtime build version by appending the current git short SHA to the package release version when that revision is available, defines that build version as `__APP_VERSION__`, and app bootstrap publishes it on the global `version` variable.
- The Vite config serves `/version.json` during local development and emits `dist/version.json` during production builds with the shape `{ "version": "<package version plus git build metadata>" }`.
- `pnpm serve` runs the built `dist` output behind local HTTPS using a generated self-signed localhost certificate so release-like checks exercise the secure origin path.
- The app mounts an in-game version-status widget in the bottom-right corner, polls `/version.json`, shows yellow while checking, green when versions match, red when they differ, and exposes a reload action only for the mismatched state.
- Routine contributor commits increment the `package.json` patch version before the commit is created, making the package release version advance monotonically with local commit history.
- `scripts/commit-version-bump.mjs` owns the patch bump, stages `package.json`, skips when the helper has already bumped the version, and refuses to run when `package.json` has unstaged edits so unrelated manifest changes are not pulled into the commit.
- `pnpm git:commit` runs the bump script before delegating to `git commit`, while `.husky/pre-commit` runs the same script for plain `git commit` before the staged and repository-wide validation steps. The helper marks the commit environment so the hook does not apply a second bump.

## Main Implementation Areas

- `package.json`
- `scripts/build-version.helpers.ts`
- `scripts/commit-version-bump.mjs`
- `scripts/git-commit.mjs`
- `.husky/pre-commit`
- `vite.config.ts`
- `src/version.ts`
- `src/main.tsx`
