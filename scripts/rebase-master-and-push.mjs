import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import {
  createPushPlan,
  isMissingRemoteRefError,
  parseCliArgs,
  parseRemoteDefaultBranch,
  replacePackageVersionConflict,
  resolveRebasedPackageVersion,
} from './rebase-master-and-push.helpers.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const PACKAGE_JSON_PATH = resolve(process.cwd(), 'package.json');
const REMOTE = 'origin';
const USAGE = `Usage: pnpm git:rebase-master-and-push [-- --dry-run]

Rebases the current branch onto the default branch from origin/HEAD,
auto-resolves package.json version conflicts, continues the rebase,
and pushes the rewritten branch.

Notes:
  - Run it from a clean working tree unless a rebase is already in progress
  - Automatic conflict resolution only handles package.json version conflicts
  - Existing remote branches are published with git push --force-with-lease`;

function fail(message) {
  process.stderr.write(`Git rebase/push failed: ${message}\n`);
  process.exit(1);
}

function logStep(message) {
  console.log(`\n> ${message}`);
}

function getGitError(result, fallbackMessage) {
  return (result.stderr || result.stdout || fallbackMessage).trim();
}

function runGit(args, { allowFailure = false, live = false } = {}) {
  const result = spawnSync(gitBin, args, {
    encoding: 'utf8',
    stdio: live ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });

  if (!allowFailure && result.status !== 0) {
    fail(getGitError(result, `git ${args.join(' ')} failed.`));
  }

  return result;
}

function readGit(args) {
  return runGit(args).stdout.trim();
}

function readGitPath(relativePath) {
  return readGit(['rev-parse', '--git-path', relativePath]);
}

function isRebaseInProgress() {
  return (
    existsSync(readGitPath('rebase-merge')) ||
    existsSync(readGitPath('rebase-apply'))
  );
}

