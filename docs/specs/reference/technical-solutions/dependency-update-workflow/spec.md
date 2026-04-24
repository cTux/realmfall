# Dependency Update Workflow

## Scope

This spec covers the local and automated workflow for inspecting, applying, validating, and committing dependency updates.

## Current Solution

- `pnpm update:check` runs `npm-check-updates` in read-only mode so contributors can review available dependency updates before modifying the repository manifests.
- `pnpm update:minor` and `pnpm update:major` require a clean tracked worktree, rewrite `package.json` dependency ranges through `npm-check-updates`, and stop early when no dependency changes are available.
- After rewriting dependency ranges, the mutating update scripts refresh `pnpm-lock.yaml` with `pnpm install --no-frozen-lockfile`, which keeps the same command usable in local environments and in CI where lockfile writes would otherwise be frozen.
- The mutating update scripts validate refreshed dependencies with `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before any commit is created.
- By default, the mutating update scripts stage `package.json` and `pnpm-lock.yaml`, then delegate to `pnpm git:commit` with a conventional `chore(dependencies)` message so dependency refresh commits use the same repository commit wrapper and automatic patch-version bump as ordinary local commits.
- Passing `--no-commit` leaves the updated manifests in the working tree after the sanity checks finish, which allows automation to stage and publish the refreshed dependency set through a separate branch or pull-request workflow.
- The dependency update script fails when the refresh or sanity-check flow produces tracked edits outside `package.json` and `pnpm-lock.yaml`, so automated dependency commits cannot silently absorb unrelated repository churn.
- The scheduled dependency-update workflow installs the repository toolchain, runs `pnpm update:minor -- --no-commit`, audits the refreshed tree with read-only `pnpm audit --json`, and then creates or updates the reusable dependency pull request branch.

## Main Implementation Areas

- `package.json`
- `scripts/dependency-updates.mjs`
- `scripts/dependency-updates.helpers.mjs`
- `scripts/pnpm-command.mjs`
- `scripts/commit-version-bump.mjs`
- `scripts/git-commit.mjs`
- `scripts/tests/dependency-updates.test.ts`
- `.github/workflows/dependencies-update.yml`
