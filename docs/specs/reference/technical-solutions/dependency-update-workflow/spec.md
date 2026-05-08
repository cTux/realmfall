# Dependency Update Workflow

## Scope

This spec covers the local workflow for inspecting, applying, validating, and committing dependency updates.

## Current Solution

- Shared third-party version ranges that multiple workspace packages consume live in the default catalog in `pnpm-workspace.yaml`, while each workspace package keeps its own direct dependency, peer dependency, and tooling declarations in its local `package.json`.
- After rewriting dependency ranges, the mutating update scripts refresh `pnpm-lock.yaml` with `pnpm install --no-frozen-lockfile`, which keeps the same command usable in local environments and in CI where lockfile writes would otherwise be frozen.
- The mutating update scripts validate refreshed dependencies with `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before any commit is created.
- Passing `--no-commit` leaves the updated manifests in the working tree after the sanity checks finish, which allows automation to stage and publish the refreshed dependency set through a separate branch or pull-request workflow.
- The dependency update script fails when the refresh or sanity-check flow produces tracked edits outside `package.json` and `pnpm-lock.yaml`, so automated dependency commits cannot silently absorb unrelated repository churn.
- There is no committed GitHub Actions workflow that opens dependency refresh pull requests automatically; automation should invoke the local update scripts and publish any resulting branch separately.

## Main Implementation Areas

- `pnpm-workspace.yaml`
- `package.json`
- `packages/client/package.json`
- `packages/common/package.json`
- `packages/server-world/package.json`
- `packages/ui/package.json`
- `packages/client/scripts/dependency-updates.mjs`
- `packages/client/scripts/dependency-updates.helpers.mjs`
- `packages/client/scripts/pnpm-command.mjs`
- `scripts/commit-version-bump.mjs`
- `scripts/git-commit.mjs`
- `scripts/tests/dependency-updates.test.ts`
