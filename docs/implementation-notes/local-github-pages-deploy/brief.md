# Local GitHub Pages Deploy

## Goal

Add `pnpm git:deploy` so a maintainer can build Realmfall locally and publish the generated static site to GitHub Pages.

## Chosen Approach

Implement a repository-owned Node script, `scripts/git-deploy.mjs`, wired through `package.json` as `git:deploy`. The script will build the Vite app, publish the generated `dist/` contents to the `gh-pages` branch, and push that branch to `origin`.

This avoids adding a deployment package for a small Git workflow and keeps the behavior aligned with the existing shell-safe script helpers.

## Behavior

- Refuse to deploy when tracked files have uncommitted changes unless `--allow-dirty` is passed.
- Build with the GitHub Pages base path `/realmfall/` so production asset URLs resolve under `https://ctux.github.io/realmfall/`.
- Publish only `dist/` contents to a temporary worktree for `gh-pages`.
- Add `.nojekyll` to the published output.
- Commit the Pages branch with a deterministic message that includes the source commit, such as `deploy: publish e81c98b`.
- Push `gh-pages` to `origin`.

## Verification

- Add focused Node-project tests for dirty-worktree protection, build environment, git command sequencing, and argument handling.
- Run `pnpm test:node` for the script tests.
- Run `pnpm build` or the deploy script build path to confirm the production bundle emits successfully.

## External Setup

GitHub Pages should be configured in repository settings to deploy from the `gh-pages` branch and `/` folder.
