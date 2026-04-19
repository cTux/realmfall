# Version Checking

## Scope

This spec covers the shipped version metadata flow from `package.json` into the browser runtime, build output, and in-game refresh indicator.

## Current Solution

- `package.json` is the canonical version source for the current release number.
- Vite defines the package version as the runtime constant `__APP_VERSION__`, and app bootstrap publishes that value on the global `version` variable.
- The Vite config serves `/version.json` during local development and emits `dist/version.json` during production builds with the shape `{ "version": "<package version>" }`.
- `pnpm serve` runs the built `dist` output behind local HTTPS using a generated self-signed localhost certificate so release-like checks exercise the secure origin path.
- The app polls `version.json` on a low-frequency interval only while the tab is visible, refreshes immediately when the tab becomes visible again, compares the remote version to the local runtime version, and keeps the last resolved UI state when later fetches fail.
- The bottom-right version widget shows a yellow status while the remote version has not been resolved yet, green when the remote and local versions match, and red when the remote version differs.
- When the remote version differs, the widget exposes a refresh action that reloads the page so the player can pick up the new build.
- The pre-commit hook now enforces that `package.json` moves forward by patch version before a commit can proceed.

## Main Implementation Areas

- `package.json`
- `.husky/pre-commit`
- `scripts/check-package-version.mjs`
- `vite.config.ts`
- `src/version.ts`
- `src/main.tsx`
- `src/app/App/hooks/useVersionStatus.ts`
- `src/ui/components/VersionStatusWidget/VersionStatusWidget.tsx`
- `src/ui/components/VersionStatusWidget/styles.module.scss`
- `src/app/App/tests/App.versionStatus.test.tsx`