function getCurrentBranchName() {
  const branchName = readGit(['branch', '--show-current']);

  if (branchName !== '') {
    return branchName;
  }

  const rebaseHeadNamePaths = [
    readGitPath('rebase-merge/head-name'),
    readGitPath('rebase-apply/head-name'),
  ];

  for (const headNamePath of rebaseHeadNamePaths) {
    if (!existsSync(headNamePath)) {
      continue;
    }

    const refName = readFileSync(headNamePath, 'utf8').trim();

    if (refName.startsWith('refs/heads/')) {
      return refName.replace(/^refs\/heads\//u, '');
    }
  }

  fail('Unable to determine the current branch name.');
}

function getRemoteDefaultBranch() {
  const output = readGit(['ls-remote', '--symref', REMOTE, 'HEAD']);

  try {
    return parseRemoteDefaultBranch(output);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function ensureSupportedBranch(branchName, baseBranch) {
  if (branchName === '') {
    fail('Current HEAD is detached.');
  }

  if (branchName === baseBranch) {
    fail(`Refusing to rewrite ${baseBranch}.`);
  }
}

function ensureCleanWorktree() {
  if (readGit(['status', '--porcelain']) !== '') {
    fail(
      'Working tree must be clean before rebasing. Commit or stash changes first.',
    );
  }
}

function getUnmergedFiles() {
  const output = readGit(['diff', '--name-only', '--diff-filter=U']);

  return output === '' ? [] : output.split('\n').filter(Boolean);
}

function hasRemoteTrackingRef(branchName) {
  return (
    runGit(
      [
        'show-ref',
        '--verify',
        '--quiet',
        `refs/remotes/${REMOTE}/${branchName}`,
      ],
      {
        allowFailure: true,
      },
    ).status === 0
  );
}

function resolvePackageJsonVersionConflict() {
  const currentText = readFileSync(PACKAGE_JSON_PATH, 'utf8');
  const basePackage = JSON.parse(readGit(['show', ':1:package.json']));
  const upstreamPackage = JSON.parse(readGit(['show', ':2:package.json']));
  const rebasedPackage = JSON.parse(readGit(['show', ':3:package.json']));
  const resolvedVersion = resolveRebasedPackageVersion(
    basePackage.version,
    upstreamPackage.version,
    rebasedPackage.version,
  );
  const resolvedText = replacePackageVersionConflict(
    currentText,
    resolvedVersion,
  );

  writeFileSync(PACKAGE_JSON_PATH, resolvedText, 'utf8');
  runGit(['add', 'package.json']);
  logStep(`Resolved package.json version conflict to ${resolvedVersion}`);
}

function resolveKnownConflicts(unmergedFiles) {
  const resolvedFiles = [];

  if (unmergedFiles.includes('package.json')) {
    resolvePackageJsonVersionConflict();
    resolvedFiles.push('package.json');
  }

  return resolvedFiles;
}

function continueRebase() {
  while (isRebaseInProgress()) {
    const unmergedFiles = getUnmergedFiles();

    if (unmergedFiles.length > 0) {
      const resolvedFiles = resolveKnownConflicts(unmergedFiles);
      const remainingUnmergedFiles = getUnmergedFiles();

      if (remainingUnmergedFiles.length > 0) {
        fail(
          `Manual conflict resolution required for: ${remainingUnmergedFiles.join(', ')}`,
        );
      }

      if (resolvedFiles.length === 0) {
        fail(
          `Manual conflict resolution required for: ${unmergedFiles.join(', ')}`,
        );
      }
    }

    logStep('Continuing rebase');

    const continueResult = runGit(
      ['-c', 'core.editor=true', 'rebase', '--continue'],
      {
        allowFailure: true,
        live: true,
      },
    );

    if (continueResult.status === 0) {
      continue;
    }

    fail(
      'git rebase --continue failed. Resolve the reported issue, or run git rebase --skip/--abort manually before retrying.',
    );
  }
}

function describePushPlan(branchName, pushPlan) {
  if (pushPlan.hasRemoteTrackingRef) {
    console.log(
      `Would fetch ${REMOTE}/${branchName} for lease freshness and push with --force-with-lease.`,
    );
    return;
  }

  console.log(
    `Would create ${REMOTE}/${branchName} with --set-upstream because the remote branch does not exist yet.`,
  );
}

let options;

try {
  options = parseCliArgs(process.argv.slice(2));
} catch (error) {
  console.error(USAGE);
  fail(error instanceof Error ? error.message : String(error));
}

if (options.help) {
  console.log(USAGE);
  process.exit(0);
}

if (readGit(['rev-parse', '--is-inside-work-tree']) !== 'true') {
  fail('Current directory is not inside a git worktree.');
}

const rebaseAlreadyInProgress = isRebaseInProgress();
const branchName = getCurrentBranchName();
const baseBranch = getRemoteDefaultBranch();
ensureSupportedBranch(branchName, baseBranch);

if (options.dryRun) {
  const pushPlan = createPushPlan(
    branchName,
    hasRemoteTrackingRef(branchName),
    REMOTE,
  );

  logStep(
    `Would run git pull ${REMOTE} ${baseBranch} --rebase on ${branchName}`,
  );

  if (rebaseAlreadyInProgress) {
    console.log(
      'A rebase is already in progress, so the next real run would continue it.',
    );
  }

  describePushPlan(branchName, pushPlan);
  process.exit(0);
}

if (!rebaseAlreadyInProgress) {
  ensureCleanWorktree();

  logStep(`Rebasing ${branchName} onto ${REMOTE}/${baseBranch}`);

  const pullResult = runGit(['pull', REMOTE, baseBranch, '--rebase'], {
    allowFailure: true,
    live: true,
  });

  if (pullResult.status !== 0 && !isRebaseInProgress()) {
    fail(`git pull ${REMOTE} ${baseBranch} --rebase failed.`);
  }
} else {
  logStep(`Continuing the in-progress rebase for ${branchName}`);
}

if (isRebaseInProgress()) {
  continueRebase();
}

const pushPlan = createPushPlan(
  branchName,
  hasRemoteTrackingRef(branchName),
  REMOTE,
);

if (pushPlan.fetchArgs) {
  logStep(`Fetching ${REMOTE}/${branchName} for force-with-lease`);
  const fetchResult = runGit(pushPlan.fetchArgs, {
    allowFailure: true,
  });

  if (fetchResult.status !== 0) {
    const fetchError = getGitError(
      fetchResult,
      `Unable to fetch ${REMOTE}/${branchName}.`,
    );

    if (isMissingRemoteRefError(fetchError)) {
      logStep(
        `${REMOTE}/${branchName} no longer exists, creating it with --set-upstream`,
      );
      runGit(
        ['push', '--set-upstream', REMOTE, `HEAD:refs/heads/${branchName}`],
        {
          live: true,
        },
      );
      process.exit(0);
    }

    fail(fetchError);
  }
}

logStep(
  pushPlan.hasRemoteTrackingRef
    ? `Force pushing ${branchName} to ${REMOTE}`
    : `Pushing ${branchName} to ${REMOTE}`,
);
runGit(pushPlan.pushArgs, { live: true });
