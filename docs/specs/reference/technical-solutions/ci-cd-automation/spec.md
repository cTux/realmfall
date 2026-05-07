# CI/CD Automation

## Scope

This spec covers the continuous integration flow for pull requests, default-branch validation, pull-request auto-rebase, and release-based deployment.

## Current Solution

- The pull-request validation workflow in `.github/workflows/pull-request-validation.yml` runs `validate-typecheck-and-lint`, `validate-node-test-suite`, and `validate-production-build`, does not run the browser-facing `test-jsdom` project, runs `pnpm test` for the server package plus the client `node` project, and runs `pnpm build` for the shared workspace production build path.
- The master-branch validation workflow in `.github/workflows/master-branch-validation.yml` runs the same validation job split for pushes to `master`.
- The pull-request auto-rebase workflow in `.github/workflows/pull-request-auto-rebase.yml` runs on `pull_request_target` for non-draft same-repository pull requests targeting the repository default branch.
- The auto-rebase job checks out the base repository history, switches to the PR head branch, and runs `node scripts/rebase-master-and-push.mjs`.
- After the rebase, the job installs dependencies and runs `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before any branch update push.
- `scripts/rebase-master-and-push.mjs` auto-resolves `package.json` version conflicts during rebase by extracting the stage-1, stage-2, and stage-3 package versions, computing the next valid patch version, and replacing only the `version` conflict in `package.json`.
- If conflicts remain after auto-resolution, the rebase helper fails so manual review is required before the branch can be merged.
- If no unexpected conflicts remain, the job continues the rebase and pushes with `--force-with-lease`, keeping the PR branch current with the repository default branch resolved to `origin/HEAD`.
- The GitHub Pages deploy workflow in `.github/workflows/release-pages-deploy.yml` runs when a GitHub release is published.
- The deploy job installs dependencies, sets the Pages deploy author identity, and runs `pnpm git:deploy`.
- `pnpm git:deploy` builds with `REALMFALL_VITE_BASE` set to `/realmfall/`, publishes `dist/` to `origin/gh-pages`, and uses a lease-aware push plan when `gh-pages` already exists.

## Main Implementation Areas

- `.github/workflows/pull-request-validation.yml`
- `.github/workflows/master-branch-validation.yml`
- `.github/workflows/pull-request-auto-rebase.yml`
- `.github/workflows/release-pages-deploy.yml`
- `scripts/rebase-master-and-push.mjs`
- `scripts/rebase-master-and-push.helpers.mjs`
- `scripts/git-deploy.mjs`
- `scripts/git-deploy.helpers.mjs`
- `package.json`
