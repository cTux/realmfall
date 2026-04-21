# Git Branch Rebase And Push

## Scope

This spec covers the repository-local helper that rebases the current branch onto the default branch advertised by `origin/HEAD`, auto-resolves package version conflicts, and republishes the rewritten branch.

## Current Solution

- `pnpm git:rebase-master-and-push` runs `node scripts/rebase-master-and-push.mjs`.
- The script is intended for a clean, already-committed feature branch, but it can also resume an in-progress rebase that it previously started.
- It resolves the current remote default branch from `git ls-remote --symref origin HEAD` and rebases with `git pull origin <default-branch> --rebase`, matching the contributor workflow the repository uses for refreshing feature branches from the main line without assuming a fixed branch name.
- When the rebase pauses on a `package.json` version conflict, the script reads the stage-1, stage-2, and stage-3 `package.json` blobs from Git, computes how many patch-version increments the rebased commit already applied, and adds that same increment count on top of the incoming upstream version.
- The working-tree conflict resolution only replaces the conflicted `version` line in `package.json`, so auto-merged changes elsewhere in the file stay intact.
- The script reruns `git rebase --continue` with `core.editor=true` until the rebase completes.
- Automatic conflict resolution is intentionally limited to the `package.json` version line. If any other unresolved file remains, the script stops so the user can inspect the new upstream changes before continuing.
- The script refuses to run on whichever branch `origin/HEAD` currently points at, so the safety check follows repositories that use `main`, `master`, or another default branch name.
- Before it uses `git push --force-with-lease`, the script fetches `origin/<current-branch>` into the local remote-tracking ref so the lease compares against current remote state instead of stale local data.
- If the current branch does not exist on `origin` yet, the script creates it with `git push --set-upstream origin HEAD:refs/heads/<current-branch>`.
- `--dry-run` prints the planned rebase and push workflow without changing Git state.

## Main Implementation Areas

- `package.json`
- `scripts/rebase-master-and-push.mjs`
- `scripts/rebase-master-and-push.helpers.mjs`
- `scripts/tests/rebase-master-and-push.test.ts`
- `README.md`
- `docs/WORKFLOW.md`
