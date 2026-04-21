# Git Branch Cleanup

## Scope

This spec covers the repository-local helper that removes local branches whose tracked remote ref was already deleted.

## Current Solution

- `pnpm git:prune-gone-branches` runs `node scripts/prune-gone-branches.mjs`.
- The script fetches every configured remote with `git fetch --all --prune --prune-tags` before it scans local branches, unless the caller opts out with `--no-fetch`.
- It reads local branch metadata from `git for-each-ref`, matches branches against the current `refs/remotes/*` set, and treats only branches with a configured remote-tracking upstream that no longer exists as cleanup candidates.
- The current checked-out branch is never treated as a cleanup candidate, even if its upstream ref was deleted.
- Branches without an upstream are not touched, and branches that track another local branch through `refs/heads/*` are also left alone, so scratch branches and local-only work remain intact.
- The default delete path uses `git branch -D`, so branches whose upstream ref is gone are removed even when Git cannot prove they are merged into the current `HEAD`.
- `--dry-run` prints the branches that match the cleanup rule without deleting them.
- `--safe` switches deletion to `git branch -d` so callers can keep Git's merged-branch protection when they want that extra gate.
- `--force` remains accepted as an explicit alias for the default force-delete behavior.
- When a branch cannot be deleted, the script reports the branch-specific Git error and exits with a non-zero status so manual follow-up is visible.

## Main Implementation Areas

- `package.json`
- `scripts/prune-gone-branches.mjs`
- `scripts/prune-gone-branches.helpers.mjs`
- `scripts/tests/prune-gone-branches.test.ts`
- `README.md`
- `docs/WORKFLOW.md`
