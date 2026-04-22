# Version Checking

## Scope

This spec covers the shipped version metadata flow from `package.json` into the browser runtime, build output, and in-game refresh indicator.

## Current Solution

- `package.json` is the canonical release-version source for the shipped line.
- Vite derives the runtime build version by appending the current git short SHA to the package release version when that revision is available, defines that build version as `__APP_VERSION__`, and app bootstrap publishes it on the global `version` variable.
- The Vite config serves `/version.json` during local development and emits `dist/version.json` during production builds with the shape `{ "version": "<package version plus git build metadata>" }`.
- `pnpm serve` runs the built `dist` output behind local HTTPS using a generated self-signed localhost certificate so release-like checks exercise the secure origin path.
- The app polls `version.json` on a low-frequency interval only while the tab is visible, refreshes immediately when the tab becomes visible again, compares the remote version to the local runtime version, and keeps the last resolved UI state when later fetches fail.
- The bottom-right version widget shows a yellow status while the remote version has not been resolved yet, green when the remote and local versions match, and red when the remote version differs.
- When the remote version differs, the widget exposes a refresh action that reloads the page so the player can pick up the new build.
- Routine contributor commits do not mutate `package.json`; release-version edits are intentional source changes rather than mandatory commit metadata.
- `pnpm git:commit` delegates to `git commit` through the repository helper without editing `package.json`, so routine PR work does not create version-only diff churn.

## Main Implementation Areas

- `package.json`
- `scripts/build-version.helpers.ts`
- `scripts/git-commit.mjs`
- `vite.config.ts`
- `src/version.ts`
- `src/main.tsx`
- `src/app/App/hooks/useVersionStatus.ts`
- `src/ui/components/VersionStatusWidget/VersionStatusWidget.tsx`
- `src/ui/components/VersionStatusWidget/styles.module.scss`
- `src/app/App/tests/App.versionStatus.test.tsx`
