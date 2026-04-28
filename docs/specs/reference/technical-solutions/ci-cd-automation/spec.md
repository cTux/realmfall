# CI/CD Automation

## Scope

This spec covers the continuous integration flow for PR handling and deployment from the repository default branch.

## Current Solution

- The pull-request workflow runs `typecheck-and-lint`, `test-node`, and strict bundle-budget `build` jobs, does not run the browser-facing `test-jsdom` project, runs `pnpm test` in `test-node` for the server package plus the client `node` project, and runs `pnpm build:budget:strict` in `build` for the shared workspace build path plus the client startup-budget gate.
- `pull_request_target` runs the `auto-rebase-package-json` job for non-draft same-repository pull requests targeting the repository default branch.
- The job checks out the base repository, switches to the PR head branch, and runs `node scripts/rebase-master-and-push.mjs`.
- After the rebase, the job installs dependencies and runs `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build:budget:strict` before any branch update push.
- `scripts/rebase-master-and-push.mjs` auto-resolves `package.json` version conflicts during rebase by extracting the stage-1, stage-2, and stage-3 package versions, computing the next valid patch version, and replacing only the `version` conflict in `package.json`.
- If conflicts remain after auto-resolution, the rebase helper fails so manual review is required before the branch can be merged.
- If no unexpected conflicts remain, the job continues the rebase and pushes with `--force-with-lease`, keeping the PR branch current with the repository default branch resolved to `origin/HEAD`.
- Pushes to the repository default branch run the `deploy-pages` job in `.github/workflows/ci-cd-automation.yml`.
- The deploy job installs dependencies, sets the Pages deploy author identity, and runs `pnpm git:deploy`.
- `pnpm git:deploy` builds with `REALMFALL_VITE_BASE` set to `/realmfall/`, publishes `dist/` to `origin/gh-pages`, and uses a lease-aware push plan when `gh-pages` already exists.

## Main Implementation Areas

- `.github/workflows/ci-cd-automation.yml`
- `scripts/rebase-master-and-push.mjs`
- `scripts/rebase-master-and-push.helpers.mjs`
- `scripts/git-deploy.mjs`
- `scripts/git-deploy.helpers.mjs`
- `package.json`
